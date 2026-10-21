import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  Loader2,
  UploadCloud,
  FileCheck,
  Zap,
  Scale,
  Brain,
  ArrowUp,
  Square,
} from 'lucide-react';
import { AgentType, AttachmentItem, ReasoningMode } from '../../types/index.js';
import { LocaleStrings } from '../../locales/en.js';
import { SupportedLanguage } from '../../locales/index.js';
import { useAuth } from '../../context/AuthContext';
import { saveUserCloudDocument } from '../../lib/firebase';

interface ComposerProps {
  onSendMessage: (
    text: string,
    attachments: AttachmentItem[],
    useWebGrounding: boolean,
    agent: AgentType,
    mode: ReasoningMode
  ) => void;
  isLoading: boolean;
  locales: LocaleStrings;
  defaultAgent?: AgentType;
  defaultMode?: ReasoningMode;
  onModeChange?: (mode: ReasoningMode) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  currentLanguage?: SupportedLanguage;
}

const AGENTS: { id: AgentType; label: string; icon: string }[] = [
  { id: 'auto', label: 'Auto (Adaptive)', icon: '✨' },
  { id: 'general', label: 'General Assistant', icon: '🧠' },
  { id: 'marketing', label: 'Poster & Visual Designer', icon: '🎨' },
  { id: 'tutor', label: 'Student Tutor', icon: '🎓' },
  { id: 'developer', label: 'Code Architect', icon: '💻' },
  { id: 'researcher', label: 'Deep Researcher', icon: '🔍' },
  { id: 'startup', label: 'Startup Founder', icon: '🚀' },
  { id: 'analyst', label: 'Business Analyst', icon: '📊' },
  { id: 'writer', label: 'Creative Writer', icon: '✍' },
];

