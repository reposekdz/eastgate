"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import { 
  Search, 
  BedDouble, 
  UtensilsCrossed, 
  Calendar, 
  Sparkles,
  Loader2,
  ArrowRight,
  Star,
  Clock,
  MapPin,
  DollarSign,
  Filter,
  RefreshCw,
  X,
  Users,
  Building2,
  PartyPopper,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  ChevronRight,
  Package,
} from "lucide-react";
import Link from "next/link";

// Types
interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  status: string;
  floor: number;
  description?: string;
  amenities?: string[];
}

interface MenuItem {
  id: string;
  name: string;
  nameKinyarwanda?: string;
  category: string;
  price: number;
  description?: string;
  preparationTime?: number;
  dietary?: string[];
  rating?: number;
}

interface Event {
  id: string;
  name: string;
  type?: string;
  eventDate?: string;
  hall?: string;
  capacity?: number;
}

interface Service {
  id: string;
  name: string;
  nameRw?: string;
  description?: string;
  price?: number;
  duration?: number;
  type?: string;
  category?: string;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
}

interface SearchResult {
  rooms: Room[];
  menuItems: MenuItem[];
  events: Event[];
  services: Service[];
  branches: Branch[];
  featured?: {
    rooms: Room[];
    menu: MenuItem[];
    events: Event[];
  };
  totalResults: number;
  resultsPerCategory?: {
    rooms: number;
    menuItems: number;
    events: number;
    services: number;
    branches: number;
  };
  timestamp?: string;
}

