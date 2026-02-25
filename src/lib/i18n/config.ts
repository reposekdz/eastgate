// Language configuration and i18n setup
// Supports 10 languages: English, French, Spanish, German, Portuguese, Arabic, Chinese, Japanese, Swahili, Kinyarwanda

export type Language = 'en' | 'fr' | 'es' | 'de' | 'pt' | 'ar' | 'zh' | 'ja' | 'sw' | 'rw';

export const SUPPORTED_LANGUAGES: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
  rw: { name: 'Kinyarwanda', nativeName: 'Kinyarwanda', flag: '🇷🇼' },
};

export const DEFAULT_LANGUAGE: Language = 'en';

// Store language preference in localStorage
export const getLanguageFromStorage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem('language') as Language;
  return stored && Object.keys(SUPPORTED_LANGUAGES).includes(stored) ? stored : DEFAULT_LANGUAGE;
};

export const setLanguageInStorage = (lang: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
};

// Get browser language preference
export const getBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const browserLang = navigator.language.split('-')[0];
  const lang = browserLang as Language;
  return Object.keys(SUPPORTED_LANGUAGES).includes(lang) ? lang : DEFAULT_LANGUAGE;
};
