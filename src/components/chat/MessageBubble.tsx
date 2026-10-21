import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Edit3,
  Share2,
  RotateCw,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Globe,
  FileText,
  Sparkles,
  ExternalLink,
  Code2,
  Zap,
  Download,
  Maximize2,
  X,
  Image as ImageIcon,
  Pin,
} from 'lucide-react';
import { ChatMessage, GroundingSource } from '../../types/index.js';
import { LocaleStrings } from '../../locales/en.js';
import { SparkLogo } from '../common/SparkLogo.js';
import { CodeBlockWithRunner } from './CodeBlockWithRunner.js';
import { speakText, stopSpeaking, subscribeSpeechState } from '../../lib/speech.js';
import { WhatsAppIcon } from '../common/WhatsAppIcon.js';

interface MessageBubbleProps {
  message: ChatMessage;
  locales: LocaleStrings;
  onEditSubmit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
  onSaveAnswer?: (message: ChatMessage) => void;
  onFeedback?: (messageId: string, isLike: boolean) => void;
  onShareConversation?: () => void;
  onTogglePin?: (messageId: string) => void;
  isStreaming?: boolean;
  searchQuery?: string;
  isCurrentSearchMatch?: boolean;
}

function highlightQueryInNode(children: React.ReactNode, query?: string): React.ReactNode {
  if (!query || !query.trim()) return children;
  if (typeof children === 'string') {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = children.split(regex);
    if (parts.length <= 1) return children;
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-amber-300 dark:bg-amber-400 text-slate-900 font-bold px-0.5 rounded-xs shadow-xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => (
      <React.Fragment key={i}>{highlightQueryInNode(child, query)}</React.Fragment>
    ));
  }
  return children;
}

