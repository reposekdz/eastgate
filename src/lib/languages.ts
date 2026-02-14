// ═══════════════════════════════════════════════════════════════
// 30 Most Popular World Languages for EastGate Hotel
// ═══════════════════════════════════════════════════════════════

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir?: "ltr" | "rtl";
}

export const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", flag: "🇷🇼" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇹🇿" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", dir: "rtl" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
];

export function getLanguageByCode(code: string): Language | undefined {
  return languages.find((l) => l.code === code);
}
