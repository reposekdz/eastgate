"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import {
  Wifi,
  Tv,
  Wine,
  ConciergeBell,
  ArrowRight,
  Check,
  Loader2,
  Users,
  Maximize,
  MapPin,
  Bed,
} from "lucide-react";
import Link from "next/link";

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

const amenityIcons: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi,
  TV: Tv,
  "Mini Bar": Wine,
  "Room Service": ConciergeBell,
};

export default function RoomShowcase() {
  const { t, locale } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try primary endpoint first
      let response = await fetch("/api/public/rooms?status=available&limit=6&sortBy=price&sortOrder=asc");
      
      // Fallback to secondary endpoint if primary fails
      if (!response.ok) {
        response = await fetch("/api/rooms?status=available&limit=6");
      }
      
      const data = await response.json();

      if (data.success) {
        // Handle both response structures
        const roomsData = data.data?.rooms || data.rooms || [];
        setRooms(roomsData);
        
        if (roomsData.length === 0) {
          setError("No rooms available at the moment");
        }
      } else {
        setError(data.error || "Failed to load rooms");
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getRoomDisplayData = (room: Room) => {
    const typeMap: Record<
      string,
      { amenities: string[]; maxGuests: number }
    > = {
      standard: {
        amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service"],
        maxGuests: 2,
      },
      deluxe: {
        amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Room Service", "Balcony"],
        maxGuests: 2,
      },
      family: {
        amenities: [
          "Wi-Fi",
          "Smart TV",
          "Mini Bar",
          "Room Service",
          "Kitchenette",
          "Extra Bed",
        ],
        maxGuests: 4,
      },
      executive_suite: {
        amenities: [
          "Wi-Fi",
          "Smart TV",
          "Mini Bar",
          "Butler Service",
          "Work Desk",
          "Lounge Area",
        ],
        maxGuests: 2,
      },
      presidential_suite: {
        amenities: [
          "Wi-Fi",
          "Smart TV",
          "Private Bar",
          "Butler Service",
          "Private Dining",
          "Jacuzzi",
          "Panoramic View",
        ],
        maxGuests: 4,
      },
    };
    return (
      typeMap[room.type] || { amenities: ["Wi-Fi", "TV"], maxGuests: 2 }
    );
  };

  const getRoomTypeName = (type: string) => {
    const typeKey = type as keyof typeof t.roomTypes;
    return t("roomTypes", typeKey) || type;
  };

  const getRoomDescription = (room: Room) => {
    if (room.description) return room.description;
    const descKey = room.type as keyof typeof t.roomDesc;
    return t("roomDesc", descKey) || "";
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-emerald" />
          </div>
        </div>
      </section>
    );
  }

  if (error || rooms.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald/10 rounded-full mb-4">
                <Bed className="h-8 w-8 text-emerald" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-2">
                {error || t("common", "noResults")}
              </h3>
              <p className="text-text-muted-custom mb-6">
                {loading ? "Loading rooms..." : "Check out our booking page for all available rooms"}
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link href="/book">
                <Button className="bg-emerald hover:bg-emerald/90">
                  {t("nav", "bookRoom")}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={fetchRooms}
                className="border-emerald text-emerald hover:bg-emerald/10"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-emerald font-semibold mb-2 uppercase tracking-wider text-sm">
            {t("rooms", "sectionLabel")}
          </p>
          <h2 className="heading-md text-charcoal mb-4">
            {t("rooms", "title")}
          </h2>
          <p className="text-text-muted-custom max-w-2xl mx-auto">
            {t("rooms", "description")}
          </p>
        </motion.div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {rooms.map((room, index) => {
            const displayData = getRoomDisplayData(room);

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={
                      room.imageUrl ||
                      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800"
                    }
                    alt={getRoomTypeName(room.type)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <Badge className="bg-emerald text-white shadow-lg">
                      {t("common", "available")}
                    </Badge>
                    {room.branch && (
                      <Badge
                        variant="secondary"
                        className="bg-white/90 text-charcoal shadow-lg"
                      >
                        <MapPin size={12} className="mr-1" />
                        {room.branch.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-semibold text-charcoal mb-1">
                        {getRoomTypeName(room.type)}
                      </h3>
                      <p className="text-sm text-text-muted-custom">
                        {t("common", "room")} {room.number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-2xl font-bold text-emerald">
                        RWF {room.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted-custom">
                        {t("common", "perNight")}
                      </p>
                    </div>
                  </div>

                  <p className="text-text-muted-custom text-sm mb-4 line-clamp-2 flex-1">
                    {getRoomDescription(room)}
                  </p>

                  {/* Room Info */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-text-muted-custom">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>
                        {room.maxOccupancy || displayData.maxGuests}{" "}
                        {t("common", "guests")}
                      </span>
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
                        <div
                          key={amenity}
                          className="flex items-center gap-1 px-2 py-1 bg-background rounded-md text-xs text-text-muted-custom"
                        >
                          <Icon size={12} />
                          {amenity}
                        </div>
                      );
                    })}
                  </div>

                  {/* Branch Location */}
                  {room.branch?.location && (
                    <p className="text-xs text-text-muted-custom mb-4 flex items-center gap-1">
                      <MapPin size={12} />
                      {room.branch.location}
                    </p>
                  )}

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-100 mt-auto">
                    <Link
                      href={`/book?room=${room.id}&branch=${room.branch?.id || ''}`}
                      className="w-full"
                    >
                      <Button className="w-full bg-emerald hover:bg-emerald/90 gap-2">
                        {t("rooms", "bookNow")}
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/book">
            <Button
              size="lg"
              className="bg-charcoal hover:bg-charcoal/90 text-white gap-2 px-8"
            >
              {t("homepage", "viewAllRooms")}
              <ArrowRight size={18} />
            </Button>
          </Link>
          <p className="text-sm text-text-muted-custom mt-4">
            {t("rooms", "ctaDescription")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
