import React from 'react';
import { WorkspaceType, ReasoningMode } from '../../types/index.js';
import { LocaleStrings } from '../../locales/en.js';
import { SparkLogo } from '../common/SparkLogo.js';
import { PROMPT_TEMPLATES } from '../../utils/promptTemplates.js';
import { ArrowRight } from 'lucide-react';

interface WelcomeStateProps {
  activeWorkspace?: WorkspaceType;
  onSelectPrompt?: (prompt: string) => void;
  locales?: LocaleStrings;
  onOpenLegal?: (tab: 'terms' | 'license') => void;
  reasoningMode?: ReasoningMode;
  onModeChange?: (mode: ReasoningMode) => void;
}

export const WelcomeState: React.FC<WelcomeStateProps> = ({
  activeWorkspace = 'general',
  onSelectPrompt,
  reasoningMode = 'flash',
  onModeChange,
}) => {
  const relevantPrompts = PROMPT_TEMPLATES.filter(
    (t) => t.workspace === activeWorkspace
  ).slice(0, 3);

  // Fallback to top prompts if workspace has none
  const displayPrompts = relevantPrompts.length > 0
    ? relevantPrompts
    : PROMPT_TEMPLATES.slice(0, 3);

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full text-center my-auto min-h-[50vh] select-none">
      <div className="flex flex-col items-center gap-5 sm:gap-6 animate-in fade-in zoom-in-95 duration-500 w-full">
        {/* Logo Container with Vibrant Glowing Aura */}
        <div className="relative group">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 opacity-40 blur-2xl animate-pulse group-hover:opacity-75 transition duration-700 -z-10" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 opacity-50 blur-md -z-10" />

          {/* Glass Vessel for Logo */}
          <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl glass-surface border border-white/60 dark:border-white/20 shadow-[0_20px_50px_rgba(139,92,246,0.35)] transition-transform duration-500 hover:scale-105">
            <SparkLogo className="h-12 w-12 sm:h-14 sm:w-14" size={56} glow={true} />
          </div>
        </div>

        {/* Big Sized SPARKMIND Name with High Brightness & Vivid Gradient */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight sm:tracking-normal drop-shadow-[0_10px_35px_rgba(236,72,153,0.35)]">
            <span className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-purple-100 dark:to-white bg-clip-text text-transparent">
              SPARK
            </span>
            <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 dark:from-amber-300 dark:via-pink-400 dark:to-violet-400 bg-clip-text text-transparent font-black ml-1.5">
              MIND
            </span>
          </h1>

          <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 tracking-wide max-w-md">
            Next-Generation AI Chatbot & Intelligent Workspace
          </p>

          {/* Subtitle Accent Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 dark:border-white/20 bg-white/70 dark:bg-white/10 backdrop-blur-2xl px-3.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="tracking-widest uppercase text-slate-800 dark:text-white/90 text-[11px]">Chat • Code • Learn • Create</span>
          </div>
        </div>

        {/* Quick Starter Prompts */}
        {displayPrompts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-2xl mt-1 text-left">
            {displayPrompts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPrompt?.(item.prompt)}
                className="group flex flex-col justify-between p-3 rounded-2xl border border-white/60 dark:border-white/15 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer backdrop-blur-xl hover:border-amber-400/50"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                    {item.description}
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-end text-[10px] font-bold text-amber-500 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <span>Try prompt</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