const REASONING_MODES: {
  id: ReasoningMode;
  label: string;
  icon: string;
  desc: string;
  badgeClass: string;
  activeTagClass: string;
}[] = [
  {
    id: 'flash',
    label: 'Flash',
    icon: '⚡',
    desc: 'Ultra-fast replies & direct answers with zero useless talks',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    activeTagClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/15',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: '⚖️',
    desc: 'Balanced depth, structured logic & practical examples',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    activeTagClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15',
  },
  {
    id: 'deep',
    label: 'Deep',
    icon: '🧠',
    desc: 'Extended thinking, multi-step problem solving & rigorous proofs',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    activeTagClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/15',
  },
];

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isLoading,
  locales,
  defaultAgent = 'auto',
  defaultMode = 'flash',
  onModeChange,
  initialPrompt = '',
  onClearInitialPrompt,
  currentLanguage = 'en',
}) => {
  const { currentUser } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [useWebGrounding, setUseWebGrounding] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(defaultAgent);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>(defaultMode);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'recording' | 'error'>('idle');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  // Sync mode whenever parent defaultMode updates
  useEffect(() => {
    if (defaultMode) {
      setReasoningMode(defaultMode);
    }
  }, [defaultMode]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const textBeforeRecordRef = useRef('');
  const textRef = useRef(text);
  const isRecordingRef = useRef(false);
  const userRequestedStopRef = useRef(false);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Keep textRef synchronously updated with text state
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Autofocus input on initial load and whenever New Chat resets the composer
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Sync initialPrompt if provided (e.g. from Prompt Library or Quick Actions)
  useEffect(() => {
    if (initialPrompt) {
      setText(initialPrompt);
      textRef.current = initialPrompt;
      if (onClearInitialPrompt) onClearInitialPrompt();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 50);
    }
  }, [initialPrompt]);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  // Voice recording using Web Speech Recognition with MediaRecorder fallback
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    setMicErrorMessage(null);
    userRequestedStopRef.current = false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Determine recognition language based on active app language
    const speechLang =
      currentLanguage === 'te'
        ? 'te-IN'
        : currentLanguage === 'hi'
        ? 'hi-IN'
        : navigator.language || 'en-US';

    // 1. Try native Web Speech API (Chrome, Edge, Safari)
    if (SpeechRecognition) {
      setMicStatus('requesting');

      // Safety timeout: Never stay stuck in 'requesting' state
      const requestSafetyTimer = setTimeout(() => {
        setMicStatus((current) => (current === 'requesting' ? 'idle' : current));
      }, 3500);

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = speechLang;

        textBeforeRecordRef.current = (textRef.current || text).trim();

        recognition.onstart = () => {
          clearTimeout(requestSafetyTimer);
          setIsRecording(true);
          isRecordingRef.current = true;
          setMicStatus('recording');
          setRecordSeconds(0);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setRecordSeconds((s) => s + 1);
          }, 1000);
        };

        recognition.onresult = (event: any) => {
          let sessionFinal = '';
          let sessionInterim = '';

          // Loop through all chunks in current recognition session
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            const transcriptChunk = res[0]?.transcript || '';
            if (res.isFinal) {
              sessionFinal += (sessionFinal ? ' ' : '') + transcriptChunk.trim();
            } else {
              sessionInterim += (sessionInterim ? ' ' : '') + transcriptChunk.trim();
            }
          }

          const currentSpeech = [sessionFinal, sessionInterim].filter(Boolean).join(' ');
          const combined = textBeforeRecordRef.current
            ? `${textBeforeRecordRef.current} ${currentSpeech}`
            : currentSpeech;

          textRef.current = combined;
          setText(combined);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition status event:', e.error);
          if (e.error === 'no-speech') {
            // Natural pause in speech, keep session listening
            return;
          }
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setMicStatus('error');
            setMicErrorMessage(
              'Microphone access was blocked. Please click the permissions/lock icon in your browser address bar to allow microphone.'
            );
            stopRecording();
            return;
          }
          if (e.error !== 'aborted') {
            console.warn(`Speech recognition stopped: ${e.error}`);
          }
        };

        recognition.onend = () => {
          // If browser closed session due to silence or timeout without user requesting stop, restart
          if (!userRequestedStopRef.current && isRecordingRef.current) {
            try {
              recognition.start();
              return;
            } catch (restartErr) {
              // If restart fails, stop cleanly
            }
          }
          stopRecording();
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setMicStatus('error');
        setMicErrorMessage('Unable to initialize voice recognition. Please try clicking the mic again.');
        stopRecording();
      }
    } else {
      // 2. Fallback: Browser lacks Web Speech API (e.g. Firefox) -> Record voice audio clip via MediaRecorder
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicStatus('error');
        setMicErrorMessage('Voice recording is not supported in this browser.');
        return;
      }

      try {
        setMicStatus('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStreamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            const audioAttachment: AttachmentItem = {
              id: `voice_${Date.now()}`,
              name: `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).webm`,
              type: mimeType,
              size: audioBlob.size,
              data: base64Data,
            };
            setAttachments((prev) => [...prev, audioAttachment]);
          };
          reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start(250);
        setIsRecording(true);
        isRecordingRef.current = true;
        setMicStatus('recording');
        setRecordSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
      } catch (mediaErr: any) {
        console.error('MediaRecorder error:', mediaErr);
        setMicStatus('error');
        setMicErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
      }
    }
  };

  const stopRecording = () => {
    userRequestedStopRef.current = true;
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    // Release audio stream hardware tracks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setMicStatus('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isLoading) return;

    // Use current synchronized textRef so pending transcript is never missed
    const messageToSend = (textRef.current || text).trim();
    if (!messageToSend && attachments.length === 0) return;

    if (isRecording) {
      stopRecording();
    }

    onSendMessage(messageToSend, attachments, useWebGrounding, selectedAgent, reasoningMode);
    textRef.current = '';
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Unlimited file processor for all image and document formats
  const processFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isTextFile =
        file.type.startsWith('text/') ||
        file.name.match(/\.(js|jsx|ts|tsx|py|java|c|cpp|cs|go|rs|php|rb|swift|kt|sql|html|css|json|yaml|yml|md|txt|csv|tsv|xml|sh|env)$/i);

      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const newAtt: AttachmentItem = {
            id: fileId,
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            text: content,
          };
          setAttachments((prev) => [...prev, newAtt]);

          // Asynchronously persist to cloud documents if authenticated
          if (currentUser?.uid) {
            saveUserCloudDocument(currentUser.uid, {
              id: fileId,
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              createdAt: new Date().toISOString(),
            }).catch(() => {});
          }
        };
        reader.readAsText(file);
      } else {
        // Image, PDF, Word, Excel, or binary doc (read as Base64)
        const reader = new FileReader();
        reader.onload = (event) => {
          const fullDataUrl = event.target?.result as string;
          const base64Data = fullDataUrl.split(',')[1] || fullDataUrl;
          const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

          const newAtt: AttachmentItem = {
            id: fileId,
            name: file.name,
            type: mimeType,
            size: file.size,
            data: base64Data,
          };
          setAttachments((prev) => [...prev, newAtt]);

          // Asynchronously persist to cloud documents if authenticated
          if (currentUser?.uid) {
            saveUserCloudDocument(currentUser.uid, {
              id: fileId,
              name: file.name,
              type: mimeType,
              size: file.size,
              createdAt: new Date().toISOString(),
            }).catch(() => {});
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAllAttachments = () => {
    setAttachments([]);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-3 sm:px-4 pb-4">
      {/* Hidden file input supporting unlimited files and formats */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
        accept="image/*,audio/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.tsv,.json,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.html,.css,.sql,.yaml,.yml,.xml,.sh"
      />

      {/* Main Composer Box with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-[28px] glass-dock transition-all focus-within:border-white/80 dark:focus-within:border-white/30 focus-within:shadow-[0_25px_65px_rgba(245,158,11,0.18)] dark:focus-within:shadow-[0_30px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/30 dark:ring-white/10 ${
          isDragging
            ? '!border-amber-500 ring-2 ring-amber-500/40 !bg-amber-500/15'
            : ''
        }`}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-amber-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl pointer-events-none animate-in fade-in duration-150">
            <UploadCloud className="h-10 w-10 text-amber-500 animate-bounce mb-1" />
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              Drop unlimited images & documents here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG, PDF, Word, Excel, Code & Markdown supported
            </p>
          </div>
        )}

        {/* Active Attachments Preview List */}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-2 p-3 pb-2 border-b border-white/30 dark:border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {attachments.length} {attachments.length === 1 ? 'file' : 'files'} attached • Unlimited Uploads
              </span>
              <button
                type="button"
                onClick={clearAllAttachments}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 rounded-xl border border-white/50 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  {att.type.startsWith('image/') ? (
                    <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                  ) : att.type.includes('pdf') ? (
                    <FileCheck className="h-3.5 w-3.5 text-rose-500" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  <span className="max-w-[140px] truncate font-medium">{att.name}</span>
                  <span className="text-[10px] text-slate-400">
                    ({att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${(att.size / 1024).toFixed(0)} KB`})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    title="Remove attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mic Permission / Error Notification Banner */}
        {micErrorMessage && (
          <div className="flex items-center justify-between bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 border-b border-amber-500/20 animate-in fade-in">
            <span className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              {micErrorMessage}
            </span>
            <button
              type="button"
              onClick={() => setMicErrorMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Recording Banner if active */}
        {isRecording && (
          <div className="flex items-center justify-between bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 border-b border-rose-500/20 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span>Listening... Speak into your mic ({formatTimer(recordSeconds)})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-lg bg-rose-600/80 px-2.5 py-1 text-white hover:bg-rose-700 font-medium transition text-xs shadow-sm"
              >
                Insert Text
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-white hover:bg-emerald-700 font-semibold transition text-xs shadow-sm flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Send Now
              </button>
            </div>
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            reasoningMode === 'deep'
              ? 'Ask SparkMind (🧠 Deep Mode: Extended thinking & exhaustive proofs)...'
              : reasoningMode === 'medium'
              ? 'Ask SparkMind (⚖️ Medium Mode: Structured explanation & practical code)...'
              : 'Ask SparkMind (⚡ Flash Mode: Instant direct answer)...'
          }
          disabled={isLoading}
          rows={1}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none max-h-[220px] leading-relaxed"
        />

        {/* Toolbar Controls */}
        <div className="flex items-center justify-between px-3.5 pb-3 pt-1">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={locales.composer.attachFile}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Reasoning Mode Selector Pill (Flash / Medium / Deep) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowModeMenu(!showModeMenu);
                  setShowAgentMenu(false);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                  REASONING_MODES.find((m) => m.id === reasoningMode)?.badgeClass
                }`}
                title="Reasoning mode: Flash (Fast), Medium (Balanced), or Deep (Extended Thinking)"
              >
                <span>{REASONING_MODES.find((m) => m.id === reasoningMode)?.icon}</span>
                <span className="font-bold">{REASONING_MODES.find((m) => m.id === reasoningMode)?.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {/* Mode Selector Dropdown */}
              {showModeMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl border border-white/50 dark:border-white/15 bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Reasoning & Speed Mode
                  </div>
                  <div className="space-y-1 mt-1">
                    {REASONING_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setReasoningMode(m.id);
                          onModeChange?.(m.id);
                          setShowModeMenu(false);
                        }}
                        className={`flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition cursor-pointer ${
                          reasoningMode === m.id
                            ? 'bg-amber-500/15 dark:bg-amber-500/20 ring-1 ring-amber-500/40 shadow-sm'
                            : 'hover:bg-white/70 dark:hover:bg-white/10'
                        }`}
                      >
                        <span className="text-base pt-0.5">{m.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {m.label} Mode
                            </span>
                            {reasoningMode === m.id && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${m.activeTagClass}`}>
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {m.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Web Grounding Toggle */}
            <button
              type="button"
              onClick={() => setUseWebGrounding(!useWebGrounding)}
              title={useWebGrounding ? locales.composer.webSearchActive : locales.composer.webSearch}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer backdrop-blur-xl ${
                useWebGrounding
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 border border-transparent'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Web Search</span>
            </button>

            {/* Agent Selector Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-xl border border-transparent hover:border-white/40"
              >
                <span>{AGENTS.find((a) => a.id === selectedAgent)?.icon}</span>
                <span className="hidden md:inline">{AGENTS.find((a) => a.id === selectedAgent)?.label}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Agent Selector Dropdown */}
              {showAgentMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-52 rounded-2xl border border-white/50 dark:border-white/15 bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Agent Persona
                  </div>
                  {AGENTS.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setShowAgentMenu(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left transition cursor-pointer ${
                        selectedAgent === agent.id
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>{agent.icon}</span>
                      <span>{agent.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Microphone Button with Real-time state */}
            <button
              type="button"
              onClick={toggleRecording}
              title={
                isRecording
                  ? locales.composer.stopRecording
                  : micStatus === 'requesting'
                  ? 'Requesting microphone permission...'
                  : locales.composer.voiceInput
              }
              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50'
                  : micStatus === 'requesting'
                  ? 'bg-amber-500/20 text-amber-600 animate-pulse'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200'
              }`}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : micStatus === 'requesting' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Send / Generating Button */}
          {isLoading ? (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-white/15 text-amber-500 cursor-wait shadow-sm"
              title="Generating answer..."
            >
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() && attachments.length === 0}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                !text.trim() && attachments.length === 0
                  ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md hover:scale-105 active:scale-95 cursor-pointer'
              }`}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Helpful Hint / Disclaimer Footer - ChatGPT / Gemini style */}
      <div className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        SparkMind can make mistakes. Verify important info.
      </div>
    </div>
  );
};
