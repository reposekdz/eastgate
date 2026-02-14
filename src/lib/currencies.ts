// ═══════════════════════════════════════════════════════════════
// Multi-Currency Support for EastGate Hotel
// ═══════════════════════════════════════════════════════════════

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Exchange rate from RWF (base)
}

// Approximate exchange rates from RWF (Rwanda Franc) as base
export const currencies: Currency[] = [
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF", flag: "🇷🇼", rate: 1 },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", rate: 0.00072 },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", rate: 0.00066 },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", rate: 0.00057 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", rate: 0.0052 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", rate: 0.11 },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", rate: 0.093 },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬", rate: 2.7 },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿", rate: 1.9 },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", rate: 0.013 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", rate: 1.15 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", rate: 0.061 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", rate: 0.0026 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", rate: 0.001 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", rate: 0.0011 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", rate: 0.00064 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", rate: 0.0041 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷", rate: 1.01 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", rate: 0.0076 },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺", rate: 0.072 },
];

export function convertFromRWF(amountRWF: number, targetCode: string): number {
  const currency = currencies.find((c) => c.code === targetCode);
  if (!currency) return amountRWF;
  return amountRWF * currency.rate;
}

export function formatWithCurrency(amountRWF: number, currencyCode: string): string {
  const currency = currencies.find((c) => c.code === currencyCode);
  if (!currency || currencyCode === "RWF") {
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountRWF);
  }

  const converted = amountRWF * currency.rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" || currencyCode === "KRW" ? 0 : 2,
  }).format(converted);
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return currencies.find((c) => c.code === code);
}
