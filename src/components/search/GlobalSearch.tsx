"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bed,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
  Images,
  Users,
  Phone,
  Home,
  Star,
  Flame,
  Leaf,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
  History,
  Zap,
  BookOpen,
  Globe,
  X,
} from "lucide-react";
import { fullMenu, menuCategories } from "@/lib/menu-data";
import { formatCurrency } from "@/lib/format";
import { getMenuItemImage } from "@/lib/menu-images";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ReactNode;
  href: string;
  image?: string;
  badge?: string;
  badgeColor?: string;
  price?: number;
}

// Page search items
const pageResults: SearchResult[] = [
  { id: "p-home", title: "Home", subtitle: "Main landing page", category: "Pages", icon: <Home className="h-4 w-4" />, href: "/" },
  { id: "p-rooms", title: "Rooms & Suites", subtitle: "Browse luxury accommodations", category: "Pages", icon: <Bed className="h-4 w-4" />, href: "/rooms" },
  { id: "p-dining", title: "Dining", subtitle: "Restaurant & fine cuisine", category: "Pages", icon: <UtensilsCrossed className="h-4 w-4" />, href: "/dining" },
  { id: "p-menu", title: "Full Menu", subtitle: "Browse food & beverages", category: "Pages", icon: <UtensilsCrossed className="h-4 w-4" />, href: "/menu" },
  { id: "p-spa", title: "Spa & Wellness", subtitle: "Treatments & relaxation", category: "Pages", icon: <Sparkles className="h-4 w-4" />, href: "/spa" },
  { id: "p-events", title: "Events & Conferences", subtitle: "Weddings, corporate & private", category: "Pages", icon: <CalendarDays className="h-4 w-4" />, href: "/events" },
  { id: "p-gallery", title: "Photo Gallery", subtitle: "Explore our hotel in photos", category: "Pages", icon: <Images className="h-4 w-4" />, href: "/gallery" },
  { id: "p-about", title: "About Us", subtitle: "Our story and mission", category: "Pages", icon: <Users className="h-4 w-4" />, href: "/about" },
  { id: "p-contact", title: "Contact Us", subtitle: "Get in touch with us", category: "Pages", icon: <Phone className="h-4 w-4" />, href: "/contact" },
  { id: "p-book", title: "Book a Room", subtitle: "Reserve your stay", category: "Pages", icon: <Bed className="h-4 w-4" />, href: "/book", badge: "Booking", badgeColor: "bg-emerald text-white" },
];

// Service search items
const serviceResults: SearchResult[] = [
  { id: "s-wifi", title: "Free Wi-Fi", subtitle: "High-speed internet throughout hotel", category: "Services", icon: <Sparkles className="h-4 w-4" />, href: "/about" },
  { id: "s-parking", title: "Valet Parking", subtitle: "Complimentary parking service", category: "Services", icon: <MapPin className="h-4 w-4" />, href: "/about" },
  { id: "s-pool", title: "Infinity Pool", subtitle: "Pool with mountain views", category: "Services", icon: <Sparkles className="h-4 w-4" />, href: "/spa" },
  { id: "s-gym", title: "Fitness Center", subtitle: "24/7 gym access", category: "Services", icon: <Sparkles className="h-4 w-4" />, href: "/spa" },
  { id: "s-breakfast", title: "Breakfast Buffet", subtitle: "Rwandan & international", category: "Services", icon: <UtensilsCrossed className="h-4 w-4" />, href: "/dining" },
  { id: "s-concierge", title: "24/7 Concierge", subtitle: "Round-the-clock assistance", category: "Services", icon: <Clock className="h-4 w-4" />, href: "/contact" },
  { id: "s-massage", title: "Signature Massage", subtitle: "African stone therapy", category: "Services", icon: <Sparkles className="h-4 w-4" />, href: "/spa" },
  { id: "s-airport", title: "Airport Transfers", subtitle: "Private car service", category: "Services", icon: <MapPin className="h-4 w-4" />, href: "/book" },
];

