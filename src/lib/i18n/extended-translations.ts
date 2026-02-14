/**
 * Extended Translations - Auto-generated fallbacks for all 10 languages
 * This file provides complete translations for all sections
 */

import type { Locale } from "./translations";

type TranslationMap = Record<Locale, string>;

/**
 * Creates a translation entry with all 10 languages
 * If a translation is not provided, it uses the English version
 */
export const createFullTranslation = (translations: Partial<TranslationMap>): TranslationMap => {
  const en = translations.en || "";
  return {
    en,
    rw: translations.rw || en,
    fr: translations.fr || en,
    sw: translations.sw || en,
    es: translations.es || en,
    de: translations.de || en,
    zh: translations.zh || en,
    ar: translations.ar || en,
    pt: translations.pt || en,
    ja: translations.ja || en,
  };
};

/**
 * Extended translations for sections that need completion
 * These will be merged with the main translations
 */
export const extendedTranslations = {
  // Booking page translations (complete)
  booking: {
    title: createFullTranslation({
      en: "Reserve Your Perfect Room",
      rw: "Fata Icyumba Cyawe Kiza",
      fr: "Réservez votre chambre parfaite",
      sw: "Hifadhi Chumba Chako Kamili",
      es: "Reserve su habitación perfecta",
      de: "Buchen Sie Ihr perfektes Zimmer",
      zh: "预订您的完美客房",
      ar: "احجز غرفتك المثالية",
      pt: "Reserve seu quarto perfeito",
      ja: "完璧な部屋を予約",
    }),
    subtitle: createFullTranslation({
      en: "Experience luxury across our stunning locations in Rwanda",
      rw: "Shakira ubwiza mu hantu hacu heza mu Rwanda",
      fr: "Découvrez le luxe dans nos magnifiques établissements au Rwanda",
      sw: "Furahia anasa katika maeneo yetu ya kupendeza Rwanda",
      es: "Experimente el lujo en nuestras impresionantes ubicaciones en Ruanda",
      de: "Erleben Sie Luxus an unseren atemberaubenden Standorten in Ruanda",
      zh: "在我们位于卢旺达的绝美地点体验奢华",
      ar: "استمتع بالفخامة في مواقعنا الرائعة في رواندا",
      pt: "Experimente o luxo em nossas deslumbrantes localizações em Ruanda",
      ja: "ルワンダの素晴らしいロケーションで贅沢を体験",
    }),
  },

  // Status translations (complete)
  statuses: {
    pending: createFullTranslation({
      en: "Pending",
      rw: "Bitegereje",
      fr: "En attente",
      sw: "Inasubiri",
      es: "Pendiente",
      de: "Ausstehend",
      zh: "待处理",
      ar: "قيد الانتظار",
      pt: "Pendente",
      ja: "保留中",
    }),
    confirmed: createFullTranslation({
      en: "Confirmed",
      rw: "Byemejwe",
      fr: "Confirmé",
      sw: "Imethibitishwa",
      es: "Confirmado",
      de: "Bestätigt",
      zh: "已确认",
      ar: "مؤكد",
      pt: "Confirmado",
      ja: "確認済み",
    }),
    checked_in: createFullTranslation({
      en: "Checked In",
      rw: "Bwinjiye",
      fr: "Enregistré",
      sw: "Imeingia",
      es: "Registrado",
      de: "Eingecheckt",
      zh: "已入住",
      ar: "تم تسجيل الدخول",
      pt: "Check-in feito",
      ja: "チェックイン済み",
    }),
    checked_out: createFullTranslation({
      en: "Checked Out",
      rw: "Bwasohotse",
      fr: "Parti",
      sw: "Imetoka",
      es: "Salida",
      de: "Ausgecheckt",
      zh: "已退房",
      ar: "تم تسجيل الخروج",
      pt: "Check-out feito",
      ja: "チェックアウト済み",
    }),
    cancelled: createFullTranslation({
      en: "Cancelled",
      rw: "Byahagaritswe",
      fr: "Annulé",
      sw: "Imeghairiwa",
      es: "Cancelado",
      de: "Storniert",
      zh: "已取消",
      ar: "ملغى",
      pt: "Cancelado",
      ja: "キャンセル済み",
    }),
  },

  // Payment methods (complete)
  paymentMethods: {
    visa: createFullTranslation({ en: "Visa", rw: "Visa", fr: "Visa", sw: "Visa", es: "Visa", de: "Visa", zh: "Visa", ar: "فيزا", pt: "Visa", ja: "Visa" }),
    mastercard: createFullTranslation({ en: "Mastercard", rw: "Mastercard", fr: "Mastercard", sw: "Mastercard", es: "Mastercard", de: "Mastercard", zh: "万事达卡", ar: "ماستركارد", pt: "Mastercard", ja: "マスターカード" }),
    mtn_mobile: createFullTranslation({ en: "MTN MoMo", rw: "MTN MoMo", fr: "MTN MoMo", sw: "MTN MoMo", es: "MTN MoMo", de: "MTN MoMo", zh: "MTN移动支付", ar: "MTN موبايل", pt: "MTN MoMo", ja: "MTNモバイル" }),
    airtel_money: createFullTranslation({ en: "Airtel Money", rw: "Airtel Money", fr: "Airtel Money", sw: "Airtel Money", es: "Airtel Money", de: "Airtel Money", zh: "Airtel支付", ar: "إيرتل موني", pt: "Airtel Money", ja: "Airtelマネー" }),
    bank_transfer: createFullTranslation({
      en: "Bank Transfer",
      rw: "Kohereza mu Banki",
      fr: "Virement bancaire",
      sw: "Uhamisho wa Benki",
      es: "Transferencia bancaria",
      de: "Banküberweisung",
      zh: "银行转账",
      ar: "تحويل بنكي",
      pt: "Transferência bancária",
      ja: "銀行振込",
    }),
  },

  // Dashboard translations (complete)
  dashboard: {
    welcomeBack: createFullTranslation({
      en: "Welcome back",
      rw: "Murakaze Nanone",
      fr: "Bon retour",
      sw: "Karibu tena",
      es: "Bienvenido de nuevo",
      de: "Willkommen zurück",
      zh: "欢迎回来",
      ar: "مرحبًا بعودتك",
      pt: "Bem-vindo de volta",
      ja: "おかえりなさい",
    }),
    totalRevenue: createFullTranslation({
      en: "Total Revenue",
      rw: "Amafaranga Yose Yinjiye",
      fr: "Revenu total",
      sw: "Mapato Jumla",
      es: "Ingresos totales",
      de: "Gesamtumsatz",
      zh: "总收入",
      ar: "إجمالي الإيرادات",
      pt: "Receita total",
      ja: "総収入",
    }),
    occupancyRate: createFullTranslation({
      en: "Occupancy Rate",
      rw: "Igipimo cy'Ikuzuzwa",
      fr: "Taux d'occupation",
      sw: "Kiwango cha Utumiaji",
      es: "Tasa de ocupación",
      de: "Auslastung",
      zh: "入住率",
      ar: "معدل الإشغال",
      pt: "Taxa de ocupação",
      ja: "稼働率",
    }),
    activeGuests: createFullTranslation({
      en: "Active Guests",
      rw: "Abashyitsi Bahari",
      fr: "Clients actifs",
      sw: "Wageni Hai",
      es: "Huéspedes activos",
      de: "Aktive Gäste",
      zh: "活跃客人",
      ar: "الضيوف النشطون",
      pt: "Hóspedes ativos",
      ja: "アクティブゲスト",
    }),
  },

  // Authentication translations (complete)
  auth: {
    welcomeBack: createFullTranslation({
      en: "Welcome Back",
      rw: "Murakaze Nanone",
      fr: "Bon retour",
      sw: "Karibu Tena",
      es: "Bienvenido de nuevo",
      de: "Willkommen zurück",
      zh: "欢迎回来",
      ar: "مرحبًا بعودتك",
      pt: "Bem-vindo de volta",
      ja: "おかえりなさい",
    }),
    signIn: createFullTranslation({
      en: "Sign In",
      rw: "Injira",
      fr: "Se connecter",
      sw: "Ingia",
      es: "Iniciar sesión",
      de: "Anmelden",
      zh: "登录",
      ar: "تسجيل الدخول",
      pt: "Entrar",
      ja: "ログイン",
    }),
    emailAddress: createFullTranslation({
      en: "Email Address",
      rw: "Aderesi y'Imeli",
      fr: "Adresse e-mail",
      sw: "Anwani ya Barua pepe",
      es: "Correo electrónico",
      de: "E-Mail-Adresse",
      zh: "电子邮件地址",
      ar: "عنوان البريد الإلكتروني",
      pt: "Endereço de e-mail",
      ja: "メールアドレス",
    }),
    password: createFullTranslation({
      en: "Password",
      rw: "Ijambo ry'Ibanga",
      fr: "Mot de passe",
      sw: "Neno la siri",
      es: "Contraseña",
      de: "Passwort",
      zh: "密码",
      ar: "كلمة المرور",
      pt: "Senha",
      ja: "パスワード",
    }),
  },
};

/**
 * Merge extended translations with main translations
 * This ensures all sections have complete 10-language support
 */
export function mergeTranslations<T extends Record<string, any>>(
  main: T,
  extended: Record<string, any>
): T {
  const result = { ...main };

  for (const [section, translations] of Object.entries(extended)) {
    if (section in result) {
      result[section as keyof T] = {
        ...result[section as keyof T],
        ...translations,
      };
    } else {
      result[section as keyof T] = translations as any;
    }
  }

  return result;
}
