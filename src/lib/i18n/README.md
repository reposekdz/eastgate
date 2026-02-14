# 🌍 EastGate Hotel - Multi-Language Translation System

## Overview

The EastGate Hotel platform supports **10 languages** with full RTL (Right-to-Left) support for Arabic and comprehensive translations across the entire application.

## Supported Languages

| Code | Language | Native Name | Flag | Direction | Coverage |
|------|----------|-------------|------|-----------|----------|
| `en` | English | English | 🇬🇧 | LTR | 100% |
| `rw` | Kinyarwanda | Ikinyarwanda | 🇷🇼 | LTR | 100% |
| `fr` | French | Français | 🇫🇷 | LTR | 100% |
| `sw` | Kiswahili | Kiswahili | 🇰🇪 | LTR | 100% |
| `es` | Spanish | Español | 🇪🇸 | LTR | 100% |
| `de` | German | Deutsch | 🇩🇪 | LTR | 100% |
| `zh` | Chinese | 中文 | 🇨🇳 | LTR | 100% |
| `ar` | Arabic | العربية | 🇸🇦 | RTL | 100% |
| `pt` | Portuguese | Português | 🇵🇹 | LTR | 100% |
| `ja` | Japanese | 日本語 | 🇯🇵 | LTR | 100% |

## Features

### ✅ Complete Translation Coverage
- **Navigation menus** - All menu items translated
- **Booking system** - Complete booking flow in all languages
- **Dashboard** - Admin, Manager, Receptionist, Waiter dashboards
- **Authentication** - Login and registration forms
- **Menu & Ordering** - Restaurant menu and food ordering
- **Room management** - Room types, descriptions, amenities
- **Payment** - Payment methods and checkout process
- **Status messages** - All system statuses and notifications

### ✅ RTL Support
- Automatic RTL layout for Arabic
- Document direction (`dir="rtl"`) automatically set
- CSS adjustments for RTL languages
- Proper text alignment and flow

### ✅ Persistent Language Selection
- User language preference saved to `localStorage`
- Automatic language detection on page load
- Seamless language switching without page reload

### ✅ Fallback System
- **Primary**: Selected language
- **Secondary**: English (if translation missing)
- **Tertiary**: Key name (if all else fails)

## Usage

### Basic Translation

```tsx
import { useI18n } from "@/lib/i18n/context";

function MyComponent() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div>
      <h1>{t("common", "welcome")}</h1>
      <p>{t("nav", "bookRoom")}</p>
      <button onClick={() => setLocale("fr")}>
        Switch to French
      </button>
    </div>
  );
}
```

### Language Selector

```tsx
import { useI18n } from "@/lib/i18n/context";
import { languageNames, languageFlags } from "@/lib/i18n/multi-lang-translations";

function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {Object.entries(languageNames).map(([code, name]) => (
        <option key={code} value={code}>
          {languageFlags[code]} {name}
        </option>
      ))}
    </select>
  );
}
```

### RTL Detection

```tsx
import { useI18n } from "@/lib/i18n/context";

function MyComponent() {
  const { isRTL } = useI18n();

  return (
    <div className={isRTL ? "text-right" : "text-left"}>
      Content automatically adjusts for RTL
    </div>
  );
}
```

## File Structure

```
src/lib/i18n/
├── context.tsx                    # Main i18n context provider
├── translations.ts                # Core translation dictionary
├── multi-lang-translations.ts     # Language metadata & helpers
├── extended-translations.ts       # Extended translations
├── translation-validator.ts       # Validation & statistics
└── README.md                      # This file
```

## Translation Sections

### Available Translation Sections

- `common` - Common UI elements (buttons, labels, actions)
- `nav` - Navigation menu items
- `booking` - Booking flow (6 steps)
- `menuPage` - Restaurant menu page
- `roomTypes` - Room type names
- `roomDesc` - Room descriptions
- `addOns` - Add-on services
- `paymentMethods` - Payment options
- `statuses` - System statuses
- `dashboard` - Dashboard elements
- `menuCategories` - Food categories
- `chat` - Chat/messaging
- `homepage` - Homepage sections
- `footer` - Footer content
- `receptionist` - Reception desk
- `receipt` - Payment receipts
- `paypal` - PayPal integration
- `management` - Admin/Manager features
- `newsletter` - Newsletter subscription
- `auth` - Authentication
- `menuOrder` - Menu ordering dialog

## Adding New Translations

### 1. Add to translations.ts

```typescript
export const translations = {
  mySection: {
    myKey: {
      en: "Hello",
      rw: "Muraho",
      fr: "Bonjour",
      sw: "Habari",
      es: "Hola",
      de: "Hallo",
      zh: "你好",
      ar: "مرحبا",
      pt: "Olá",
      ja: "こんにちは",
    },
  },
};
```

### 2. Use in Components

```tsx
const { t } = useI18n();
const greeting = t("mySection", "myKey");
```

## Translation Validation

### Check Translation Coverage

```typescript
import { getTranslationStats } from "@/lib/i18n/translation-validator";

const stats = getTranslationStats();
console.log(`Translation coverage: ${stats.percentage}%`);
console.log("By language:", stats.localePercentages);
```

### Find Missing Translations

```typescript
import { validateTranslations } from "@/lib/i18n/translation-validator";

const missing = validateTranslations();
console.log("Missing translations:", missing);
```

## Best Practices

### ✅ DO
- Always use the `t()` function for user-facing text
- Provide translations for all 10 languages
- Test RTL layout for Arabic
- Use semantic translation keys
- Keep translations concise and clear

### ❌ DON'T
- Hardcode user-facing text in components
- Use English text directly in JSX
- Forget to test language switching
- Mix translation keys from different sections
- Use overly long translation keys

## Performance

- **Lazy Loading**: Translations loaded on demand
- **Memoization**: Translation function memoized with `useCallback`
- **Local Storage**: Language preference cached
- **No Network Calls**: All translations bundled (no API calls)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS/Android)

## Accessibility

- Proper `lang` attribute set on `<html>`
- Screen reader support for all languages
- Keyboard navigation works in all languages
- ARIA labels translated

## Future Enhancements

- [ ] Add more languages (Hindi, Russian, Italian)
- [ ] Implement translation management UI
- [ ] Add translation export/import (JSON/CSV)
- [ ] Integrate with translation services (Google Translate API)
- [ ] Add language-specific date/time formatting
- [ ] Implement pluralization rules
- [ ] Add gender-specific translations

## Support

For translation issues or requests:
- Email: translations@eastgatehotel.rw
- GitHub: Open an issue
- Slack: #translations channel

---

**Last Updated**: 2026-01-20  
**Version**: 2.0.0  
**Maintainer**: EastGate Development Team
