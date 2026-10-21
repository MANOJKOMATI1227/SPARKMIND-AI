import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Moon,
  Sun,
  Monitor,
  Laptop,
  Trash2,
  X,
  User,
  Sparkles,
  Zap,
  Cpu,
  Brain,
  Feather,
  CheckCircle2,
  Check,
  ShieldCheck,
  Activity,
  Layers,
  Scale,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { UserProfile } from '../../types/index.js';
import { LocaleStrings } from '../../locales/en.js';
import { languageNames, SupportedLanguage } from '../../locales/index.js';
import { ThemeFacility } from '../common/ThemeFacility.js';

export interface ModelOption {
  id: string;
  name: string;
  version: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  contextWindow: string;
  latency: string;
  description: string;
  highlights: string[];
}

export const AVAILABLE_GEMINI_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Google Gemini 3.8 Flash',
    version: 'v3.8',
    tagline: 'Ultra-low latency next-gen multimodal intelligence',
    badge: 'Recommended • Fast',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: Zap,
    contextWindow: '1 Million Tokens',
    latency: '~240ms',
    description: 'Next-generation Gemini Flash architecture with real-time web search grounding, high-speed coding, and fluent multilingual responses in Telugu, Tenglish, Hindi & English.',
    highlights: ['Live Web Search Grounding', 'Zero-Delay Coding', 'Multilingual & Tenglish', 'Vision & Audio'],
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash',
    version: 'v2.5',
    tagline: 'Dependable multimodal workhorse with balanced speed and depth',
    badge: 'Balanced • High Stability',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icon: Cpu,
    contextWindow: '1 Million Tokens',
    latency: '~310ms',
    description: 'Battle-tested multimodal model optimized for exam questions, structured study notes, document OCR analysis, and corporate communication.',
    highlights: ['10-Mark Exam Outlines', 'Structured Tables & JSON', 'High Reliability', 'Deep Document OCR'],
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Google Gemini 3.1 Pro',
    version: 'v3.1 Pro',
    tagline: 'Maximum cognitive power for complex code, STEM, and deep logic',
    badge: 'Deep Reasoning • Code',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: Brain,
    contextWindow: '2 Million Tokens',
    latency: '~650ms',
    description: 'Deep reasoning model built for multi-file system architectures, advanced algorithmic problems, intricate mathematical proofs, and extended chain-of-thought analysis.',
    highlights: ['2M Huge Context Window', 'Extended Chain-of-Thought', 'Advanced Algorithmics', 'Full-Stack Architecture'],
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Google Gemini 3.1 Flash-Lite',
    version: 'v3.1 Lite',
    tagline: 'Hyper-responsive lightweight engine for high throughput',
    badge: 'Ultra Lightweight',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    icon: Feather,
    contextWindow: '1 Million Tokens',
    latency: '~150ms',
    description: 'Ultra-lightweight engine with minimal footprint, tailored for lightning-fast vocabulary lookups, instant translations, and high-frequency queries.',
    highlights: ['Fastest Response Time', 'Instant Translation', 'Low Resource Footprint', 'Rapid Fact-Checking'],
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  locales: LocaleStrings;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  theme: 'light' | 'dark' | 'system';
  onSelectTheme: (theme: 'light' | 'dark' | 'system') => void;
  systemIsDark?: boolean;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  imageQuality?: 'fast' | 'high';
  onSelectImageQuality?: (quality: 'fast' | 'high') => void;
  onClearHistory: () => void;
  onOpenAuth: () => void;
  onOpenLegal?: (tab: 'terms' | 'license') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  locales,
  currentLanguage,
  onSelectLanguage,
  theme,
  onSelectTheme,
  systemIsDark = true,
  selectedModel = 'gemini-3.8-flash',
  onSelectModel,
  imageQuality = 'high',
  onSelectImageQuality,
  onClearHistory,
  onOpenAuth,
  onOpenLegal,
}) => {
  if (!isOpen) return null;

  const currentImageQuality = imageQuality || user.imageQuality || 'high';
  const currentActiveModelId = selectedModel || user.preferredModel || 'gemini-3.8-flash';
  const activeModelDetails =
    AVAILABLE_GEMINI_MODELS.find((m) => m.id === currentActiveModelId) || AVAILABLE_GEMINI_MODELS[0];
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-white/60 dark:border-white/15 glass-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 font-bold border border-amber-500/25">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {locales.settings.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure models for usage, appearance, and language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/40 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* Gemini Model Selection & Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Gemini Model For Usage</span>
              </label>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>API Operational</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Select which Gemini AI model powers your conversations, workspace assistants, and code analysis.
            </p>

            {/* Model Cards Grid */}
            <div className="space-y-2.5">
              {AVAILABLE_GEMINI_MODELS.map((model) => {
                const isSelected = model.id === currentActiveModelId;
                const ModelIcon = model.icon;

                return (
                  <div
                    key={model.id}
                    onClick={() => onSelectModel && onSelectModel(model.id)}
                    className={`relative rounded-2xl border p-3.5 transition cursor-pointer backdrop-blur-xl ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 dark:bg-amber-950/30 shadow-md shadow-amber-500/15 ring-1 ring-amber-500/50'
                        : 'border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white/75 dark:hover:bg-white/10 hover:border-white/60 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                              : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent'
                          }`}
                        >
                          <ModelIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {model.name}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold border ${model.badgeColor}`}
                            >
                              {model.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                            {model.description}
                          </p>

                          {/* Highlights Pills */}
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            <span className="rounded-md bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                              Context: {model.contextWindow}
                            </span>
                            <span className="rounded-md bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                              Latency: {model.latency}
                            </span>
                            {model.highlights.slice(0, 2).map((h, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-slate-200/40 dark:bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Selection Checkmark / Button */}
                      <div className="shrink-0 flex items-center">
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-2.5 py-1 text-[10px] font-bold shadow-sm">
                            <Check className="h-3 w-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="rounded-full border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:border-amber-500 hover:text-amber-500 transition"
                          >
                            Use Model
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Model Usage Diagnostic Box */}
            <div className="mt-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                  <Activity className="h-3.5 w-3.5 text-amber-500" />
                  <span>Active Engine: {activeModelDetails.name}</span>
                </span>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  Ready for Chat & Workspaces
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                <div className="rounded-lg bg-white dark:bg-slate-900/60 p-1.5 border border-slate-200/50 dark:border-slate-800">
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Context Window</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{activeModelDetails.contextWindow}</p>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900/60 p-1.5 border border-slate-200/50 dark:border-slate-800">
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Web Grounding</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">Google Search Enabled</p>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900/60 p-1.5 border border-slate-200/50 dark:border-slate-800">
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Multimodal</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Docs, Images, Audio, Code</p>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900/60 p-1.5 border border-slate-200/50 dark:border-slate-800">
                  <p className="text-slate-400 text-[9px] uppercase font-bold">Response Speed</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">{activeModelDetails.latency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Image Generation Quality Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-sm">
                <ImageIcon className="h-4 w-4 text-amber-500" />
                <span>AI Image Quality & Fidelity</span>
              </label>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  currentImageQuality === 'high'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}
              >
                {currentImageQuality === 'high' ? (
                  <>
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>2K High-Fidelity Active</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 text-emerald-500" />
                    <span>Fast / Draft Active</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Switch between rapid low-latency draft previews or studio-grade 2K Ultra-HD synthesis for generated artwork.
            </p>

            {/* Quality Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Fast / Draft */}
              <div
                onClick={() => onSelectImageQuality && onSelectImageQuality('fast')}
                className={`relative rounded-xl border p-3 transition cursor-pointer ${
                  currentImageQuality === 'fast'
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/20 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border ${
                        currentImageQuality === 'fast'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          Fast / Draft
                        </span>
                        <span className="rounded-full px-1.5 py-0.2 text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Rapid Speed
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Standard 1K resolution (~1024px) with low-latency prompt execution. Perfect for rapid prototyping and brainstorming.
                      </p>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <span className="rounded bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                          1024px Resolution
                        </span>
                        <span className="rounded bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                          Lower Latency
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {currentImageQuality === 'fast' ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: High-Fidelity */}
              <div
                onClick={() => onSelectImageQuality && onSelectImageQuality('high')}
                className={`relative rounded-xl border p-3 transition cursor-pointer ${
                  currentImageQuality === 'high'
                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/20 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border ${
                        currentImageQuality === 'high'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-transparent'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          High-Fidelity
                        </span>
                        <span className="rounded-full px-1.5 py-0.2 text-[9px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Recommended • 2K
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        Studio-grade 2K Ultra-HD synthesis with master prompt enrichment, cinematic lighting, and sharp textures.
                      </p>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <span className="rounded bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                          2048px (2K Ultra HD)
                        </span>
                        <span className="rounded bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 text-[9px] text-slate-700 dark:text-slate-300 font-medium">
                          Prompt Architect
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {currentImageQuality === 'high' ? (
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
          </div>

          {/* Theme & Display Mode */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-sm">
                <Laptop className="h-4 w-4 text-amber-500" />
                <span>Theme & Appearance</span>
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                Default: Dark Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Choose your visual appearance. Dark Mode is the system default. You can also select Light Mode if desired.
            </p>
            <ThemeFacility
              theme={theme || 'system'}
              onSelectTheme={onSelectTheme}
              systemIsDark={systemIsDark}
              variant="cards"
            />
          </div>

          {/* Language Selection */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 mb-2">
              <Globe className="h-4 w-4 text-amber-500" />
              <span>{locales.settings.language}</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Interface language. SparkMind fluently answers in Telugu (తెలుగు / Tenglish), Hindi, and English!
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(languageNames) as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onSelectLanguage(lang)}
                  className={`rounded-xl border p-2.5 text-center transition ${
                    currentLanguage === lang
                      ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-semibold text-xs">{languageNames[lang].label}</p>
                  <p className="text-[10px] text-slate-400">{languageNames[lang].nativeName}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Account Profile Bar */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 mb-1.5">
              <User className="h-4 w-4 text-amber-500" />
              <span>{locales.settings.account}</span>
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-[11px] text-slate-500">{user.email} ({user.provider})</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                Switch Account
              </button>
            </div>
          </div>

          {/* Legal & Open Source License */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 mb-2">
              <Scale className="h-4 w-4 text-amber-500" />
              <span>Legal & Open Source</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLegal) onOpenLegal('terms');
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Terms of Use</span>
                </div>
                <span className="text-[10px] text-slate-400">View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLegal) onOpenLegal('license');
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">MIT License</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-semibold">Open</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Clear History */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setConfirmClear(false);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 font-semibold text-white hover:bg-rose-700 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Yes, Delete All Chat History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3.5 py-2 font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition w-full justify-center cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>{locales.settings.clearHistory}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
