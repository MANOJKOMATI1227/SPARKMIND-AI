import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Download,
  FileText,
  FileCode,
  Link2,
  X,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Calendar,
  User,
  ShieldCheck,
  Send,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Conversation, UserProfile } from '../../types/index.js';
import {
  createShareLink,
  formatChatToMarkdown,
  downloadFile,
} from '../../services/shareService.js';
import { exportConversationToPDF } from '../../services/pdfExportService.js';
import { WhatsAppIcon } from '../common/WhatsAppIcon.js';

interface ShareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  user: UserProfile;
}

export const ShareChatModal: React.FC<ShareChatModalProps> = ({
  isOpen,
  onClose,
  conversation,
  user,
}) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [includeName, setIncludeName] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !conversation) return;

    let isMounted = true;
    setIsGenerating(true);

    createShareLink(conversation, {
      sharedBy: includeName ? user.name || user.email?.split('@')[0] : undefined,
    }).then(({ shareUrl }) => {
      if (isMounted) {
        setShareUrl(shareUrl);
        setIsGenerating(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, conversation, includeName, user]);

  if (!isOpen || !conversation) return null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyTranscript = async () => {
    const md = formatChatToMarkdown(conversation);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2500);
    } catch {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2500);
    }
  };

  const handleExportMarkdown = () => {
    const md = formatChatToMarkdown(conversation);
    const slug = (conversation.title || 'chat')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    downloadFile(`${slug || 'conversation'}-${Date.now()}.md`, md, 'text/markdown');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(conversation, null, 2);
    const slug = (conversation.title || 'chat')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    downloadFile(`${slug || 'conversation'}-${Date.now()}.json`, jsonStr, 'application/json');
  };

  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const handleExportPDF = async () => {
    if (!conversation) return;
    try {
      setIsExportingPDF(true);
      await exportConversationToPDF(conversation, {
        userName: includeName ? user.name || user.email?.split('@')[0] : undefined,
        userEmail: includeName ? user.email : undefined,
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversation.title || 'SparkMind AI Conversation',
          text: `Check out this conversation with SparkMind AI: "${conversation.title}"`,
          url: shareUrl || window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const getWhatsAppShareUrl = () => {
    const title = conversation.title || 'SparkMind AI Conversation';
    const authorStr = includeName && user.name ? ` shared by ${user.name}` : '';
    const targetUrl = shareUrl || window.location.href;
    const shareMessage = `🤖 *SparkMind AI Conversation*${authorStr}\n"${title}"\n\nRead the conversation here:\n${targetUrl}\n\n_Generated with SparkMind AI_`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  };

  const messageCount = conversation.messages.length;
  const dateFormatted = new Date(conversation.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Share2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Share Conversation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a shareable link or export this conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Conversation Preview Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {conversation.title || 'SparkMind AI Chat'}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {conversation.workspace || 'General'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateFormatted}
              </span>
              <span>•</span>
              <span>{messageCount} message{messageCount === 1 ? '' : 's'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                No credentials shared
              </span>
            </div>
          </div>

          {/* Share Link Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-amber-500" /> Public Share Link
              </span>
              <span className="text-[11px] font-normal text-slate-400">Anyone with the link can view</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={isGenerating ? 'Generating share link...' : shareUrl}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 select-all focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleCopyLink}
                disabled={isGenerating || !shareUrl}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 active:scale-95'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct WhatsApp Action Banner */}
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <WhatsAppIcon className="h-4 w-4 fill-white" />
              <span>Share on WhatsApp</span>
            </a>
          </div>

          {/* Privacy & Author Toggle */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Share with my name ({user.name || 'User'})</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeName}
                onChange={(e) => setIncludeName(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Export & Actions Grid */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              More Export & Sharing Options
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 hover:border-rose-500 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition cursor-pointer"
              >
                {isExportingPDF ? (
                  <Loader2 className="h-4 w-4 text-rose-500 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4 text-rose-500" />
                )}
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  {isExportingPDF ? 'Exporting...' : 'PDF (.pdf)'}
                </span>
              </button>

              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 hover:border-[#25D366] hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition cursor-pointer"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyTranscript}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer"
              >
                {copiedTranscript ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-[11px] font-medium">
                  {copiedTranscript ? 'Copied!' : 'Copy Text'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer"
              >
                <FileText className="h-4 w-4 text-amber-500" />
                <span className="text-[11px] font-medium">Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer"
              >
                <FileCode className="h-4 w-4 text-blue-500" />
                <span className="text-[11px] font-medium">JSON (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-2.5 text-xs text-slate-700 dark:text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/5 transition cursor-pointer"
              >
                <Send className="h-4 w-4 text-emerald-500" />
                <span className="text-[11px] font-medium">Native Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-3">
          <span className="text-[11px] text-slate-400">
            Messages sent after creating this link won't be shared.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
