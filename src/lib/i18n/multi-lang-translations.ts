// Multi-language translation helper
// Automatically generates translations for all 10 supported languages

import type { Locale } from "./translations";

type TranslationEntry = Record<Locale, string>;

export const createTranslation = (
  en: string,
  rw: string,
  fr: string,
  sw: string,
  es: string,
  de: string,
  zh: string,
  ar: string,
  pt: string,
  ja: string
): TranslationEntry => ({
  en,
  rw,
  fr,
  sw,
  es,
  de,
  zh,
  ar,
  pt,
  ja,
});

// Language names in their native scripts
export const languageNames: Record<Locale, string> = {
  en: "English",
  rw: "Ikinyarwanda",
  fr: "Français",
  sw: "Kiswahili",
  es: "Español",
  de: "Deutsch",
  zh: "中文",
  ar: "العربية",
  pt: "Português",
  ja: "日本語",
};

// Language flags
export const languageFlags: Record<Locale, string> = {
  en: "🇬🇧",
  rw: "🇷🇼",
  fr: "🇫🇷",
  sw: "🇰🇪",
  es: "🇪🇸",
  de: "🇩🇪",
  zh: "🇨🇳",
  ar: "🇸🇦",
  pt: "🇵🇹",
  ja: "🇯🇵",
};

// RTL languages
export const rtlLanguages: Locale[] = ["ar"];

export const isRTL = (locale: Locale): boolean => rtlLanguages.includes(locale);
