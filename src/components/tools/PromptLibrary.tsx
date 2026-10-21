import React, { useState } from 'react';
import { BookOpen, Search, Copy, Check, ArrowRight, X } from 'lucide-react';
import { PROMPT_TEMPLATES } from '../../utils/promptTemplates.js';
import { PromptTemplate } from '../../types/index.js';

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'study', label: '🎓 Study & Exam' },
    { id: 'coding', label: '💻 Developer' },
    { id: 'startup', label: '🚀 Startup & Founder' },
    { id: 'business', label: '🏢 Business' },
    { id: 'translation', label: '🌍 Translation & Telugu' },
  ];

  const filtered = PROMPT_TEMPLATES.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (p: PromptTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(p.prompt);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 font-bold">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                SparkMind Prompt Library
              </h2>
              <p className="text-xs text-slate-500">
                Curated high-performance prompts for study, coding, startups, and translation
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

        {/* Filter bar */}
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts by keyword..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-white font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectPrompt(item.prompt);
                  onClose();
                }}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-amber-500/80 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-amber-500/60 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition">
                      {item.title}
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono line-clamp-2">
                    {item.prompt}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <button
                    onClick={(e) => handleCopy(item, e)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy prompt</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1 font-semibold text-amber-500 group-hover:translate-x-0.5 transition-transform">
                    <span>Use Prompt</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No prompt templates found matching your query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
