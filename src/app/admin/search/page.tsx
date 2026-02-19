"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter,
  Loader2,
  CreditCard,
  Package,
  SlidersHorizontal,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

// Search result types
type SearchResultType = "booking" | "guest" | "room" | "staff" | "order" | "inventory" | "payment" | "event";

interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  status?: string;
  statusColor?: string;
  amount?: number;
  date?: string;
  link: string;
  data: any;
}

// Type configuration with icons and colors
const TYPE_CONFIG: Record<SearchResultType, { 
  labelKey: string; 
  icon: typeof Search; 
  color: string;
  bgColor: string;
  href: (id: string) => string;
}> = {
  booking: { 
    labelKey: "bookings", 
    icon: CalendarCheck, 
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    href: (id) => `/admin/bookings?id=${id}` 
  },
  guest: { 
    labelKey: "guests", 
    icon: Users, 
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    href: (id) => `/admin/guests?id=${id}` 
  },
  room: { 
    labelKey: "rooms", 
    icon: BedDouble, 
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    href: (id) => `/admin/rooms?id=${id}` 
  },
  staff: { 
    labelKey: "staffLabel", 
    icon: UserCog, 
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    href: (id) => `/admin/staff?id=${id}` 
  },
  order: { 
    labelKey: "orders", 
    icon: UtensilsCrossed, 
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    href: (id) => `/admin/restaurant?orderId=${id}` 
  },
  inventory: { 
    labelKey: "inventory", 
    icon: Package, 
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    href: (id) => `/admin/inventory?id=${id}` 
  },
  payment: { 
    labelKey: "payments", 
    icon: CreditCard, 
    color: "text-green-600",
    bgColor: "bg-green-100",
    href: (id) => `/admin/payments?id=${id}` 
  },
  event: { 
    labelKey: "eventsLabel", 
    icon: CalendarDays, 
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    href: (id) => `/admin/events?id=${id}` 
  },
};

// Quick filter suggestions
const QUICK_FILTERS = [
  { label: "Today's Check-ins", query: "check_in:today", icon: Calendar },
  { label: "Pending Orders", query: "status:pending", icon: UtensilsCrossed },
  { label: "VIP Guests", query: "vip:true", icon: Users },
  { label: "Available Rooms", query: "status:available", icon: BedDouble },
  { label: "Low Stock", query: "stock:low", icon: TrendingUp },
];

// Status options for filter
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "cancelled", label: "Cancelled" },
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const RECENT_KEY = "eastgate-admin-search-recent";
const MAX_RECENT = 8;

