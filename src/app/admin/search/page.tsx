"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { useAppDataStore } from "@/lib/store/app-data-store";
import { useI18n } from "@/lib/i18n/context";
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
  Building2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RECENT_KEY = "eastgate-search-recent";
const MAX_RECENT = 10;

type ResultType = "booking" | "guest" | "room" | "staff" | "order" | "event";

const TYPE_CONFIG: Record<ResultType, { label: string; icon: typeof Search; href: (id: string, branchId?: string) => string }> = {
  booking: { label: "Bookings", icon: CalendarCheck, href: (id) => `/admin/bookings?highlight=${id}` },
  guest: { label: "Guests", icon: Users, href: () => `/admin/guests` },
  room: { label: "Rooms", icon: BedDouble, href: () => `/admin/rooms` },
  staff: { label: "Staff", icon: UserCog, href: () => `/admin/staff` },
  order: { label: "Orders", icon: UtensilsCrossed, href: () => `/admin/restaurant` },
  event: { label: "Events", icon: CalendarDays, href: () => `/admin/events` },
};

export default function AdminSearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const { t } = useI18n();
  const { user } = useAuthStore();
  const getBranches = useBranchStore((s) => s.getBranches);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const {
    branches,
    bookings,
    guests,
    rooms,
    staff,
    restaurantOrders,
    events,
  } = useAppDataStore();

  const [query, setQuery] = useState(initialQ);
  const [typeFilter, setTypeFilter] = useState<ResultType | "all">("all");
  const [branchFilter, setBranchFilter] = useState(selectedBranchId || "all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "guest";
  const isSuper = role === "super_admin" || role === "super_manager";
  const branchList = getBranches(role, "all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch {
      setRecentSearches([]);
    }
  }, []);

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { booking: [], guest: [], room: [], staff: [], order: [], event: [] };

    const match = (text: string) => text.toLowerCase().includes(q);
    const matchBranch = (branchId: string) =>
      branchFilter === "all" || branchId === branchFilter;

    const bookingList = typeFilter === "all" || typeFilter === "booking"
      ? bookings.filter(
          (b) =>
            matchBranch(b.branchId) &&
            (match(b.guestName) || match(b.id) || match(b.roomNumber) || match(b.guestEmail))
        )
      : [];
    const guestList = typeFilter === "all" || typeFilter === "guest"
      ? guests.filter((g) => match(g.name) || match(g.email) || match(g.phone))
      : [];
    const roomList = typeFilter === "all" || typeFilter === "room"
      ? rooms.filter(
          (r) =>
            matchBranch(r.branchId) &&
            (match(r.number) || match(r.currentGuest ?? "") || match(getRoomTypeLabel(r.type)))
        )
      : [];
    const staffList = typeFilter === "all" || typeFilter === "staff"
      ? staff.filter(
          (s) =>
            matchBranch(s.branchId) &&
            (match(s.name) || match(s.email) || match(s.department))
        )
      : [];
    const orderList = typeFilter === "all" || typeFilter === "order"
      ? restaurantOrders.filter(
          (o) =>
            matchBranch(o.branchId) &&
            (match(o.id) || match(o.guestName ?? "") || o.items.some((i) => match(i.name)))
        )
      : [];
    const eventList = typeFilter === "all" || typeFilter === "event"
      ? events.filter(
          (e) =>
            match(e.name) || match(e.organizer) || match(e.type)
        )
      : [];

    return {
      booking: bookingList.slice(0, 15),
      guest: guestList.slice(0, 15),
      room: roomList.slice(0, 15),
      staff: staffList.slice(0, 15),
      order: orderList.slice(0, 15),
      event: eventList.slice(0, 15),
    };
  }, [
    query,
    typeFilter,
    branchFilter,
    bookings,
    guests,
    rooms,
    staff,
    restaurantOrders,
    events,
  ]);

  const totalCount =
    results.booking.length +
    results.guest.length +
    results.room.length +
    results.staff.length +
    results.order.length +
    results.event.length;

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) addRecent(q.trim());
  };

  useEffect(() => {
    if (initialQ) setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">{t("admin", "searchTitle")}</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          {t("admin", "searchSubtitle")}
        </p>
      </div>

      <Card className="border-transparent shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                ref={inputRef}
                placeholder="Search by name, ID, email, room, order..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                className="pl-9 h-10 text-base"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResultType | "all")}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(TYPE_CONFIG) as ResultType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSuper && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branchList.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button className="h-10 bg-emerald hover:bg-emerald-dark text-white" onClick={() => handleSearch(query)}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {recentSearches.length > 0 && !query && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted-custom">Recent:</span>
              {recentSearches.slice(0, 5).map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 rounded-full"
                  onClick={() => handleSearch(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {query.trim() && totalCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-muted-custom">
          <span>{totalCount} result{totalCount !== 1 ? "s" : ""}</span>
        </div>
      )}

      {query.trim() && totalCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-text-muted-custom/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-charcoal">No results for &quot;{query}&quot;</p>
            <p className="text-xs text-text-muted-custom mt-1">Try a different term or filter</p>
          </CardContent>
        </Card>
      )}

      {query.trim() && totalCount > 0 && (
        <div className="space-y-6">
          {(Object.keys(TYPE_CONFIG) as ResultType[]).map((type) => {
            const list = results[type];
            if (list.length === 0) return null;
            const config = TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <Card key={type} className="border-transparent shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon className="h-4 w-4 text-emerald" />
                    {config.label}
                    <Badge variant="secondary" className="text-xs font-normal">{list.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type === "booking" &&
                      list.map((b: { id: string; guestName: string; roomNumber: string; checkIn: string; status: string; totalAmount: number; branchId: string }) => (
                        <li key={b.id}>
                          <Link
                            href={config.href(b.id, b.branchId)}
                            className={cn(
                              "flex items-center justify-between gap-4 p-3 rounded-lg border border-transparent",
                              "hover:bg-pearl/50 hover:border-pearl transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                                <CalendarCheck className="h-4 w-4 text-emerald" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{b.guestName}</p>
                                <p className="text-xs text-text-muted-custom">{b.id} · Room {b.roomNumber} · {formatDate(b.checkIn)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(b.totalAmount)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    {type === "guest" &&
                      list.map((g: { id: string; name: string; email: string; totalSpent: number }) => (
                        <li key={g.id}>
                          <Link
                            href={config.href(g.id)}
                            className={cn(
                              "flex items-center justify-between gap-4 p-3 rounded-lg border border-transparent",
                              "hover:bg-pearl/50 hover:border-pearl transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                                <Users className="h-4 w-4 text-emerald" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{g.name}</p>
                                <p className="text-xs text-text-muted-custom truncate">{g.email}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-emerald shrink-0">{formatCurrency(g.totalSpent)}</span>
                            <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                          </Link>
                        </li>
                      ))}
                    {type === "room" &&
                      list.map((r: { id: string; number: string; type: string; status: string; price: number; currentGuest?: string; branchId: string }) => (
                        <li key={r.id}>
                          <Link
                            href={config.href(r.id, r.branchId)}
                            className={cn(
                              "flex items-center justify-between gap-4 p-3 rounded-lg border border-transparent",
                              "hover:bg-pearl/50 hover:border-pearl transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                                <BedDouble className="h-4 w-4 text-emerald" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal">Room {r.number}</p>
                                <p className="text-xs text-text-muted-custom">{getRoomTypeLabel(r.type as never)} · {r.status}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.currentGuest && <span className="text-xs text-slate-custom truncate max-w-[100px]">{r.currentGuest}</span>}
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(r.price)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    {type === "staff" &&
                      list.map((s: { id: string; name: string; email: string; department: string; role: string }) => (
                        <li key={s.id}>
                          <Link
                            href={config.href(s.id)}
                            className={cn(
                              "flex items-center justify-between gap-4 p-3 rounded-lg border border-transparent",
                              "hover:bg-pearl/50 hover:border-pearl transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                                <UserCog className="h-4 w-4 text-emerald" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{s.name}</p>
                                <p className="text-xs text-text-muted-custom truncate">{s.department} · {s.role}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                          </Link>
                        </li>
                      ))}
                    {type === "order" &&
                      list.map((o: { id: string; tableNumber: number; total: number; status: string; guestName?: string; createdAt: string }) => (
                        <li key={o.id}>
                          <Link
                            href={config.href(o.id)}
                            className={cn(
                              "flex items-center justify-between gap-4 p-3 rounded-lg border border-transparent",
                              "hover:bg-pearl/50 hover:border-pearl transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                                <UtensilsCrossed className="h-4 w-4 text-emerald" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal">{o.id}</p>
                                <p className="text-xs text-text-muted-custom">Table {o.tableNumber} · {o.guestName ?? "—"} · {formatDate(o.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                              <span className="text-sm font-semibold text-emerald">{formatCurrency(o.total)}</span>
                              <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    {type === "event" &&
                      list.map((e: { id: string; name: string; type: string; date: string; totalAmount: number; status: string }) => (
                        <li key={e.id}>
                          <Link
                            href={config.href(e.id)}
                            className={cn(
                              "flex items-center justify-between gap-4 p-3 rounded-lg border border-transparent",
                              "hover:bg-pearl/50 hover:border-pearl transition-colors"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                                <CalendarDays className="h-4 w-4 text-emerald" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-charcoal truncate">{e.name}</p>
                                <p className="text-xs text-text-muted-custom">{e.type} · {formatDate(e.date)} · {e.status}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-emerald shrink-0">{formatCurrency(e.totalAmount)}</span>
                            <ArrowRight className="h-4 w-4 text-text-muted-custom" />
                          </Link>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
