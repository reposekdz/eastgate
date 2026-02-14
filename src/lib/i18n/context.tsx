"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey, type TranslationSubKey } from "./translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: <T extends TranslationKey>(section: T, key: TranslationSubKey<T>) => string;
  isRw: boolean;
  isEn: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("rw");

  useEffect(() => {
    const saved = localStorage.getItem("eastgate-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "rw")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("eastgate-locale", newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    <T extends TranslationKey>(section: T, key: TranslationSubKey<T>): string => {
      const sectionData = translations[section];
      if (!sectionData) return String(key);
      const entry = sectionData[key] as { en: string; rw: string } | undefined;
      if (!entry) return String(key);
      return entry[locale] || entry.en || String(key);
    },
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isRw: locale === "rw",
        isEn: locale === "en",
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