// Category icons and colors
const categoryConfig: Record<string, { icon: typeof BedDouble; color: string; bgColor: string }> = {
  rooms: { icon: BedDouble, color: "text-purple-600", bgColor: "bg-purple-100" },
  menu: { icon: UtensilsCrossed, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  events: { icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
  services: { icon: Sparkles, color: "text-orange-600", bgColor: "bg-orange-100" },
  branches: { icon: Building2, color: "text-indigo-600", bgColor: "bg-indigo-100" },
};

// Room type colors
const roomTypeColors: Record<string, string> = {
  STANDARD: "bg-slate-500/20 text-slate-600",
  DELUXE: "bg-amber-500/20 text-amber-600",
  FAMILY: "bg-green-500/20 text-green-600",
  EXECUTIVE_SUITE: "bg-purple-500/20 text-purple-600",
  PRESIDENTIAL_SUITE: "bg-rose-500/20 text-rose-600",
};

// Menu category colors
const categoryColors: Record<string, string> = {
  BREAKFAST: "bg-amber-500/20 text-amber-600",
  APPETIZER: "bg-orange-500/20 text-orange-600",
  MAIN_COURSE: "bg-emerald-500/20 text-emerald-600",
  DESSERT: "bg-pink-500/20 text-pink-600",
  BEVERAGES: "bg-blue-500/20 text-blue-600",
  COCKTAILS: "bg-purple-500/20 text-purple-600",
  WINE: "bg-red-500/20 text-red-600",
};

// Quick search suggestions
const quickSearchTags = [
  { label: "Rooms", icon: BedDouble, query: "room" },
  { label: "Dining", icon: UtensilsCrossed, query: "dinner" },
  { label: "Spa", icon: Sparkles, query: "spa" },
  { label: "Events", icon: Calendar, query: "wedding" },
  { label: "WiFi", icon: Wifi, query: "wifi" },
  { label: "Parking", icon: Car, query: "parking" },
  { label: "Gym", icon: Dumbbell, query: "gym" },
  { label: "Pool", icon: Waves, query: "pool" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { t, isRw } = useI18n();
  
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        // Load featured items when no query
        loadFeatured();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Load featured items on mount
  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    try {
      const response = await fetch(`/api/public/search?q=`);
      const data = await response.json();
      if (data.success) {
        setResults(data);
        setLastUpdate(new Date(data.timestamp));
      }
    } catch (error) {
      console.error("Failed to load featured:", error);
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const searchTerm = searchQuery || query;
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearched(true);
    
    try {
      const response = await fetch(`/api/public/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setResults(data);
      setLastUpdate(new Date(data.timestamp));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = async () => {
    if (!query.trim()) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/public/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
      setLastUpdate(new Date(data.timestamp));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSearched(false);
    setResults(null);
    loadFeatured();
  };

  // Get filtered results based on active tab
  const filteredResults = useMemo(() => {
    if (!results) return null;
    
    switch (activeTab) {
      case "rooms":
        return { ...results, rooms: results.rooms, totalResults: results.resultsPerCategory?.rooms || 0 };
      case "menu":
        return { ...results, menuItems: results.menuItems, totalResults: results.resultsPerCategory?.menuItems || 0 };
      case "events":
        return { ...results, events: results.events, totalResults: results.resultsPerCategory?.events || 0 };
      case "services":
        return { ...results, services: results.services, totalResults: results.resultsPerCategory?.services || 0 };
      default:
        return results;
    }
  }, [results, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Discover EastGate
            </h1>
            <p className="text-slate-300 text-center text-lg mb-8">
              Search rooms, dining, events, services & more
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search rooms, menu, events, services..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg bg-white text-slate-900 border-0 rounded-xl shadow-lg"
                  />
                  {query && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => handleSearch()}
                  disabled={isSearching || !query.trim()}
                  className="px-8 py-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {quickSearchTags.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => setQuery(tag.query)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                >
                  <tag.icon className="w-4 h-4" />
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {results && (
          <>
            {/* Results Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                {searched ? (
                  <p className="text-slate-600">
                    Found <span className="font-bold text-slate-900">{results.totalResults}</span> results
                    {query && <span> for "<span className="font-semibold">{query}</span>"</span>}
                  </p>
                ) : (
                  <p className="text-slate-600">Featured offerings from EastGate Hotel</p>
                )}
                {lastUpdate && (
                  <p className="text-xs text-slate-400 mt-1">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
              
              {searched && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="bg-white shadow-sm p-1 h-auto flex-wrap">
                <TabsTrigger value="all" className="gap-2">
                  All Results
                  {results.totalResults > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {results.totalResults}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rooms" className="gap-2">
                  <BedDouble className="w-4 h-4" />
                  Rooms
                  {results.resultsPerCategory?.rooms && (
                    <Badge variant="secondary" className="ml-1">
                      {results.resultsPerCategory.rooms}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="menu" className="gap-2">
                  <UtensilsCrossed className="w-4 h-4" />
                  Dining
                  {results.resultsPerCategory?.menuItems && (
                    <Badge variant="secondary" className="ml-1">
                      {results.resultsPerCategory.menuItems}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Events
                  {results.resultsPerCategory?.events && (
                    <Badge variant="secondary" className="ml-1">
                      {results.resultsPerCategory.events}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="services" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Services
                  {results.resultsPerCategory?.services && (
                    <Badge variant="secondary" className="ml-1">
                      {results.resultsPerCategory.services}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* All Results Tab */}
              <TabsContent value="all" className="mt-6">
                {results.totalResults === 0 ? (
                  <EmptyState onClear={clearSearch} />
                ) : (
                  <div className="space-y-8">
                    {/* Rooms Section */}
                    {(activeTab === "all" || activeTab === "rooms") && results.rooms.length > 0 && (
                      <ResultsSection
                        title="Rooms & Suites"
                        icon={BedDouble}
                        total={results.rooms.length}
                        viewAllLink="/rooms"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.rooms.slice(0, 6).map((room) => (
                            <RoomCard key={room.id} room={room} />
                          ))}
                        </div>
                      </ResultsSection>
                    )}

                    {/* Menu Section */}
                    {(activeTab === "all" || activeTab === "menu") && results.menuItems.length > 0 && (
                      <ResultsSection
                        title="Dining & Menu"
                        icon={UtensilsCrossed}
                        total={results.menuItems.length}
                        viewAllLink="/menu"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.menuItems.slice(0, 6).map((item) => (
                            <MenuCard key={item.id} item={item} />
                          ))}
                        </div>
                      </ResultsSection>
                    )}

                    {/* Events Section */}
                    {(activeTab === "all" || activeTab === "events") && results.events.length > 0 && (
                      <ResultsSection
                        title="Upcoming Events"
                        icon={Calendar}
                        total={results.events.length}
                        viewAllLink="/events"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.events.slice(0, 6).map((event) => (
                            <EventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </ResultsSection>
                    )}

                    {/* Services Section */}
                    {(activeTab === "all" || activeTab === "services") && results.services.length > 0 && (
                      <ResultsSection
                        title="Services & Amenities"
                        icon={Sparkles}
                        total={results.services.length}
                        viewAllLink="/spa"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.services.slice(0, 6).map((service, idx) => (
                            <ServiceCard key={service.id || idx} service={service} />
                          ))}
                        </div>
                      </ResultsSection>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Rooms Tab */}
              <TabsContent value="rooms" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.rooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </TabsContent>

              {/* Menu Tab */}
              <TabsContent value="menu" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.menuItems.map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.services.map((service, idx) => (
                    <ServiceCard key={service.id || idx} service={service} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
            <p className="text-slate-600">Searching...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Results Section Component
function ResultsSection({ 
  title, 
  icon: Icon, 
  total, 
  viewAllLink, 
  children 
}: { 
  title: string; 
  icon: any; 
  total: number; 
  viewAllLink: string; 
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <Badge variant="outline">{total}</Badge>
        </div>
        <Link href={viewAllLink} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      {children}
    </div>
  );
}

// Room Card Component
function RoomCard({ room }: { room: Room }) {
  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
        <BedDouble className="w-12 h-12 text-white/80" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-slate-900">Room {room.number}</h3>
            <Badge className={`mt-1 ${roomTypeColors[room.type] || 'bg-slate-100'}`}>
              {room.type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600">${room.price}</p>
            <p className="text-xs text-slate-500">per night</p>
          </div>
        </div>
        {room.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{room.description}</p>
        )}
        <Link href={`/book?room=${room.number}`}>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Book Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Menu Card Component
function MenuCard({ item }: { item: MenuItem }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{item.name}</h3>
            {item.nameKinyarwanda && (
              <p className="text-xs text-slate-500">{item.nameKinyarwanda}</p>
            )}
          </div>
          <Badge className={`ml-2 ${categoryColors[item.category] || 'bg-slate-100'}`}>
            {item.category}
          </Badge>
        </div>
        {item.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {item.rating && (
              <>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
              </>
            )}
            {item.preparationTime && (
              <span className="flex items-center gap-1 text-xs text-slate-500 ml-2">
                <Clock className="w-3 h-3" />
                {item.preparationTime} min
              </span>
            )}
          </div>
          <span className="font-bold text-emerald-600">${item.price}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Event Card Component
function EventCard({ event }: { event: Event }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <PartyPopper className="w-5 h-5 text-blue-600" />
          <Badge variant="outline">{event.type}</Badge>
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">{event.name}</h3>
        {event.eventDate && (
          <p className="text-sm text-slate-600 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(event.eventDate).toLocaleDateString()}
          </p>
        )}
        {event.hall && (
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" />
            {event.hall} • Up to {event.capacity} guests
          </p>
        )}
        <Link href="/events">
          <Button variant="outline" className="w-full mt-3">
            Learn More
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Service Card Component
function ServiceCard({ service }: { service: Service }) {
  const getIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'SPA': return Sparkles;
      case 'FITNESS': return Dumbbell;
      case 'POOL': return Waves;
      case 'TRANSPORT': return Car;
      case 'PARKING': return Car;
      case 'AMENITY': return Wifi;
      case 'DINING': return UtensilsCrossed;
      default: return Package;
    }
  };
  
  const Icon = getIcon(service.type);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{service.name}</h3>
            {service.nameRw && (
              <p className="text-xs text-slate-500">{service.nameRw}</p>
            )}
          </div>
        </div>
        {service.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{service.description}</p>
        )}
        <div className="flex items-center justify-between">
          {service.duration && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {service.duration >= 60 ? `${Math.floor(service.duration / 60)}h` : `${service.duration}min`}
            </span>
          )}
          {service.price !== undefined && (
            <span className="font-bold text-emerald-600">
              {service.price === 0 ? 'Free' : `$${service.price.toLocaleString()}`}
            </span>
          )}
        </div>
        <Link href={service.type === 'SPA' ? '/spa' : service.type === 'FITNESS' ? '/spa' : '/contact'}>
          <Button variant="outline" className="w-full mt-3">
            Book Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-16">
      <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Results Found</h3>
      <p className="text-slate-600 mb-6">Try different keywords or browse our featured offerings</p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={onClear}>
          Clear Search
        </Button>
        <Link href="/rooms">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Browse Rooms
          </Button>
        </Link>
      </div>
    </div>
  );
}