export default function AdminSearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const { t } = useI18n();
  
  const [query, setQuery] = useState(initialQ);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serverResults, setServerResults] = useState<SearchResult[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
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

  // Server-side search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setServerResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("q", query);
        if (activeTab !== "all") {
          params.set("type", activeTab);
        }
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const response = await fetch(`/api/admin/search?${params}`);
        const data = await response.json();
        
        if (data.results) {
          setServerResults(data.results);
        }
      } catch (error) {
        console.error("Search error:", error);
        setServerResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeTab, statusFilter]);

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

  // Handle search
  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) addRecent(q.trim());
  };

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    serverResults.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [serverResults]);

  const totalCount = serverResults.length;
  const hasResults = totalCount > 0;
  const showSuggestions = isFocused && !query && recentSearches.length > 0;

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('en-RW', { 
      style: 'currency', 
      currency: 'RWF',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const colors: Record<string, string> = {
      confirmed: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
      checked_in: "bg-blue-100 text-blue-700",
      checked_out: "bg-gray-100 text-gray-700",
      available: "bg-green-100 text-green-700",
      occupied: "bg-red-100 text-red-700",
      maintenance: "bg-yellow-100 text-yellow-700",
      preparing: "bg-blue-100 text-blue-700",
      ready: "bg-green-100 text-green-700",
      served: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      "in stock": "bg-green-100 text-green-700",
      "low stock": "bg-red-100 text-red-700",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-md text-charcoal">Advanced Search</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Search across all data: bookings, guests, rooms, staff, orders, inventory, and payments
          </p>
        </div>
      </div>

      {/* Search Box */}
      <Card className="border-transparent shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-text-muted-custom animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-text-muted-custom" />
              )}
            </div>
            <Input
              ref={inputRef}
              placeholder="Search anything... (e.g., 'john', 'room 101', 'status:pending')"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="pl-12 pr-32 h-14 text-base border-0 shadow-none ring-0 focus:ring-0 focus:ring-offset-0"
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
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-1 text-text-muted-custom hover:text-charcoal"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-md bg-pearl px-1.5 font-mono text-[10px] font-medium text-text-muted-custom">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t border-pearl px-4 py-4 bg-pearl/20 space-y-4">
              <div className="flex flex-wrap gap-4">
                {/* Type Filter Tabs */}
                <div>
                  <label className="text-xs font-medium text-text-muted-custom mb-2 block">Type</label>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
                      <TabsTrigger value="bookings" className="text-xs px-3 h-6">Bookings</TabsTrigger>
                      <TabsTrigger value="guests" className="text-xs px-3 h-6">Guests</TabsTrigger>
                      <TabsTrigger value="rooms" className="text-xs px-3 h-6">Rooms</TabsTrigger>
                      <TabsTrigger value="orders" className="text-xs px-3 h-6">Orders</TabsTrigger>
                      <TabsTrigger value="inventory" className="text-xs px-3 h-6">Inventory</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-text-muted-custom mb-2 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-md border border-pearl bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-text-muted-custom flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Quick filters:
                </span>
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.query}
                    onClick={() => handleSearch(filter.query)}
                    className="px-3 py-1 bg-white border border-pearl rounded-full text-xs hover:border-emerald hover:text-emerald transition-colors flex items-center gap-1"
                  >
                    <filter.icon className="h-3 w-3" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches & Suggestions */}
          {(showSuggestions || (query && !hasResults)) && (
            <div className="border-t border-pearl px-4 py-3 bg-pearl/20">
              {showSuggestions && !query && recentSearches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted-custom flex items-center gap-1">
                      <History className="h-3 w-3" /> Recent Searches
                    </span>
                    <button 
                      onClick={clearRecent}
                      className="text-xs text-text-muted-custom hover:text-charcoal"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0, 6).map((q) => (
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

              {/* No Results */}
              {query && !hasResults && !isLoading && (
                <div className="text-center py-4">
                  <p className="text-sm text-text-muted-custom">
                    No results found for "{query}". Try different keywords or filters.
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
          {/* Result Count & Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-normal bg-emerald/10 text-emerald">
                {totalCount} {totalCount === 1 ? "result" : "results"}
              </Badge>
              {query && (
                <span className="text-xs text-text-muted-custom">
                  for "{query}"
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Type Summary */}
              {Object.entries(groupedResults).map(([type, items]) => {
                const config = TYPE_CONFIG[type as SearchResultType];
                if (!config) return null;
                return (
                  <div key={type} className="flex items-center gap-1 text-xs text-text-muted-custom">
                    <config.icon className={cn("h-3 w-3", config.color)} />
                    <span>{items.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Result Cards by Type */}
          <div className="grid gap-4">
            {(Object.keys(groupedResults) as SearchResultType[]).map((type) => {
              const list = groupedResults[type];
              if (list.length === 0) return null;
              
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              
              return (
                <Card key={type} className="border-transparent shadow-sm overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-pearl/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.bgColor)}>
                          <Icon className={cn("h-3.5 w-3.5", config.color)} />
                        </div>
                        {config.labelKey.charAt(0).toUpperCase() + config.labelKey.slice(1)}
                        <Badge variant="outline" className="text-xs font-normal ml-1">
                          {list.length}
                        </Badge>
                      </CardTitle>
                      <Link 
                        href={config.href("").replace("?id=", "/")}
                        className="text-xs text-emerald hover:underline flex items-center gap-1"
                      >
                        View All <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-pearl/50">
                      {list.slice(0, 5).map((result) => (
                        <Link
                          key={result.id}
                          href={config.href(result.id)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-pearl/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-charcoal truncate">{result.title}</p>
                              <p className="text-xs text-text-muted-custom truncate">{result.subtitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {result.status && (
                              <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusBadge(result.status))}>
                                {result.status.replace("_", " ")}
                              </span>
                            )}
                            {result.amount !== undefined && (
                              <span className="text-sm font-semibold text-emerald">
                                {formatCurrency(result.amount)}
                              </span>
                            )}
                            {result.date && (
                              <span className="text-xs text-text-muted-custom hidden sm:inline">
                                {formatDate(result.date)}
                              </span>
                            )}
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

          {/* Load More */}
          {totalCount > 5 && (
            <div className="text-center">
              <Button variant="outline" className="text-sm">
                Load More Results ({totalCount - 5} more)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!query && (
        <Card className="border-transparent shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-pearl mx-auto flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-text-muted-custom" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">Start Searching</h3>
            <p className="text-sm text-text-muted-custom max-w-md mx-auto">
              Use the search bar above to find bookings, guests, rooms, staff, orders, inventory, and payments across your hotel.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {QUICK_FILTERS.slice(0, 3).map((filter) => (
                <button
                  key={filter.query}
                  onClick={() => handleSearch(filter.query)}
                  className="px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full text-sm text-emerald hover:bg-emerald hover:text-white transition-colors flex items-center gap-2"
                >
                  <filter.icon className="h-4 w-4" />
                  {filter.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
