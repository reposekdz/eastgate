"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./translations";

// Language configuration
export const languages: { code: Locale; name: string; nativeName: string; flag: string }[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", flag: "🇷🇼" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇹🇿" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
];

// Default languages per context
const PUBLIC_DEFAULT: Locale = "en";
const ADMIN_DEFAULT: Locale = "rw";

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isInitialized: boolean;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: PUBLIC_DEFAULT,
      setLocale: (locale) => set({ locale }),
      isInitialized: false,
    }),
    {
      name: "eastgate-i18n",
    }
  )
);

// Helper to get default locale based on context
export function getDefaultLocale(context: "public" | "admin" = "public"): Locale {
  return context === "admin" ? ADMIN_DEFAULT : PUBLIC_DEFAULT;
}

// Helper to get available languages
export function getLanguages() {
  return languages;
}

// Currency configuration - RWF as default
export const currencies = {
  RWF: {
    code: "RWF",
    name: "Rwandan Franc",
    symbol: "RWF",
    flag: "🇷🇼",
    exchangeRate: 1,
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
    exchangeRate: 0.00072,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    exchangeRate: 0.00066,
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    flag: "🇬🇧",
    exchangeRate: 0.00057,
  },
};

export type CurrencyCode = keyof typeof currencies;

export function formatCurrency(amount: number, currencyCode: CurrencyCode = "RWF"): string {
  const currency = currencies[currencyCode];
  if (!currency) return `RWF ${amount.toLocaleString()}`;

  if (currencyCode === "RWF") {
    return `RWF ${amount.toLocaleString()}`;
  }

  const converted = amount * currency.exchangeRate;
  return `${currency.symbol}${converted.toFixed(2)}`;
}

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  const fromRate = currencies[from]?.exchangeRate || 1;
  const toRate = currencies[to]?.exchangeRate || 1;
  return (amount * fromRate) / toRate;
}
