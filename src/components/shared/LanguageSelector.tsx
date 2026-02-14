"use client";

import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { languages, type Language } from "@/lib/languages";
import { useI18n } from "@/lib/i18n/context";
import { Globe, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const [search, setSearch] = useState("");

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  const filteredLangs = useMemo(() => {
    if (!search.trim()) return languages;
    const q = search.toLowerCase();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Top languages for quick access
  const topCodes = ["en", "rw", "fr", "sw", "es", "de", "zh"];
  const topLangs = languages.filter((l) => topCodes.includes(l.code));
  const otherLangs = filteredLangs.filter((l) => !topCodes.includes(l.code));

  const handleSelect = (lang: Language) => {
    // For now, only EN and RW have full translations
    // Other languages show English as fallback
    if (lang.code === "rw") {
      setLocale("rw");
    } else {
      setLocale("en");
    }
    setSearch("");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 text-white/70 hover:text-white hover:bg-white/10 px-2 h-8",
            className
          )}
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span className="text-xs font-semibold uppercase">{currentLang.code}</span>
          <Globe className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-0">
        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {/* Popular languages */}
          {!search.trim() && (
            <>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                Popular
              </DropdownMenuLabel>
              {topLangs.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleSelect(lang)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 cursor-pointer mx-1 rounded-md",
                    locale === lang.code && "bg-emerald/10"
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{lang.name}</p>
                    <p className="text-[10px] text-muted-foreground">{lang.nativeName}</p>
                  </div>
                  {locale === lang.code && (
                    <Check className="h-3.5 w-3.5 text-emerald shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                All Languages
              </DropdownMenuLabel>
            </>
          )}

          {/* Other languages */}
          {(search.trim() ? filteredLangs : otherLangs).map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 cursor-pointer mx-1 rounded-md",
                locale === lang.code && "bg-emerald/10"
              )}
            >
              <span className="text-base">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{lang.name}</p>
                <p className="text-[10px] text-muted-foreground">{lang.nativeName}</p>
              </div>
              {locale === lang.code && (
                <Check className="h-3.5 w-3.5 text-emerald shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          {filteredLangs.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No languages found
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
