import React, { useState } from 'react';
import {
  Keyboard,
  X,
  Search,
  MessageSquare,
  Sparkles,
  Layers,
  Settings,
  Moon,
  Share2,
  FileCheck,
  BookOpen,
  CornerDownLeft,
} from 'lucide-react';

interface ShortcutItem {
  id: string;
  category: 'chat' | 'tools' | 'composer';
  title: string;
  description: string;
  keys: string[];
}

const SHORTCUTS: ShortcutItem[] = [
  // Chat & Navigation
  {
    id: 'new-chat',
    category: 'chat',
    title: 'New Conversation',
    description: 'Start a fresh conversation in the current workspace',
    keys: ['Ctrl', 'Shift', 'O'],
  },
  {
    id: 'share-chat',
    category: 'chat',
    title: 'Share Conversation',
    description: 'Open the share modal to copy link or export chat',
    keys: ['Ctrl', 'Shift', 'S'],
  },
  {
    id: 'toggle-sidebar',
    category: 'chat',
    title: 'Toggle Sidebar',
    description: 'Expand or collapse sidebar into Full Layout mode',
    keys: ['Ctrl', 'B'],
  },
  {
    id: 'focus-composer',
    category: 'chat',
    title: 'Focus Message Box',
    description: 'Jump directly to typing in the message composer',
    keys: ['Ctrl', 'K'],
  },
  {
    id: 'search-chat',
    category: 'chat',
    title: 'Search in Conversation',
    description: 'Find, highlight, and scroll through messages in the current chat',
    keys: ['Ctrl', 'F'],
  },
  {
    id: 'export-pdf',
    category: 'chat',
    title: 'Export to PDF',
    description: 'Download the current conversation as a clean, formatted PDF document',
    keys: ['Ctrl', 'Shift', 'E'],
  },
  {
    id: 'clear-chat',
    category: 'chat',
    title: 'Clear Conversation',
    description: 'Reset or clear active chat messages',
    keys: ['Ctrl', 'Shift', 'Del'],
  },

  // Tools & App Views
  {
    id: 'shortcuts-modal',
    category: 'tools',
    title: 'Keyboard Shortcuts',
    description: 'View this shortcuts cheat sheet',
    keys: ['Ctrl', '/'],
  },
  {
    id: 'toggle-theme',
    category: 'tools',
    title: 'Toggle Dark / Light Mode',
    description: 'Switch between dark and light appearance',
    keys: ['Ctrl', 'Shift', 'D'],
  },
  {
    id: 'prompt-library',
    category: 'tools',
    title: 'Open Prompt Library',
    description: 'Browse categorized AI prompts for instant use',
    keys: ['Ctrl', 'Shift', 'P'],
  },
  {
    id: 'resume-assistant',
    category: 'tools',
    title: 'ATS Resume Assistant',
    description: 'Open the ATS resume reviewer and optimizer',
    keys: ['Ctrl', 'Shift', 'R'],
  },
  {
    id: 'workspace-hub',
    category: 'tools',
    title: 'Workspace Hub',
    description: 'Switch between Developer, Business, Student, and General modes',
    keys: ['Ctrl', 'Shift', 'W'],
  },
  {
    id: 'close-modal',
    category: 'tools',
    title: 'Close Modal / Cancel',
    description: 'Exit open dialogs, full screen views, or menus',
    keys: ['Esc'],
  },

  // Input & Composer
  {
    id: 'send-message',
    category: 'composer',
    title: 'Send Message',
    description: 'Submit your prompt to SparkMind AI',
    keys: ['Enter'],
  },
  {
    id: 'new-line',
    category: 'composer',
    title: 'Insert Line Break',
    description: 'Add a new line without submitting prompt',
    keys: ['Shift', 'Enter'],
  },
  {
    id: 'edit-last',
    category: 'composer',
    title: 'Edit Last Sent Message',
    description: 'Recall your last prompt into the composer when input is empty',
    keys: ['↑ (Up Arrow)'],
  },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteShortcut?: (shortcutId: string) => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  onExecuteShortcut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  if (!isOpen) return null;

  const filtered = SHORTCUTS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const chatShortcuts = filtered.filter((s) => s.category === 'chat');
  const toolShortcuts = filtered.filter((s) => s.category === 'tools');
  const composerShortcuts = filtered.filter((s) => s.category === 'composer');

  const renderKey = (key: string) => {
    let display = key;
    if (isMac && key === 'Ctrl') display = '⌘';
    if (isMac && key === 'Shift') display = '⇧';
    if (isMac && key === 'Del') display = '⌫';

    return (
      <kbd
        key={key}
        className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 shadow-[0_1px_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_1px_rgba(0,0,0,0.4)]"
      >
        {display}
      </kbd>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Keyboard className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up your SparkMind AI workflow
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

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts (e.g. share, new chat, theme)..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No shortcuts found matching "{searchQuery}"
            </div>
          ) : (
            <>
              {/* Chat & Navigation */}
              {chatShortcuts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                    <span>Conversation & Layout</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    {chatShortcuts.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (onExecuteShortcut) {
                            onExecuteShortcut(s.id);
                            onClose();
                          }
                        }}
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</p>
                          <p className="text-[11px] text-slate-400">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {s.keys.map(renderKey)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools & Views */}
              {toolShortcuts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Tools & Views</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    {toolShortcuts.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (onExecuteShortcut) {
                            onExecuteShortcut(s.id);
                            onClose();
                          }
                        }}
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</p>
                          <p className="text-[11px] text-slate-400">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {s.keys.map(renderKey)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Composer */}
              {composerShortcuts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <CornerDownLeft className="h-3.5 w-3.5 text-amber-500" />
                    <span>Composer & Editing</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    {composerShortcuts.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</p>
                          <p className="text-[11px] text-slate-400">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {s.keys.map(renderKey)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</kbd> anytime to dismiss
          </span>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
