"use client";

import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { currencies, type Currency } from "@/lib/currencies";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Currency Context ────────────────────────────────────────
interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]); // RWF

  useEffect(() => {
    const saved = localStorage.getItem("eastgate-currency");
    if (saved) {
      const found = currencies.find((c) => c.code === saved);
      if (found) setCurrencyState(found);
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("eastgate-currency", c.code);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

// ─── Currency Dropdown Selector ──────────────────────────────
interface CurrencySelectorProps {
  variant?: "header" | "compact";
  className?: string;
}

export default function CurrencySelector({ variant = "header", className }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();

  const popularCodes = ["RWF", "USD", "EUR", "GBP", "CNY", "JPY", "KES"];
  const popular = currencies.filter((c) => popularCodes.includes(c.code));
  const others = currencies.filter((c) => !popularCodes.includes(c.code));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1 text-white/70 hover:text-white hover:bg-white/10 px-2 h-8",
            className
          )}
        >
          <span className="text-sm">{currency.flag}</span>
          <span className="text-xs font-semibold">{currency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
          <DollarSign className="h-3 w-3" />
          Popular Currencies
        </DropdownMenuLabel>
        {popular.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currency.code === c.code && "bg-emerald/10 text-emerald font-semibold"
            )}
          >
            <span className="text-base">{c.flag}</span>
            <span className="flex-1 text-sm">{c.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{c.symbol}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          More Currencies
        </DropdownMenuLabel>
        <ScrollArea className="h-48">
          {others.map((c) => (
            <DropdownMenuItem
              key={c.code}
              onClick={() => setCurrency(c)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                currency.code === c.code && "bg-emerald/10 text-emerald font-semibold"
              )}
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{c.symbol}</span>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
