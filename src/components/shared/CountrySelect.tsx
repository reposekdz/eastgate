"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { countries, type Country } from "@/lib/countries";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Globe, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

// Popular countries shown at top
const popularCodes = [
  "RW", "BI", "CD", "UG", "KE", "TZ",
  "US", "GB", "FR", "DE", "CN", "IN",
  "JP", "ZA", "NG", "CA", "AU", "BR",
];

export default function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select nationality",
  className,
  triggerClassName,
  disabled = false,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === value || c.code === value),
    [value]
  );

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [search]);

  const popularCountries = useMemo(
    () => countries.filter((c) => popularCodes.includes(c.code)),
    []
  );

  const otherCountries = useMemo(
    () => filteredCountries.filter((c) => !popularCodes.includes(c.code)),
    [filteredCountries]
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (country: Country) => {
    onValueChange(country.name);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-12 font-normal text-left",
            !selectedCountry && "text-muted-foreground",
            triggerClassName
          )}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span className="truncate">{selectedCountry.name}</span>
              <span className="text-xs text-muted-foreground">({selectedCountry.code})</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              {placeholder}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[340px] p-0", className)}
        align="start"
        sideOffset={4}
      >
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {selectedCountry && (
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{selectedCountry.flag} {selectedCountry.name}</span>
              </span>
              <button
                onClick={() => {
                  onValueChange("");
                  setOpen(false);
                }}
                className="text-xs text-destructive hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {/* Popular countries */}
          {!search.trim() && (
            <>
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Popular
                </p>
              </div>
              <div className="px-1">
                {popularCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left",
                      selectedCountry?.code === country.code && "bg-emerald/10"
                    )}
                  >
                    <span className="text-lg leading-none shrink-0">{country.flag}</span>
                    <span className="flex-1 truncate font-medium">{country.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{country.dialCode}</span>
                    {selectedCountry?.code === country.code && (
                      <Check className="h-4 w-4 text-emerald shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="mx-3 my-1 border-b" />
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  All Countries ({countries.length})
                </p>
              </div>
            </>
          )}

          {/* Filtered / All countries */}
          <div className="px-1">
            {(search.trim() ? filteredCountries : otherCountries).map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left",
                  selectedCountry?.code === country.code && "bg-emerald/10"
                )}
              >
                <span className="text-lg leading-none shrink-0">{country.flag}</span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{country.dialCode}</span>
                {selectedCountry?.code === country.code && (
                  <Check className="h-4 w-4 text-emerald shrink-0" />
                )}
              </button>
            ))}
          </div>

          {filteredCountries.length === 0 && (
            <div className="py-8 text-center">
              <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No countries found</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Try a different search term
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {filteredCountries.length} of {countries.length} countries
          </span>
          <Badge variant="outline" className="text-[10px] h-5">
            🌍 {countries.length} countries
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}
