import React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeFacilityProps {
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  systemIsDark: boolean;
  variant?: 'header' | 'sidebar' | 'inline' | 'cards';
  className?: string;
}

export const ThemeFacility: React.FC<ThemeFacilityProps> = ({
  theme,
  onSelectTheme,
  systemIsDark,
  variant = 'header',
  className = '',
}) => {
  const laptopModeLabel = 'Dark (Default)';

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 ${className}`}>
        {/* System Default */}
        <div
          onClick={() => onSelectTheme('system')}
          className={`relative rounded-2xl border p-3 transition cursor-pointer backdrop-blur-xl ${
            theme === 'system'
              ? 'border-amber-500 bg-amber-500/15 dark:bg-amber-950/30 shadow-md ring-1 ring-amber-500/50'
              : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/75 dark:hover:bg-white/10 hover:border-white/60 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  theme === 'system'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    System Default
                  </span>
                  <span className="rounded-full px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Dark Default
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Always Dark Mode by default
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              {theme === 'system' ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
              )}
            </div>
          </div>
        </div>

        {/* Light Mode */}
        <div
          onClick={() => onSelectTheme('light')}
          className={`relative rounded-2xl border p-3 transition cursor-pointer backdrop-blur-xl ${
            theme === 'light'
              ? 'border-amber-500 bg-amber-500/15 dark:bg-amber-950/30 shadow-md ring-1 ring-amber-500/50'
              : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/75 dark:hover:bg-white/10 hover:border-white/60 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  theme === 'light'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Light Mode
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Crisp and clean daylight
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              {theme === 'light' ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
              )}
            </div>
          </div>
        </div>

        {/* Dark Mode */}
        <div
          onClick={() => onSelectTheme('dark')}
          className={`relative rounded-2xl border p-3 transition cursor-pointer backdrop-blur-xl ${
            theme === 'dark'
              ? 'border-amber-500 bg-amber-500/15 dark:bg-amber-950/30 shadow-md ring-1 ring-amber-500/50'
              : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/75 dark:hover:bg-white/10 hover:border-white/60 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Dark Mode
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Obsidian galactic glass
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              {theme === 'dark' ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <Check className="h-3 w-3" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Theme Mode
          </span>
          {theme === 'system' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              Default: Dark
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/50 dark:bg-white/5 p-1 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-sm">
          <button
            type="button"
            onClick={() => onSelectTheme('system')}
            title="System Default Mode (Dark mode by default)"
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-semibold transition cursor-pointer ${
              theme === 'system'
                ? 'bg-amber-500 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>System</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTheme('light')}
            title="Light Mode (Daylight crisp theme)"
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-semibold transition cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-amber-600 shadow-sm font-bold border border-slate-200/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTheme('dark')}
            title="Dark Mode (Obsidian galactic glass theme)"
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-semibold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 text-amber-400 shadow-sm font-bold border border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark</span>
          </button>
        </div>
      </div>
    );
  }

  // Header Segmented Control
  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-300/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 p-0.5 backdrop-blur-md shadow-sm transition ${className}`}
      role="group"
      aria-label="Display theme mode selector"
    >
      <button
        type="button"
        onClick={() => onSelectTheme('system')}
        title="System Default Mode (Dark theme by default)"
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
          theme === 'system'
            ? 'bg-amber-500 text-white font-bold shadow-sm'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Laptop className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">System</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTheme('light')}
        title="Light Mode (Crisp and bright daylight)"
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-800 text-amber-600 font-bold shadow-sm border border-slate-200/80 dark:border-slate-700'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTheme('dark')}
        title="Dark Mode (Obsidian deep galactic theme)"
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
          theme === 'dark'
            ? 'bg-slate-800 text-amber-400 font-bold shadow-sm border border-white/10'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
};
