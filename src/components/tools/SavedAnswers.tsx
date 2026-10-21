import React, { useState } from 'react';
import { Bookmark, Search, Trash2, Copy, Check, X, ExternalLink } from 'lucide-react';
import { SavedAnswer } from '../../types/index.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SavedAnswersProps {
  isOpen: boolean;
  onClose: () => void;
  savedAnswers: SavedAnswer[];
  onDeleteSavedAnswer: (id: string) => void;
}

export const SavedAnswers: React.FC<SavedAnswersProps> = ({
  isOpen,
  onClose,
  savedAnswers,
  onDeleteSavedAnswer,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = savedAnswers.filter(
    (a) =>
      a.question.toLowerCase().includes(search.toLowerCase()) ||
      a.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500 font-bold">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Saved Answers Library
              </h2>
              <p className="text-xs text-slate-500">
                Starred responses saved from your SparkMind conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved answers..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-xs text-amber-600 dark:text-amber-400">
                    Q: {item.question}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(item.id, item.answer)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Copy"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteSavedAnswer(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="prose prose-xs dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No saved answers found. Click the bookmark icon on any AI response to save it here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
