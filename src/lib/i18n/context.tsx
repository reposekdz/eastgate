"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey, type TranslationSubKey } from "./translations";
import { isRTL } from "./multi-lang-translations";
import { completeTranslations } from "./auto-translate";

interface I18nContextType {
  locale: Locale;
  language: string;
  setLocale: (locale: Locale) => void;
  setLanguage: (lang: string) => void;
  t: <T extends TranslationKey>(section: T, key: TranslationSubKey<T>) => string;
  isRw: boolean;
  isEn: boolean;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [language, setLanguageState] = useState("en");
  const [mounted, setMounted] = useState(false);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLanguageState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("eastgate-locale", newLocale);
    }
    // Set document language and direction
    document.documentElement.lang = newLocale;
    document.documentElement.dir = isRTL(newLocale) ? "rtl" : "ltr";
  }, []);

  const setLanguage = useCallback((lang: string) => {
    const validLocales: Locale[] = ["en", "rw", "fr", "sw", "es", "de", "zh", "ar", "pt", "ja"];
    const newLocale = (validLocales.includes(lang as Locale) ? lang : "en") as Locale;
    setLocale(newLocale);
  }, [setLocale]);

  const t = useCallback(
    <T extends TranslationKey>(section: T, key: TranslationSubKey<T>): string => {
      // Use complete translations with auto-fill
      const sectionData = completeTranslations[section] || translations[section];
      if (!sectionData) return String(key);
      const entry = sectionData[key] as Record<Locale, string> | undefined;
      if (!entry) return String(key);
      return entry[locale] || entry.en || String(key);
    },
    [locale]
  );

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("eastgate-locale") as Locale | null;
    const validLocales: Locale[] = ["en", "rw", "fr", "sw", "es", "de", "zh", "ar", "pt", "ja"];
    if (saved && validLocales.includes(saved)) {
      setLocaleState(saved);
      setLanguageState(saved);
      // Set initial direction
      document.documentElement.dir = isRTL(saved) ? "rtl" : "ltr";
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        language,
        setLocale,
        setLanguage,
        t,
        isRw: locale === "rw",
        isEn: locale === "en",
        isRTL: isRTL(locale),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    // Return default values for SSR/build time
    return {
      locale: "en" as Locale,
      language: "en",
      setLocale: () => {},
      setLanguage: () => {},
      t: <T extends TranslationKey>(section: T, key: TranslationSubKey<T>): string => {
        const sectionData = completeTranslations[section] || translations[section];
        if (!sectionData) return String(key);
        const entry = sectionData[key] as Record<Locale, string> | undefined;
        if (!entry) return String(key);
        return entry.en || String(key);
      },
      isRw: false,
      isEn: true,
      isRTL: false,
    };
  }
  return context;
}
