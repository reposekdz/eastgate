"use client";

import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Search,
  Moon,
  Sun,
  CalendarCheck,
  Users,
  BedDouble,
  UserCog,
  UtensilsCrossed,
  CalendarDays,
  History,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { useAppDataStore } from "@/lib/store/app-data-store";
import { formatCurrency, getRoomTypeLabel } from "@/lib/format";

const RECENT_KEY = "eastgate-search-recent";
const MAX_RECENT = 8;
const PALETTE_LIMIT = 5;

export default function AdminTopbar() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { user } = useAuthStore();
  const getBranches = useBranchStore((s) => s.getBranches);
  const setSelectedBranch = useBranchStore((s) => s.setSelectedBranch);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const {
    branches: _branches,
    bookings,
    guests,
    rooms,
    staff,
    restaurantOrders,
    events,
    menuItems,
  } = useAppDataStore();
  const role = user?.role ?? "guest";
  const branches = getBranches(role, "all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
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

  const paletteResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const match = (text: string) => !q || text.toLowerCase().includes(q);
    const matchBranch = (branchId: string) =>
      !selectedBranchId || selectedBranchId === "all" || branchId === selectedBranchId;

    const bookingList = bookings.filter(
      (b) =>
        matchBranch(b.branchId) &&
        (match(b.guestName) || match(b.id) || match(b.roomNumber) || match(b.guestEmail ?? ""))
    );
    const guestList = guests.filter((g) => match(g.name) || match(g.email) || match(g.phone ?? ""));
    const roomList = rooms.filter(
      (r) =>
        matchBranch(r.branchId) &&
        (match(r.number) || match(r.currentGuest ?? "") || match(getRoomTypeLabel(r.type)))
    );
    const staffList = staff.filter(
      (s) =>
        matchBranch(s.branchId) &&
        (match(s.name) || match(s.email ?? "") || match(s.department))
    );
    const orderList = restaurantOrders.filter(
      (o) =>
        matchBranch(o.branchId) &&
        (match(o.id) || match(String(o.tableNumber)) || o.items.some((i) => match(i.name)))
    );
    const eventList = events.filter(
      (e) => match(e.name) || match(e.organizer ?? "") || match(e.type)
    );
    const menuList = menuItems.filter(
      (m) => match(m.name) || match(m.category) || match(m.description ?? "")
    );

    return {
      booking: bookingList.slice(0, PALETTE_LIMIT),
      guest: guestList.slice(0, PALETTE_LIMIT),
      room: roomList.slice(0, PALETTE_LIMIT),
      staff: staffList.slice(0, PALETTE_LIMIT),
      order: orderList.slice(0, PALETTE_LIMIT),
      event: eventList.slice(0, PALETTE_LIMIT),
      menu: menuList.slice(0, PALETTE_LIMIT),
    };
  }, [
    searchQuery,
    selectedBranchId,
    bookings,
    guests,
    rooms,
    staff,
    restaurantOrders,
    events,
    menuItems,
  ]);

  const handlePaletteSelect = useCallback(
    (href: string, query?: string) => {
      if (query?.trim()) addRecent(query.trim());
      setSearchOpen(false);
      router.push(href);
    },
    [router, addRecent]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      addRecent(q);
      router.push(`/admin/search?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4">
      <SidebarTrigger className="-ml-1 text-slate-custom hover:text-charcoal" />
      <Separator orientation="vertical" className="h-5" />

      {/* Branch Selector */}
      <Select value={selectedBranchId} onValueChange={setSelectedBranch}>
        <SelectTrigger className="w-[180px] h-8 text-sm border-dashed">
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search — opens command palette on focus or submit */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md ml-auto lg:ml-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
          <Input
            placeholder="Search rooms, bookings, guests, orders… (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="h-8 pl-8 text-sm bg-pearl/50 border-transparent focus:bg-white focus:border-input"
          />
        </div>
      </form>

      {/* Command palette — live data from store */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Admin Search"
        description="Search bookings, guests, rooms, staff, orders, events, and menu"
      >
        <CommandInput
          placeholder="Search bookings, guests, rooms, staff, orders, events, menu…"
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results. Try another term or open full search.</CommandEmpty>
          {recentSearches.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentSearches.slice(0, 5).map((q) => (
                  <CommandItem
                    key={q}
                    value={q}
                    onSelect={() => handlePaletteSelect(`/admin/search?q=${encodeURIComponent(q)}`, q)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    {q}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          {paletteResults.booking.length > 0 && (
            <CommandGroup heading="Bookings">
              {paletteResults.booking.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.id} ${b.guestName}`}
                  onSelect={() => handlePaletteSelect(`/admin/bookings?highlight=${b.id}`)}
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  {b.guestName} · {b.roomNumber} · {b.id}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {paletteResults.guest.length > 0 && (
            <CommandGroup heading="Guests">
              {paletteResults.guest.map((g) => (
                <CommandItem
                  key={g.id}
                  value={`${g.name} ${g.email}`}
                  onSelect={() => handlePaletteSelect("/admin/guests")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {g.name} · {g.email}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {paletteResults.room.length > 0 && (
            <CommandGroup heading="Rooms">
              {paletteResults.room.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.number} ${r.currentGuest ?? ""}`}
                  onSelect={() => handlePaletteSelect("/admin/rooms")}
                >
                  <BedDouble className="h-4 w-4 mr-2" />
                  {r.number} · {getRoomTypeLabel(r.type)} {r.currentGuest ? `· ${r.currentGuest}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {paletteResults.staff.length > 0 && (
            <CommandGroup heading="Staff">
              {paletteResults.staff.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.department}`}
                  onSelect={() => handlePaletteSelect("/admin/staff")}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  {s.name} · {s.department}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {paletteResults.order.length > 0 && (
            <CommandGroup heading="Orders">
              {paletteResults.order.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => handlePaletteSelect("/admin/restaurant")}
                >
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  {o.id} · {formatCurrency(o.total)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {paletteResults.event.length > 0 && (
            <CommandGroup heading="Events">
              {paletteResults.event.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.name} ${e.organizer ?? ""}`}
                  onSelect={() => handlePaletteSelect("/admin/events")}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {e.name} · {e.date}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {paletteResults.menu.length > 0 && (
            <CommandGroup heading="Menu">
              {paletteResults.menu.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.name} ${m.category}`}
                  onSelect={() => handlePaletteSelect("/admin/restaurant")}
                >
                  <UtensilsCrossed className="h-4 w-4 mr-2" />
                  {m.name} · {formatCurrency(m.price)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Right Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-custom hover:text-charcoal"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src="https://i.pravatar.cc/40?u=admin-jp" alt="Admin" />
            <AvatarFallback className="bg-emerald text-white text-[10px]">JP</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-medium text-charcoal leading-tight">Jean-Pierre H.</span>
            <span className="text-[10px] text-text-muted-custom leading-tight">Kigali Main</span>
          </div>
        </div>
      </div>
    </header>
  );
}
