/**
 * SparkMind Production-Grade Speech Synthesis Engine
 * Dual-Engine Architecture:
 * 1. Native Web Speech API with sentence chunking & instant voice detection
 * 2. Automatic Seamless Fallback to Server-Side Gemini Studio TTS (/api/tts with gemini-3.8-flash-lite-tts)
 * 3. Bulletproof unpause watchdogs, Chrome GC retention, and iframe error recovery
 */

export interface SpeechOptions {
  messageId?: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  useStudioVoice?: boolean;
}

// Global strong reference store to prevent Chrome V8 Garbage Collection of utterances
const activeUtterances = new Set<SpeechSynthesisUtterance>();
if (typeof window !== 'undefined') {
  (window as any).__sparkActiveUtterances = activeUtterances;
}

let activeAudioElement: HTMLAudioElement | null = null;
let currentMessageId: string | null = null;
let watchdogTimer: any = null;
let browserStartTimeout: any = null;
const speechListeners: Set<(speaking: boolean, msgId: string | null) => void> = new Set();

export function subscribeSpeechState(listener: (speaking: boolean, msgId: string | null) => void): () => void {
  speechListeners.add(listener);
  return () => {
    speechListeners.delete(listener);
  };
}

function notifyState(speaking: boolean, msgId: string | null = null) {
  currentMessageId = speaking ? msgId : null;
  speechListeners.forEach((fn) => {
    try {
      fn(speaking, currentMessageId);
    } catch {
      // ignore
    }
  });
}

/**
 * Voice caching and loading
 */
let cachedVoices: SpeechSynthesisVoice[] = [];

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
    }
  } catch {
    // ignore
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  getAvailableVoices();
  try {
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        getAvailableVoices();
      });
    } else if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        getAvailableVoices();
      };
    }
  } catch {
    // ignore
  }
}

/**
 * Clean markdown, code blocks, URLs, and formatters into natural conversational speech
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Replace code blocks with concise summary
    .replace(/```[\w-]*\n[\s\S]*?```/g, ' Code snippet omitted. ')
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown image tags
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Replace markdown links with just label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold and italic markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // Remove blockquotes and list bullets
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove tables and separators
    .replace(/\|.*?\|/g, '')
    .replace(/[-=_]{3,}/g, '')
    // Replace URLs with readable placeholder
    .replace(/https?:\/\/\S+/g, ' link ')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove citation markers like [1], [2], [source: ...]
    .replace(/\[\d+\]/g, '')
    .replace(/\[source:[^\]]+\]/gi, '')
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Break long text into natural sentence chunks
 */
export function splitIntoNaturalChunks(text: string, maxLen: number = 180): string[] {
  if (!text) return [];
  if (text.length <= maxLen) return [text];

  const rawSentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).trim().length <= maxLen) {
      currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      if (trimmed.length > maxLen) {
        // Split long clause by comma or semicolon
        const parts = trimmed.split(/([,;:]\s+)/);
        let sub = '';
        for (const p of parts) {
          if ((sub + p).length <= maxLen) {
            sub += p;
          } else {
            if (sub.trim()) chunks.push(sub.trim());
            sub = p;
          }
        }
        if (sub.trim()) currentChunk = sub.trim();
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Select the best natural voice based on language and system availability
 */
export function pickBestVoice(text: string): { voice?: SpeechSynthesisVoice; lang: string } {
  const voices = getAvailableVoices();
  const isTelugu = /[\u0C00-\u0C7F]/.test(text);
  const isHindi = /[\u0900-\u097F]/.test(text);

  if (isTelugu) {
    const teVoice = voices.find((v) => v.lang.toLowerCase().startsWith('te'));
    return { voice: teVoice, lang: 'te-IN' };
  }

  if (isHindi) {
    const hiVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
    return { voice: hiVoice, lang: 'hi-IN' };
  }

  // English / Western
  const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const preferred =
    enVoices.find((v) => /natural|neural|online/i.test(v.name)) ||
    enVoices.find((v) => /google/i.test(v.name)) ||
    enVoices.find((v) => /samantha|daniel|karen|alex/i.test(v.name)) ||
    enVoices[0];

  return { voice: preferred, lang: preferred?.lang || 'en-US' };
}

function startWatchdog() {
  stopWatchdog();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Gentle watchdog: unpauses synthesizer if browser gets stuck in paused state
  watchdogTimer = setInterval(() => {
    try {
      if (window.speechSynthesis && window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // ignore
    }
  }, 2500);
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
  if (browserStartTimeout) {
    clearTimeout(browserStartTimeout);
    browserStartTimeout = null;
  }
}

/**
 * Stop any ongoing speech across both audio elements and speechSynthesis
 */
export function stopSpeaking(): void {
  stopWatchdog();

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // ignore
    }
  }

  activeUtterances.clear();
  notifyState(false, null);
}

export function isCurrentlySpeaking(messageId?: string): boolean {
  if (!currentMessageId) return false;
  if (!messageId) return true;
  return currentMessageId === messageId;
}

/**
 * Primary read aloud function
 * Initiates speech with dual engine fallback:
 * If browser engine fails, errors, or gets blocked in iframe, studio audio kicks in immediately.
 */
export function speakText(text: string, options: SpeechOptions = {}): () => void {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    options.onError?.(new Error('No readable text content available.'));
    return () => {};
  }

  // Always stop previous speech first
  stopSpeaking();

  // If studio voice was explicitly requested
  if (options.useStudioVoice) {
    speakWithStudioAudio(clean, options).catch(() => {
      speakWithBrowserEngine(clean, options);
    });
    return stopSpeaking;
  }

  // Check Web Speech API support
  const hasBrowserSpeech =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  if (!hasBrowserSpeech) {
    speakWithStudioAudio(clean, options).catch((err) => {
      options.onError?.(err || new Error('Speech synthesis is not supported.'));
      notifyState(false, null);
    });
    return stopSpeaking;
  }

  // Try browser engine first for zero network latency, with seamless studio fallback
  speakWithBrowserEngine(clean, options);

  return stopSpeaking;
}

