"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { useAppDataStore } from "@/lib/store/app-data-store";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationSubKey } from "@/lib/i18n/translations";
import { formatCurrency, formatDate, getRoomTypeLabel } from "@/lib/format";
import {
  Search,
  X,
  CalendarCheck,
  Users,
  BedDouble,
  UserCog,
  UtensilsCrossed,
  CalendarDays,
  ArrowRight,
  Clock,
  Zap,
  Command,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

// bring in schema types for strong typing
import type {
  Booking,
  Guest,
  Room,
  StaffMember,
  RestaurantOrder,
  HotelEvent,
} from "@/lib/types/schema";

const RECENT_KEY = "eastgate-search-recent";
const MAX_RECENT = 8;

// Search result type
type ResultType = "booking" | "guest" | "room" | "staff" | "order" | "event";

// a strongly typed result object; helps narrow when indexing with `type`
type Results = {
  booking: Booking[];
  guest: Guest[];
  room: Room[];
  staff: StaffMember[];
  order: RestaurantOrder[];
  event: HotelEvent[];
};

// Type configuration with icons and links
// includes which translation section the label lives in so we can
// look up either common or admin keys.
type TranslationSection = "common" | "admin";

type TypeConfigEntry = {
  section: TranslationSection;
  labelKey: string; // we handle casting manually when translating
  icon: typeof Search;
  color: string;
  href: (id: string, branchId?: string) => string;
};

const TYPE_CONFIG: Record<ResultType, TypeConfigEntry> = {
  booking: { section: "common", labelKey: "bookings", icon: CalendarCheck, color: "bg-blue-500", href: (id) => `/admin/bookings?highlight=${id}` },
  guest: { section: "common", labelKey: "guests", icon: Users, color: "bg-emerald-500", href: () => `/admin/guests` },
  room: { section: "common", labelKey: "rooms", icon: BedDouble, color: "bg-purple-500", href: () => `/admin/rooms` },
  staff: { section: "admin", labelKey: "staffLabel", icon: UserCog, color: "bg-orange-500", href: () => `/admin/staff` },
  order: { section: "common", labelKey: "orders", icon: UtensilsCrossed, color: "bg-pink-500", href: () => `/admin/restaurant` },
  event: { section: "admin", labelKey: "eventsLabel", icon: CalendarDays, color: "bg-indigo-500", href: () => `/admin/events` },
};
// Quick search suggestions with i18n keys
interface QuickSuggestion {
  labelKey: string; // admin keys, cast when used
  query: string;
  icon: typeof Search;
}

const getQuickSuggestions = (t: Function): QuickSuggestion[] => [
  { labelKey: "todayBookings", query: "check_in:today", icon: CalendarCheck },
  { labelKey: "pendingOrders", query: "status:pending", icon: UtensilsCrossed },
  { labelKey: "vipGuests", query: "vip", icon: Users },
  { labelKey: "availableRooms", query: "status:available", icon: BedDouble },
];

export default function AdminSearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const { t } = useI18n();
  const { user } = useAuthStore();
  const getBranches = useBranchStore((s) => s.getBranches);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const {
    bookings,
    guests,
    rooms,
    staff,
    restaurantOrders,
    events,
  } = useAppDataStore();

  const [query, setQuery] = useState(initialQ);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "guest";
  const isSuper = role === "super_admin" || role === "super_manager";

  // Load recent searches
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Save to recent searches
  const addRecent = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches((prev) => {
      const next = [q.trim(), ...prev.filter((x) => x !== q.trim())].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  }, []);

  // Perform search with instant results
  const results: Results | null = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const match = (text: string) => text.toLowerCase().includes(q);

    const bookingList: Booking[] = bookings.filter(
      (b) => match(b.guestName) || match(b.id) || match(b.roomNumber) || match(b.guestEmail)
    ).slice(0, 10);

    const guestList: Guest[] = guests.filter((g) => match(g.name) || match(g.email) || match(g.phone)).slice(0, 10);

    const roomList: Room[] = rooms.filter(
      (r) => match(r.number) || match(r.currentGuest ?? "") || match(getRoomTypeLabel(r.type))
    ).slice(0, 10);

    const staffList: StaffMember[] = staff.filter(
      (s) => match(s.name) || match(s.email) || match(s.department)
    ).slice(0, 10);

    const orderList: RestaurantOrder[] = restaurantOrders.filter(
      (o) => match(o.id) || match(o.guestName ?? "") || o.items.some((i) => match(i.name))
    ).slice(0, 10);

    const eventList: HotelEvent[] = events.filter(
      (e) => match(e.name) || match(e.organizer) || match(e.type)
    ).slice(0, 10);

    return {
      booking: bookingList,
      guest: guestList,
      room: roomList,
      staff: staffList,
      order: orderList,
      event: eventList,
    };
  }, [query, bookings, guests, rooms, staff, restaurantOrders, events]);

  // Calculate totals
  const totalCount = results 
    ? results.booking.length + results.guest.length + results.room.length + 
      results.staff.length + results.order.length + results.event.length
    : 0;

  // Handle search submit
  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) addRecent(q.trim());
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults = results && totalCount > 0;
  const showSuggestions = isFocused && !query && (recentSearches.length > 0 || getQuickSuggestions(t).length > 0);
  const quickSuggestions = getQuickSuggestions(t);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-md text-charcoal">{(t as any)("admin", "searchTitle")}</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          {(t as any)("admin", "searchSubtitle")}
        </p>
      </div>

      {/* Search Box - Clean & Powerful */}
      <Card className="border-transparent shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Search className="h-5 w-5 text-text-muted-custom" />
              <span className="text-xs text-text-muted-custom font-medium hidden sm:inline">
                {(t as any)("admin", "searchPlaceholder")}
              </span>
            </div>
            <Input
              ref={inputRef}
              placeholder={(t as any)("admin", "searchPlaceholder")}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="pl-12 pr-24 h-14 text-base border-0 shadow-none ring-0 focus:ring-0 focus:ring-offset-0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-pearl"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-md bg-pearl px-1.5 font-mono text-[10px] font-medium text-text-muted-custom">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>

          {/* Quick Actions & Recent */}
          {(showSuggestions || (query && !hasResults)) && (
            <div className="border-t border-pearl px-4 py-3 bg-pearl/20">
              {showSuggestions && !query && (
                <div className="space-y-3">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-text-muted-custom flex items-center gap-1">
                          <History className="h-3 w-3" /> {(t as any)("admin", "recent")}
                        </span>
                        <button 
                          onClick={clearRecent}
                          className="text-xs text-text-muted-custom hover:text-charcoal"
                        >
                          {t("common", "clear" as TranslationSubKey<"common">)}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.slice(0, 5).map((q) => (
                          <button
                            key={q}
                            onClick={() => handleSearch(q)}
                            className="px-3 py-1.5 bg-white border border-pearl rounded-full text-xs hover:border-emerald hover:text-emerald transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Suggestions */}
                  <div>
                    <span className="text-xs font-medium text-text-muted-custom flex items-center gap-1 mb-2">
                      <Zap className="h-3 w-3" /> {(t as any)("admin", "quickFilters")}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {quickSuggestions.map((s) => (
                        <button
                          key={s.query}
                          onClick={() => handleSearch(s.query)}
                          className="px-3 py-1.5 bg-emerald/10 border border-emerald/20 rounded-full text-xs text-emerald hover:bg-emerald hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          <s.icon className="h-3 w-3" />
                          {(t as any)("admin", s.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No Results */}
              {query && !hasResults && (
                <div className="text-center py-2">
                  <p className="text-sm text-text-muted-custom">
                    {(t as any)("admin", "noResultsTry")}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {query && hasResults && (
        <div className="space-y-4">
          {/* Result Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm font-normal">
                {totalCount} {totalCount !== 1 ? t("common", "items") : ""}
              </Badge>
              {query && (
                <span className="text-xs text-text-muted-custom">
                  {(t as any)("admin", "resultsFor")} "{query}"
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuery("")}
              className="text-xs"
            >
              {(t as any)("admin", "clearSearch")}
            </Button>
          </div>

          {/* Result Cards - Clean Layout */}
          <div className="grid gap-4">
            {(Object.keys(TYPE_CONFIG) as ResultType[]).map((type) => {
              const list = results![type]; // results guaranteed by hasResults check
              if (list.length === 0) return null;
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              
              return (
                <Card key={type} className="border-transparent shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-pearl/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.color)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        {config.section === "admin" ? (t as any)("admin", config.labelKey) : t("common", config.labelKey as any)}
                        <Badge variant="outline" className="text-xs font-normal ml-1">
                          {list.length}
                        </Badge>
                      </CardTitle>
                      <Link 
                        href={config.href("")}
                        className="text-xs text-emerald hover:underline flex items-center gap-1"
                      >
                        {(t as any)("admin", "viewAll")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-pearl/50">
                      {type === "booking" &&
                        (list as Booking[]).slice(0, 5).map((b) => (
                          <Link
                            key={b.id}
                            href={config.href(b.id, b.branchId)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                <CalendarCheck className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{b.guestName}</p>
                                <p className="text-xs text-text-muted-custom">
                                  {b.id} · {t("common", "room")} {b.roomNumber} · {formatDate(b.checkIn)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-pearl">{b.status.replace("_", " ")}</span>
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(b.totalAmount)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        ))}
                      {type === "guest" &&
                        (list as Guest[]).slice(0, 5).map((g) => (
                          <Link
                            key={g.id}
                            href={config.href(g.id)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                <Users className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{g.name}</p>
                                <p className="text-xs text-text-muted-custom truncate">{g.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(g.totalSpent)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        ))}
                      {type === "room" &&
                        (list as Room[]).slice(0, 5).map((r) => (
                          <Link
                            key={r.id}
                            href={config.href(r.id, r.branchId)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                <BedDouble className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal">{t("common", "room")} {r.number}</p>
                                <p className="text-xs text-text-muted-custom">{getRoomTypeLabel(r.type as never)} · {r.status}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.currentGuest && (
                                <span className="text-xs text-text-muted-custom truncate max-w-[80px]">{r.currentGuest}</span>
                              )}
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(r.price)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        ))}
                      {type === "staff" &&
                        (list as StaffMember[]).slice(0, 5).map((s) => (
                          <Link
                            key={s.id}
                            href={config.href(s.id)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                                <UserCog className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{s.name}</p>
                                <p className="text-xs text-text-muted-custom truncate">{s.department} · {s.role}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                          </Link>
                        ))}
                      {type === "order" &&
                        (list as RestaurantOrder[]).slice(0, 5).map((o) => (
                          <Link
                            key={o.id}
                            href={config.href(o.id)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                                <UtensilsCrossed className="h-4 w-4 text-pink-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal">{o.id}</p>
                                <p className="text-xs text-text-muted-custom">Table {o.tableNumber} · {o.guestName ?? "—"} · {formatDate(o.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-pearl">{o.status}</span>
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(o.total)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        ))}
                      {type === "event" &&
                        (list as HotelEvent[]).slice(0, 5).map((e) => (
                          <Link
                            key={e.id}
                            href={config.href(e.id)}
                            className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                <CalendarDays className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{e.name}</p>
                                <p className="text-xs text-text-muted-custom">{e.type} · {formatDate(e.date)} · {e.status}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(e.totalAmount)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State - When no search */}
      {!query && (
        <Card className="border-dashed border-2 border-pearl">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-pearl/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-text-muted-custom/40" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              {(t as any)("admin", "startSearching")}
            </h3>
            <p className="text-sm text-text-muted-custom max-w-md mx-auto mb-6">
              {(t as any)("admin", "searchSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickSuggestions.map((s) => (
                <Button
                  key={s.query}
                  variant="outline"
                  onClick={() => handleSearch(s.query)}
                  className="gap-2"
                >
                  <s.icon className="h-4 w-4" />
                  {(t as any)("admin", s.labelKey)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
