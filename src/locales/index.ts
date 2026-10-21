import { enLocale, LocaleStrings } from './en.js';
import { teLocale } from './te.js';
import { hiLocale } from './hi.js';

export type SupportedLanguage = 'en' | 'te' | 'hi';

export const locales: Record<SupportedLanguage, LocaleStrings> = {
  en: enLocale,
  te: teLocale,
  hi: hiLocale,
};

export const languageNames: Record<SupportedLanguage, { label: string; nativeName: string }> = {
  en: { label: 'English', nativeName: 'English' },
  te: { label: 'Telugu', nativeName: 'తెలుగు' },
  hi: { label: 'Hindi', nativeName: 'हिन्दी' },
};

export function getLocale(lang: string): LocaleStrings {
  if (lang in locales) {
    return locales[lang as SupportedLanguage];
  }
  return enLocale;
}
