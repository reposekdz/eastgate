/**
 * Translation Auto-Complete Script
 * This script ensures all translation keys have values for all 10 languages
 * If a translation is missing, it falls back to English
 */

import { translations, type Locale } from "./translations";

const allLocales: Locale[] = ["en", "rw", "fr", "sw", "es", "de", "zh", "ar", "pt", "ja"];

/**
 * Validates that all translation entries have all 10 languages
 * Returns missing translations
 */
export function validateTranslations() {
  const missing: Array<{ section: string; key: string; locale: Locale }> = [];

  for (const [section, keys] of Object.entries(translations)) {
    for (const [key, value] of Object.entries(keys)) {
      if (typeof value === "object") {
        for (const locale of allLocales) {
          if (!(locale in value)) {
            missing.push({ section, key, locale });
          }
        }
      }
    }
  }

  return missing;
}

/**
 * Auto-fills missing translations with English fallback
 */
export function autoFillTranslations() {
  const filled: Record<string, any> = {};

  for (const [section, keys] of Object.entries(translations)) {
    filled[section] = {};
    for (const [key, value] of Object.entries(keys)) {
      if (typeof value === "object" && "en" in value) {
        filled[section][key] = { ...value };
        // Fill missing locales with English
        for (const locale of allLocales) {
          if (!(locale in filled[section][key])) {
            filled[section][key][locale] = value.en;
          }
        }
      } else {
        filled[section][key] = value;
      }
    }
  }

  return filled;
}

/**
 * Gets translation with automatic fallback chain:
 * 1. Requested locale
 * 2. English
 * 3. Key name
 */
export function getTranslationSafe(
  section: string,
  key: string,
  locale: Locale
): string {
  const sectionData = translations[section as keyof typeof translations];
  if (!sectionData) return key;

  const entry = sectionData[key as keyof typeof sectionData] as Record<Locale, string> | undefined;
  if (!entry) return key;

  return entry[locale] || entry.en || key;
}

/**
 * Translation coverage statistics
 */
export function getTranslationStats() {
  let total = 0;
  let complete = 0;
  const byLocale: Record<Locale, number> = {
    en: 0,
    rw: 0,
    fr: 0,
    sw: 0,
    es: 0,
    de: 0,
    zh: 0,
    ar: 0,
    pt: 0,
    ja: 0,
  };

  for (const keys of Object.values(translations)) {
    for (const value of Object.values(keys)) {
      if (typeof value === "object") {
        total += allLocales.length;
        for (const locale of allLocales) {
          if (locale in value && value[locale as keyof typeof value]) {
            complete++;
            byLocale[locale]++;
          }
        }
      }
    }
  }

  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;

  return {
    total,
    complete,
    percentage,
    byLocale,
    localePercentages: Object.fromEntries(
      allLocales.map((locale) => [
        locale,
        Math.round((byLocale[locale] / (total / allLocales.length)) * 100),
      ])
    ),
  };
}

// Export for use in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__translationStats = getTranslationStats;
  (window as any).__validateTranslations = validateTranslations;
}
