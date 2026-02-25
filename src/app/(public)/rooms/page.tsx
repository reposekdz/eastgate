"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n/context";
import { Wifi, Tv, Wine, ConciergeBell, ArrowRight, Check, Loader2, Users, Maximize, MapPin, Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { images } from "@/lib/data";

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  description?: string;
  imageUrl?: string;
  maxOccupancy?: number;
  size?: number;
  status: string;
  branch: {
    id: string;
    name: string;
    location?: string;
  };
}

export default function RoomsPage() {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    fetchRooms();
  }, [page, selectedType, selectedBranch, priceRange]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: "available",
        page: page.toString(),
        limit: limit.toString(),
        sortBy: "price",
        sortOrder: "asc",
      });

      if (selectedType !== "all") params.append("type", selectedType);
      if (selectedBranch !== "all") params.append("branchId", selectedBranch);
      if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString());
      if (priceRange[1] < 500000) params.append("maxPrice", priceRange[1].toString());
      if (search) params.append("search", search);

      const response = await fetch(`/api/public/rooms?${params}`);
      const data = await response.json();

      if (data.success && data.data?.rooms) {
        setRooms(data.data.rooms);
        setTotal(data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchRooms();
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedBranch("all");
    setPriceRange([0, 500000]);
    setPage(1);
  };

  const getRoomDisplayData = (room: Room) => {
    const typeMap: Record<string, { amenities: string[]; maxGuests: number }> = {
      standard: { amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service"], maxGuests: 2 },
      deluxe: { amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Room Service", "Balcony"], maxGuests: 2 },
      suite: { amenities: ["Wi-Fi", "Smart TV", "Private Bar", "Butler Service", "Jacuzzi"], maxGuests: 4 },
    };
    return typeMap[room.type] || { amenities: ["Wi-Fi", "TV"], maxGuests: 2 };
  };

  const amenityIcons: Record<string, React.ElementType> = {
    "Wi-Fi": Wifi,
    TV: Tv,
    "Mini Bar": Wine,
    "Room Service": ConciergeBell,
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${images.hero})` }}>
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Luxury Rooms
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-white/80 max-w-2xl">
            Discover comfort and elegance across our 4 branches
          </motion.p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search rooms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
              </SelectContent>
            </Select>

            {/* Branch Filter */}
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="br-kigali-main">Kigali Main</SelectItem>
                <SelectItem value="br-ngoma">Ngoma Resort</SelectItem>
                <SelectItem value="br-kirehe">Kirehe Boutique</SelectItem>
                <SelectItem value="br-gatsibo">Gatsibo Summit</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Toggle */}
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full md:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "More"} Filters
            </Button>

            {/* Clear Filters */}
            {(search || selectedType !== "all" || selectedBranch !== "all" || priceRange[0] > 0 || priceRange[1] < 500000) && (
              <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Price Range: RWF {priceRange[0].toLocaleString()} - RWF {priceRange[1].toLocaleString()}
                  </label>
                  <Slider value={priceRange} onValueChange={setPriceRange} max={500000} step={10000} className="w-full" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal">Available Rooms</h2>
              <p className="text-slate-600 mt-1">{total} rooms found</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-emerald" />
            </div>
          )}

          {/* Rooms Grid */}
          {!loading && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room, index) => {
                const displayData = getRoomDisplayData(room);
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={room.imageUrl || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"}
                        alt={room.type}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <Badge className="bg-emerald text-white shadow-lg">Available</Badge>
                        <Badge variant="secondary" className="bg-white/90 text-charcoal shadow-lg">
                          <MapPin size={12} className="mr-1" />
                          {room.branch.name}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-charcoal mb-1 capitalize">{room.type} Room</h3>
                          <p className="text-sm text-slate-600">Room {room.number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald">RWF {room.price.toLocaleString()}</p>
                          <p className="text-xs text-slate-600">per night</p>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">
                        {room.description || `Comfortable ${room.type} room with modern amenities`}
                      </p>

                      {/* Room Info */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{room.maxOccupancy || displayData.maxGuests} guests</span>
                        </div>
                        {room.size && (
                          <div className="flex items-center gap-1">
                            <Maximize size={16} />
                            <span>{room.size}m²</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {displayData.amenities.slice(0, 4).map((amenity) => {
                          const Icon = amenityIcons[amenity] || Check;
                          return (
                            <div key={amenity} className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md text-xs text-slate-600">
                              <Icon size={12} />
                              {amenity}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 border-t border-slate-100 mt-auto">
                        <Link href={`/book?room=${room.id}&branch=${room.branch.id}`} className="w-full">
                          <Button className="w-full bg-emerald hover:bg-emerald/90 gap-2">
                            Book Now
                            <ArrowRight size={16} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && rooms.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">No rooms found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your filters</p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {!loading && rooms.length > 0 && total > limit && (
            <div className="flex justify-center gap-2 mt-12">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-slate-600">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
              </div>
              <Button variant="outline" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
