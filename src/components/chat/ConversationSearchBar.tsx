import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface ConversationSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const ConversationSearchBar: React.FC<ConversationSearchBarProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  currentMatchIndex,
  totalMatches,
  onNextMatch,
  onPrevMatch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  return (
    <div className="absolute top-3 right-3 sm:right-6 z-40 flex items-center gap-1.5 rounded-2xl border border-white/60 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl px-3 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] animate-in fade-in slide-in-from-top-3 duration-200 text-slate-800 dark:text-slate-100 max-w-[92vw]">
      <Search className="h-4 w-4 text-amber-500 shrink-0" />

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search in conversation..."
        className="w-36 sm:w-56 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
      />

      {/* Match count indicator */}
      {searchQuery.trim().length > 0 && (
        <span
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
            totalMatches > 0
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : '0 results'}
        </span>
      )}

      {/* Prev Match */}
      <button
        type="button"
        onClick={onPrevMatch}
        disabled={totalMatches === 0}
        title="Previous match (Shift+Enter)"
        aria-label="Previous match"
        className="rounded-lg p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      {/* Next Match */}
      <button
        type="button"
        onClick={onNextMatch}
        disabled={totalMatches === 0}
        title="Next match (Enter)"
        aria-label="Next match"
        className="rounded-lg p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Close Search */}
      <button
        type="button"
        onClick={onClose}
        title="Close search (Esc)"
        aria-label="Close search"
        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