/**
 * Browser SpeechSynthesis player with fallback to studio audio on failure
 */
function speakWithBrowserEngine(text: string, options: SpeechOptions) {
  try {
    const synth = window.speechSynthesis;

    // Wake up synthesis engine
    if (synth.paused) {
      synth.resume();
    }

    const chunks = splitIntoNaturalChunks(text, 180);
    if (chunks.length === 0) {
      options.onEnd?.();
      return;
    }

    const { voice, lang } = pickBestVoice(text);
    let remaining = chunks.length;
    let hasStarted = false;

    notifyState(true, options.messageId || null);
    startWatchdog();

    // Fallback timer: if browser speech synthesis doesn't trigger onstart within 500ms
    // (very common in sandboxed iframes or browsers without local voice assets),
    // automatically fallback to high quality studio audio (/api/tts)!
    browserStartTimeout = setTimeout(() => {
      if (!hasStarted) {
        console.info('Browser speech engine timed out, falling back to Studio AI Voice...');
        stopSpeaking();
        speakWithStudioAudio(text, options).catch((e) => {
          options.onError?.(e);
        });
      }
    }, 500);

    chunks.forEach((chunkText) => {
      const utterance = new SpeechSynthesisUtterance(chunkText);
      activeUtterances.add(utterance);

      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || lang;
      } else {
        utterance.lang = lang || 'en-US';
      }

      utterance.onstart = () => {
        if (!hasStarted) {
          hasStarted = true;
          if (browserStartTimeout) {
            clearTimeout(browserStartTimeout);
            browserStartTimeout = null;
          }
          options.onStart?.();
        }
      };

      utterance.onend = () => {
        activeUtterances.delete(utterance);
        remaining--;
        if (remaining <= 0) {
          stopWatchdog();
          notifyState(false, null);
          options.onEnd?.();
        }
      };

      utterance.onerror = (e) => {
        activeUtterances.delete(utterance);
        remaining--;

        // If canceled by deliberate stop, do nothing
        if (e.error === 'canceled' || e.error === 'interrupted') {
          if (remaining <= 0) {
            stopWatchdog();
            notifyState(false, null);
            options.onEnd?.();
          }
          return;
        }

        // On browser synthesis failure (e.g. not-allowed in iframe, audio-busy), fallback to studio audio!
        console.warn('SpeechSynthesis utterance error:', e.error, 'switching to Studio Audio fallback.');
        stopWatchdog();
        speakWithStudioAudio(text, options).catch((fallbackErr) => {
          notifyState(false, null);
          options.onError?.(fallbackErr || e);
        });
      };

      synth.speak(utterance);
    });

    if (synth.paused) {
      synth.resume();
    }
  } catch (err) {
    console.warn('speakWithBrowserEngine threw error:', err, 'falling back to studio audio.');
    speakWithStudioAudio(text, options).catch((fallbackErr) => {
      stopSpeaking();
      options.onError?.(fallbackErr || err);
    });
  }
}

/**
 * Server-side audio player using Gemini TTS endpoint (/api/tts powered by gemini-3.8-flash-lite-tts)
 */
export async function speakWithStudioAudio(text: string, options: SpeechOptions): Promise<boolean> {
  try {
    notifyState(true, options.messageId || null);

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 3000),
        voice: options.voiceName || 'Kore',
      }),
    });

    if (!res.ok) {
      notifyState(false, null);
      return false;
    }

    const data = await res.json();
    if (data.success && data.audioBase64) {
      const mime = data.mimeType || 'audio/wav';
      const audioUrl = `data:${mime};base64,${data.audioBase64}`;

      const audio = new Audio(audioUrl);
      activeAudioElement = audio;

      audio.onplay = () => {
        options.onStart?.();
      };

      audio.onended = () => {
        activeAudioElement = null;
        notifyState(false, null);
        options.onEnd?.();
      };

      audio.onerror = (e) => {
        activeAudioElement = null;
        notifyState(false, null);
        options.onError?.(e);
      };

      await audio.play();
      return true;
    }

    notifyState(false, null);
    return false;
  } catch (err) {
    notifyState(false, null);
    return false;
  }
}
