// Custom hook for using translations throughout the application
"use client";

import React, { useState, useEffect } from 'react';
import { translations, type Locale } from './translations';

export const useTranslation = (initialLocale?: Locale) => {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  useEffect(() => {
    // Get locale from localStorage or URL
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale | null;
      const param = new URLSearchParams(window.location.search).get('lang') as Locale | null;
      const browserLang = (navigator.language || 'en').split('-')[0] as Locale;

      const lang = (param as Locale) || (stored as Locale) || (browserLang as Locale) || 'en';
      const validLang: Locale = ['en', 'rw', 'fr', 'sw', 'es', 'de', 'zh', 'ar', 'pt', 'ja'].includes(lang) ? lang : 'en';

      setCurrentLocale(validLang);
      localStorage.setItem('locale', validLang);
    }
  }, []);

  const t = (namespace: string, key: string): string => {
    const activeLocale = initialLocale || currentLocale;
    try {
      const translation = (translations as any)[namespace]?.[key]?.[activeLocale];
      if (!translation) {
        // Fallback to english
        return (translations as any)[namespace]?.[key]?.['en'] || key;
      }
      return translation;
    } catch {
      return key;
    }
  };

  const setLocale = (lang: Locale) => {
    if (['en', 'rw', 'fr', 'sw', 'es', 'de', 'zh', 'ar', 'pt', 'ja'].includes(lang)) {
      setCurrentLocale(lang);
      localStorage.setItem('locale', lang);
      // Optionally update URL
      if (typeof window !== 'undefined') {
        window.location.href = `${window.location.pathname}?lang=${lang}`;
      }
    }
  };

  return { t, locale: currentLocale, setLocale };
};

// Context for providing locale to all components
interface LocaleContextType {
  locale: Locale;
  setLocale: (lang: Locale) => void;
  t: (namespace: string, key: string) => string;
}

export const LocaleContext = React.createContext<LocaleContextType | undefined>(undefined);

export const useLocale = () => {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setCurrentLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale | null;
      const param = new URLSearchParams(window.location.search).get('lang') as Locale | null;

      const lang: Locale = (param as Locale) || (stored as Locale) || 'en';
      const validLang: Locale = ['en', 'rw', 'fr', 'sw', 'es', 'de', 'zh', 'ar', 'pt', 'ja'].includes(lang) ? lang : 'en';

      setCurrentLocale(validLang);
      localStorage.setItem('locale', validLang);
    }
  }, []);

  const t = (namespace: string, key: string): string => {
    try {
      const translation = (translations as any)[namespace]?.[key]?.[locale];
      if (!translation) {
        return (translations as any)[namespace]?.[key]?.['en'] || key;
      }
      return translation;
    } catch {
      return key;
    }
  };

  const setLocale = (lang: Locale) => {
    if (['en', 'rw', 'fr', 'sw', 'es', 'de', 'zh', 'ar', 'pt', 'ja'].includes(lang)) {
      setCurrentLocale(lang);
      localStorage.setItem('locale', lang);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};
