"use client";

import { useI18n } from "@/lib/i18n/context";
import { languageNames, languageFlags } from "@/lib/i18n/multi-lang-translations";
import { getTranslationStats } from "@/lib/i18n/translation-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Check, TrendingUp } from "lucide-react";

/**
 * Translation System Demo Component
 * Showcases the multi-language capabilities
 */
export default function TranslationDemo() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const stats = getTranslationStats();

  const allLocales = Object.keys(languageNames) as Array<keyof typeof languageNames>;

  return (
    <div className={`container mx-auto p-8 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Globe className="h-12 w-12 text-gold" />
            <h1 className="text-4xl font-bold">
              {t("common", "appName")} - {t("common", "language")} {t("common", "settings")}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {t("common", "brandTagline")}
          </p>
        </div>

        {/* Translation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Translation Coverage
            </CardTitle>
            <CardDescription>
              System-wide translation statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald/10 rounded-lg">
                <div className="text-3xl font-bold text-emerald">{stats.percentage}%</div>
                <div className="text-sm text-muted-foreground">Overall Coverage</div>
              </div>
              <div className="text-center p-4 bg-gold/10 rounded-lg">
                <div className="text-3xl font-bold text-gold">{stats.complete}</div>
                <div className="text-sm text-muted-foreground">Translations</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-3xl font-bold text-blue-500">10</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Selector Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Language</CardTitle>
            <CardDescription>
              Choose from 10 supported languages with full translation coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {allLocales.map((lang) => (
                <Button
                  key={lang}
                  variant={locale === lang ? "default" : "outline"}
                  className={`h-auto py-4 flex flex-col items-center gap-2 ${
                    locale === lang ? "bg-gold hover:bg-gold-dark text-charcoal" : ""
                  }`}
                  onClick={() => setLocale(lang)}
                >
                  <span className="text-3xl">{languageFlags[lang]}</span>
                  <span className="text-sm font-medium">{languageNames[lang]}</span>
                  {locale === lang && (
                    <Check className="h-4 w-4 absolute top-2 right-2" />
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Translation Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Translation Examples</CardTitle>
            <CardDescription>
              See how different sections are translated in {languageNames[locale]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Common Translations */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Common UI Elements
                  <Badge variant="secondary">common</Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["welcome", "search", "save", "cancel", "confirm", "loading", "yes", "no"].map((key) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="font-medium">{t("common", key as any)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Navigation Menu
                  <Badge variant="secondary">nav</Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["home", "about", "rooms", "dining", "spa", "events", "gallery", "contact"].map((key) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="font-medium">{t("nav", key as any)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Booking System
                  <Badge variant="secondary">booking</Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["title", "subtitle", "bookYourStay"].map((key) => (
                    <div key={key} className="p-3 bg-muted rounded-lg col-span-full">
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="font-medium">{t("booking", key as any)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Dashboard
                  <Badge variant="secondary">dashboard</Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["welcomeBack", "totalRevenue", "occupancyRate", "activeGuests"].map((key) => (
                    <div key={key} className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">{key}</div>
                      <div className="font-medium">{t("dashboard", key as any)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RTL Support */}
        {isRTL && (
          <Card className="border-gold">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="default" className="bg-gold text-charcoal">RTL</Badge>
                Right-to-Left Support Active
              </CardTitle>
              <CardDescription>
                The interface automatically adjusts for Arabic and other RTL languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gold/10 rounded-lg text-right">
                <p className="text-lg font-arabic">
                  {t("common", "welcome")} {t("common", "appName")}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("common", "brandTagline")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Translation System Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald mt-0.5" />
                <div>
                  <div className="font-medium">10 Languages Supported</div>
                  <div className="text-sm text-muted-foreground">
                    English, Kinyarwanda, French, Kiswahili, Spanish, German, Chinese, Arabic, Portuguese, Japanese
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald mt-0.5" />
                <div>
                  <div className="font-medium">RTL Support</div>
                  <div className="text-sm text-muted-foreground">
                    Automatic right-to-left layout for Arabic
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald mt-0.5" />
                <div>
                  <div className="font-medium">Persistent Selection</div>
                  <div className="text-sm text-muted-foreground">
                    Language preference saved to localStorage
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald mt-0.5" />
                <div>
                  <div className="font-medium">Fallback System</div>
                  <div className="text-sm text-muted-foreground">
                    Automatic fallback to English if translation missing
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald mt-0.5" />
                <div>
                  <div className="font-medium">Complete Coverage</div>
                  <div className="text-sm text-muted-foreground">
                    All UI elements, forms, and messages translated
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-emerald mt-0.5" />
                <div>
                  <div className="font-medium">Real-time Switching</div>
                  <div className="text-sm text-muted-foreground">
                    Change language without page reload
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