// Quick actions for trending searches
const trendingSearches = [
  "Rooms", "Spa", "Dinner", "Breakfast", "Pool", "Events", "Suite", "Menu",
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem("eastgate-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("eastgate-recent-searches", JSON.stringify(updated));
  };

  // Keyboard shortcut - Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Convert menu items to search results
  const menuResults: SearchResult[] = useMemo(() => {
    return fullMenu.slice(0, 80).map((item) => {
      const cat = menuCategories.find((c) => c.id === item.category);
      return {
        id: `m-${item.id}`,
        title: item.name,
        subtitle: item.description || item.nameFr || cat?.label,
        category: "Menu",
        icon: item.vegetarian ? (
          <Leaf className="h-4 w-4 text-green-500" />
        ) : item.spicy ? (
          <Flame className="h-4 w-4 text-red-500" />
        ) : (
          <UtensilsCrossed className="h-4 w-4" />
        ),
        href: "/menu",
        price: item.price,
        badge: item.popular ? "Popular" : undefined,
        badgeColor: "bg-gold/20 text-gold-dark",
      };
    });
  }, []);

  const handleSelect = useCallback(
    (href: string, title?: string) => {
      if (title) saveSearch(title);
      setOpen(false);
      router.push(href);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, recentSearches]
  );

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("eastgate-recent-searches");
  };

  return (
    <>
      {/* Search Trigger Button — Expanding on hover */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20",
          "text-white/70 hover:text-white transition-all duration-500 text-sm border border-white/10",
          "hover:border-white/20 group",
          // Wider on desktop, compact on mobile
          "px-3 py-1.5 sm:px-4 sm:py-2",
          "w-9 sm:w-auto hover:w-56 md:hover:w-72 lg:hover:w-80",
          "overflow-hidden"
        )}
      >
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span className="hidden sm:inline text-xs whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity">
          Search anything...
        </span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded-[3px] bg-white/10 px-1.5 font-mono text-[10px] text-white/50 shrink-0 ml-auto">
          ⌘K
        </kbd>
      </button>

      {/* Command Dialog — Enhanced with 3x width */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="relative">
          <CommandInput
            placeholder="Search pages, menu, rooms, services, events..."
            className="h-14 text-base"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <kbd className="hidden sm:inline-flex h-5 items-center rounded-[3px] bg-muted px-1.5 text-[10px] text-muted-foreground font-mono">
              ESC
            </kbd>
          </div>
        </div>

        <CommandList className="max-h-[70vh] overflow-auto">
          <CommandEmpty>
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                <Search className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                Try searching for rooms, food items, spa treatments, or events
              </p>
              {/* Trending suggestions */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelect(`/${term.toLowerCase()}`, term)}
                    className="px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </CommandEmpty>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              <CommandGroup heading={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <History className="h-3 w-3" />
                    Recent
                  </div>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear
                  </button>
                </div>
              }>
                {recentSearches.map((term, i) => (
                  <CommandItem
                    key={`recent-${i}`}
                    onSelect={() => handleSelect(`/menu`, term)}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{term}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Trending / Quick Access */}
          <CommandGroup heading={
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              Trending
            </div>
          }>
            <div className="flex flex-wrap gap-1.5 px-2 py-2">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelect(
                    term === "Rooms" ? "/rooms" :
                    term === "Spa" ? "/spa" :
                    term === "Events" ? "/events" :
                    term === "Menu" ? "/menu" :
                    term === "Suite" ? "/rooms" :
                    "/menu",
                    term
                  )}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-emerald/10 hover:text-emerald text-xs font-medium text-muted-foreground transition-colors"
                >
                  <Zap className="h-2.5 w-2.5" />
                  {term}
                </button>
              ))}
            </div>
          </CommandGroup>

          <CommandSeparator />

          {/* Pages */}
          <CommandGroup heading={
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Pages
            </div>
          }>
            {pageResults.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href, result.title)}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0 text-emerald">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </p>
                </div>
                {result.badge && (
                  <Badge className={cn("text-[10px] shrink-0", result.badgeColor)}>
                    {result.badge}
                  </Badge>
                )}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Services */}
          <CommandGroup heading={
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Services & Amenities
            </div>
          }>
            {serviceResults.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href, result.title)}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 text-gold-dark">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Menu Items */}
          <CommandGroup heading={
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              Menu ({fullMenu.length}+ items)
            </div>
          }>
            {menuResults.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result.href, result.title)}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </p>
                </div>
                {result.badge && (
                  <Badge variant="outline" className="text-[10px] shrink-0 gap-0.5">
                    <Star className="h-2 w-2 fill-gold text-gold" />
                    {result.badge}
                  </Badge>
                )}
                {result.price && (
                  <span className="text-xs font-bold text-emerald shrink-0 tabular-nums">
                    {formatCurrency(result.price)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded-[2px] bg-muted px-1 text-[10px] font-mono">↑</kbd>
              <kbd className="inline-flex h-4 items-center rounded-[2px] bg-muted px-1 text-[10px] font-mono">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded-[2px] bg-muted px-1 text-[10px] font-mono">↵</kbd>
              Open
            </span>
          </div>
          <span className="text-muted-foreground/50">
            Powered by EastGate
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
