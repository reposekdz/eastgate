"use client";

import { useI18n } from "@/lib/i18n/context";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "pill";
  className?: string;
}

export default function LanguageSwitcher({ variant = "default", className }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  if (variant === "pill") {
    return (
      <div className={cn("flex items-center gap-1 bg-white/10 rounded-full p-0.5", className)}>
        <button
          onClick={() => setLocale("en")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold transition-all",
            locale === "en"
              ? "bg-white text-charcoal shadow-sm"
              : "text-white/70 hover:text-white"
          )}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("rw")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold transition-all",
            locale === "rw"
              ? "bg-white text-charcoal shadow-sm"
              : "text-white/70 hover:text-white"
          )}
        >
          RW
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocale(locale === "en" ? "rw" : "en")}
        className={cn("gap-1.5 text-xs font-semibold", className)}
      >
        <Globe className="h-3.5 w-3.5" />
        {locale === "en" ? "RW" : "EN"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">
            {locale === "en" ? "English" : "Ikinyarwanda"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={cn(locale === "en" && "bg-emerald/10 text-emerald font-semibold")}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("rw")}
          className={cn(locale === "rw" && "bg-emerald/10 text-emerald font-semibold")}
        >
          🇷🇼 Ikinyarwanda
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