const CleanImagePreview: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  // Clean URL to guarantee nologo and no watermark flags for external services
  let initialUrl = src;
  if (initialUrl.includes('pollinations.ai') && !initialUrl.includes('nologo=true')) {
    initialUrl += (initialUrl.includes('?') ? '&' : '?') + 'nologo=true&nofeed=true';
  }

  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      if (currentUrl.startsWith('data:')) {
        // Direct download for base64 image data (Gemini generated)
        const a = document.createElement('a');
        a.href = currentUrl;
        const safeName = (alt || 'sparkmind-artwork')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        a.download = `${safeName || 'artwork'}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Fetch original blob for external URL to download full-resolution PNG
        const res = await fetch(currentUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const safeName = (alt || 'sparkmind-artwork')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        a.download = `${safeName || 'artwork'}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.href = currentUrl;
      fallbackAnchor.target = '_blank';
      fallbackAnchor.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();
      document.body.removeChild(fallbackAnchor);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const isGemini2K = currentUrl.startsWith('data:') || currentUrl.includes('2048') || currentUrl.includes('1920');

  return (
    <>
      <span className="block group relative my-4 overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xl p-2 shadow-lg">
        {/* Full-Fidelity Image Container */}
        <span
          onClick={() => isLoaded && setIsLightboxOpen(true)}
          className="block relative overflow-hidden rounded-xl cursor-zoom-in group/img bg-slate-900/40 min-h-[220px]"
        >
          {/* Animated Loading Skeleton while pixels generate */}
          {!isLoaded && !hasError && (
            <span className="flex flex-col items-center justify-center p-8 py-14 text-center w-full min-h-[300px] bg-gradient-to-br from-slate-900/90 via-purple-950/60 to-slate-900/90 rounded-xl">
              <span className="relative flex items-center justify-center mb-4">
                <span className="absolute -inset-2 rounded-full bg-purple-500/30 blur-md animate-ping" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-0.5 shadow-xl">
                  <span className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950/90">
                    <Sparkles className="h-7 w-7 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  </span>
                </span>
              </span>
              <span className="block text-sm sm:text-base font-bold text-white mb-1">
                🎨 Generating High-Resolution Artwork...
              </span>
              <span className="block text-xs text-purple-200/80 max-w-sm mb-4">
                SparkMind AI Neural Canvas is rendering lighting, textures, and details.
              </span>
              <span className="block w-44 h-1.5 bg-white/15 rounded-full overflow-hidden">
                <span className="block h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full animate-pulse w-3/4" />
              </span>
            </span>
          )}

          {/* Fallback Error Card if image fails on specific network */}
          {hasError && (
            <span className="flex flex-col items-center justify-center p-6 py-10 text-center w-full min-h-[240px] bg-slate-900/90 rounded-xl border border-rose-500/20">
              <ImageIcon className="h-10 w-10 text-rose-400 mb-2" />
              <span className="block text-sm font-bold text-white mb-1">
                Visual Render Refresh
              </span>
              <span className="block text-xs text-slate-300 max-w-sm mb-3">
                Unable to load preview on your current network. Click below to reload with turbo speed.
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHasError(false);
                  setIsLoaded(false);
                  const cleanPrompt = encodeURIComponent(alt || 'creative poster artwork');
                  const seed = Math.floor(Math.random() * 999999);
                  setCurrentUrl(`https://image.pollinations.ai/prompt/${cleanPrompt}?width=800&height=800&model=turbo&nologo=true&seed=${seed}`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md transition cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry Rendering</span>
              </button>
            </span>
          )}

          <span className={`overflow-hidden w-full items-center justify-center transition-all duration-300 ${isLoaded ? 'flex' : 'hidden'}`}>
            <img
              src={currentUrl}
              alt={alt || 'SparkMind AI Generated Artwork'}
              onLoad={() => {
                setIsLoaded(true);
                setHasError(false);
              }}
              onError={() => {
                // If high-res timed out, auto-retry with fast turbo model once
                if (!currentUrl.includes('model=turbo')) {
                  const fallback = currentUrl.replace(/model=[^&]+/, 'model=turbo');
                  setCurrentUrl(fallback);
                } else {
                  setHasError(true);
                }
              }}
              className="w-full max-w-xl mx-auto rounded-xl object-contain max-h-[560px] shadow-sm transition duration-300 group-hover/img:scale-[1.01]"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </span>

          {/* High-Resolution Quality Badge */}
          {isLoaded && (
            <span className="absolute top-2.5 left-2.5 opacity-90 transition-opacity">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/85 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white shadow-sm border border-white/10">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>{isGemini2K ? 'Ultra HD 2K Quality' : 'Studio Quality Artwork'}</span>
              </span>
            </span>
          )}

          {/* Floating Action Overlay on Hover */}
          {isLoaded && (
            <span className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2 pointer-events-none">
              <span className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={handleDownload}
                  title="Download Original High-Res PNG"
                  disabled={downloading}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[11px]">{downloading ? 'Downloading...' : 'Download Full HD PNG'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Image Link"
                  className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  title="View Fullscreen"
                  className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </span>
          )}
        </span>
      </span>

      {/* Lightbox Modal rendered cleanly outside through portal */}
      {isLightboxOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[92vh] flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-900/95 border border-white/10 shadow-2xl p-2"
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between px-3 py-2 border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold truncate max-w-[320px] sm:max-w-md">
                  {alt || 'AI Generated Artwork (Full Resolution)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-3 py-1.5 text-xs font-bold text-slate-950 transition cursor-pointer shadow-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Full HD Image</span>
                </button>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Preview Image */}
            <div className="overflow-auto max-h-[80vh] p-2 flex items-center justify-center">
              <img
                src={currentUrl}
                alt={alt || 'High-Resolution AI Artwork'}
                className="max-h-[78vh] w-auto rounded-xl object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  locales,
  onEditSubmit,
  onRegenerate,
  onSaveAnswer,
  onFeedback,
  onShareConversation,
  onTogglePin,
  isStreaming,
  searchQuery,
  isCurrentSearchMatch,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedLocally, setSavedLocally] = useState(message.saved || false);

  // Sync state with global speech engine
  useEffect(() => {
    const unsubscribe = subscribeSpeechState((speaking, currentMsgId) => {
      setIsSpeaking(speaking && currentMsgId === message.id);
    });
    return unsubscribe;
  }, [message.id]);

  // Cleanup speech ONLY when component unmounts
  const speakingRef = useRef(isSpeaking);
  speakingRef.current = isSpeaking;

  useEffect(() => {
    return () => {
      if (speakingRef.current) {
        stopSpeaking();
      }
    };
  }, []);

  const getWhatsAppMessageUrl = (content: string) => {
    const clean = content
      .replace(/```[\w-]*\n([\s\S]*?)```/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .slice(0, 1500)
      .trim();
    const prefix = isUser ? '💬 *My Prompt for SparkMind AI:*' : '🤖 *SparkMind AI Answer:*';
    const shareText = `${prefix}\n\n${clean}\n\n_Shared from SparkMind AI_`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (onShareConversation) {
      onShareConversation();
      return;
    }
    if (navigator.share) {
      navigator.share({
        title: 'SparkMind Conversation',
        text: message.content,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleSpeak = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Toggle stop if already speaking
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    // Direct trigger
    setIsSpeaking(true);
    speakText(message.content, {
      messageId: message.id,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (err) => {
        console.warn('Speech playback issue:', err);
        setIsSpeaking(false);
      },
    });
  };

  const handleSave = () => {
    setSavedLocally(true);
    if (onSaveAnswer) {
      onSaveAnswer(message);
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`w-full py-2 sm:py-3 transition-all duration-300 scroll-mt-24 ${
        isCurrentSearchMatch
          ? 'ring-2 ring-amber-500 bg-amber-500/10 rounded-3xl shadow-lg shadow-amber-500/10'
          : ''
      }`}
    >
      <div className="max-w-3xl sm:max-w-4xl mx-auto px-4 sm:px-6">
        {isUser ? (
          /* User Message: Sleek right-aligned bubble without bulky avatar (ChatGPT / Gemini style) */
          <div className="flex flex-col items-end group">
            {/* User Attachments Preview */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 justify-end">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 rounded-2xl border border-white/50 dark:border-white/15 bg-white/75 dark:bg-slate-800/75 backdrop-blur-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    {att.type.startsWith('image/') && att.data ? (
                      <img
                        src={`data:${att.type};base64,${att.data}`}
                        alt={att.name}
                        className="h-4 w-4 rounded object-cover"
                      />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className="max-w-[150px] truncate font-medium">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pinned Context Banner above User Bubble */}
            {message.isPinned && (
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-sm self-end">
                <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>Pinned Context</span>
              </div>
            )}

            {/* Bubble */}
            <div className={`rounded-[24px] glass-bubble-user text-slate-900 dark:text-slate-100 px-5 py-3 text-sm sm:text-base leading-relaxed break-words max-w-[85%] sm:max-w-[75%] shadow-lg ${message.isPinned ? 'ring-2 ring-amber-500/40 shadow-amber-500/10' : ''}`}>
              {isEditing ? (
                <div className="flex flex-col gap-2 min-w-[260px] sm:min-w-[320px]">
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full min-h-[90px] rounded-xl border border-white/40 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditedText(message.content);
                        setIsEditing(false);
                      }}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10"
                    >
                      {locales.actions.cancel}
                    </button>
                    <button
                      onClick={() => {
                        if (onEditSubmit && editedText.trim()) {
                          onEditSubmit(message.id, editedText);
                        }
                        setIsEditing(false);
                      }}
                      className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow hover:from-amber-600 hover:to-orange-600"
                    >
                      {locales.actions.saveAndSubmit}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap font-normal select-text">
                  {highlightQueryInNode(message.content, searchQuery)}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onTogglePin && (
                <button
                  type="button"
                  onClick={() => onTogglePin(message.id)}
                  title={message.isPinned ? "Unpin message" : "Pin message as important context"}
                  aria-label={message.isPinned ? "Unpin message" : "Pin message"}
                  className={`rounded-lg p-1 transition cursor-pointer ${
                    message.isPinned
                      ? 'text-amber-500 bg-amber-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Pin className={`h-3.5 w-3.5 ${message.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              )}
              <button
                onClick={handleCopy}
                title={locales.actions.copy}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleSpeak}
                title={isSpeaking ? (locales.actions.stopSpeaking || 'Stop reading') : (locales.actions.readAloud || 'Read aloud')}
                aria-label={isSpeaking ? 'Stop reading aloud' : 'Read message aloud'}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-amber-500" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <a
                href={getWhatsAppMessageUrl(message.content)}
                target="_blank"
                rel="noopener noreferrer"
                title="Share prompt on WhatsApp"
                className="rounded-lg p-1 text-slate-400 hover:text-[#25D366] transition inline-flex items-center justify-center cursor-pointer"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => setIsEditing(true)}
                title={locales.actions.edit}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Assistant Message: Open canvas layout with small glowing logo (ChatGPT / Gemini style) */
          <div className="flex gap-3 sm:gap-4 items-start w-full group">
            {/* Sleek SparkMind emblem */}
            <div className="flex-shrink-0 mt-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-white/15 shadow-sm backdrop-blur-xl">
                <SparkLogo className="h-4.5 w-4.5" size={18} />
              </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 min-w-0">
              {/* Badges / Grounding Info */}
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                {message.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 backdrop-blur-md px-2.5 py-0.5 font-semibold text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-sm">
                    <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>Pinned Context</span>
                  </span>
                )}
                {message.groundingType === 'web' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 backdrop-blur-md px-2.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    <Globe className="h-3 w-3" />
                    Live Web-Grounded
                  </span>
                )}
                {message.groundingType === 'file' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 backdrop-blur-md px-2.5 py-0.5 font-medium text-blue-600 dark:text-blue-300 border border-blue-500/30">
                    <FileText className="h-3 w-3" />
                    Grounded on Attached File
                  </span>
                )}
                {(message.reasoningMode || (message.role === 'model' && 'flash')) && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 font-bold text-xs border backdrop-blur-md shadow-xs ${
                      (message.reasoningMode || 'flash') === 'flash'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        : (message.reasoningMode || 'flash') === 'deep'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 ring-1 ring-purple-500/20 font-bold'
                        : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40'
                    }`}
                    title={
                      (message.reasoningMode || 'flash') === 'deep'
                        ? 'Generated with Deep Reasoning Mode (Extended Cognitive Chain-of-Thought)'
                        : (message.reasoningMode || 'flash') === 'medium'
                        ? 'Generated with Medium Mode (Structured Practical Breakdown)'
                        : 'Generated with Flash Mode (Ultra-Fast & Direct Answer)'
                    }
                  >
                    {(message.reasoningMode || 'flash') === 'flash' && '⚡ Flash Mode • Direct Answer'}
                    {(message.reasoningMode || 'flash') === 'medium' && '⚖️ Medium Mode • Structured Breakdown'}
                    {(message.reasoningMode || 'flash') === 'deep' && '🧠 Deep Mode • Extended Thinking'}
                  </span>
                )}
              </div>

              {/* Markdown Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-900 dark:text-slate-50 font-normal break-words p-4 sm:p-5 rounded-2xl glass-bubble-ai shadow-md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    blockquote({ children }) {
                      return (
                        <div className="my-3 rounded-xl border-l-4 border-purple-500 bg-purple-500/10 dark:bg-purple-950/20 px-4 py-2.5 text-xs sm:text-sm text-purple-900 dark:text-purple-200 shadow-xs">
                          <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400 mb-1">
                            <span>🧠 Cognitive Thought Trace</span>
                          </div>
                          <div className="space-y-1">{children}</div>
                        </div>
                      );
                    },
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');

                      if (match) {
                        return (
                          <CodeBlockWithRunner language={match[1]} code={codeContent}>
                            {children}
                          </CodeBlockWithRunner>
                        );
                      }

                      return (
                        <code className="rounded-md bg-slate-200/80 dark:bg-white/10 px-1.5 py-0.5 font-mono text-xs text-amber-600 dark:text-amber-400">
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <div className="mb-3 leading-relaxed last:mb-0">{highlightQueryInNode(children, searchQuery)}</div>;
                    },
                    li({ children }) {
                      return <li className="my-1">{highlightQueryInNode(children, searchQuery)}</li>;
                    },
                    img({ src, alt }) {
                      return <CleanImagePreview src={src} alt={alt} />;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Web Grounding Citations */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 flex w-full flex-col gap-1.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> Sources & References:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition shadow-sm"
                      >
                        <span className="max-w-[200px] truncate">{src.title}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="mt-2.5 flex items-center gap-1 opacity-85 transition-opacity">
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(message.id)}
                    title={message.isPinned ? "Unpin message" : "Pin message as important context"}
                    aria-label={message.isPinned ? "Unpin message" : "Pin message"}
                    className={`rounded-lg p-1.5 transition cursor-pointer ${
                      message.isPinned
                        ? 'text-amber-500 bg-amber-500/20 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Pin className={`h-3.5 w-3.5 ${message.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  title={copied ? locales.actions.copied : locales.actions.copy}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {onRegenerate && (
                  <button
                    onClick={() => onRegenerate(message.id)}
                    title={locales.actions.regenerate}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                )}
                {/* Read Aloud Button */}
                <button
                  type="button"
                  onClick={handleSpeak}
                  title={isSpeaking ? (locales.actions.stopSpeaking || 'Stop reading') : (locales.actions.readAloud || 'Read aloud')}
                  aria-label={isSpeaking ? 'Stop reading aloud' : 'Read message aloud'}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition cursor-pointer font-medium ${
                    isSpeaking
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      {/* Animated audio wave bars */}
                      <span className="flex items-center gap-0.5 h-3 mr-0.5" aria-hidden="true">
                        <span className="w-0.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                        <span className="w-0.5 h-3.5 bg-amber-500 rounded-full animate-pulse [animation-delay:150ms]"></span>
                        <span className="w-0.5 h-2 bg-amber-500 rounded-full animate-pulse [animation-delay:300ms]"></span>
                      </span>
                      <VolumeX className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold">{locales.actions.stopSpeaking || 'Stop Reading'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{locales.actions.readAloud || 'Read Aloud'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  title={savedLocally ? locales.actions.saved : locales.actions.save}
                  className={`rounded-lg p-1.5 transition cursor-pointer ${
                    savedLocally
                      ? 'text-amber-500'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {savedLocally ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" /> : <Bookmark className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={getWhatsAppMessageUrl(message.content)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share this answer on WhatsApp"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-[#25D366] dark:hover:bg-emerald-950/40 dark:hover:text-[#25D366] transition cursor-pointer inline-flex items-center justify-center"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={handleShare}
                  title={locales.actions.share}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
