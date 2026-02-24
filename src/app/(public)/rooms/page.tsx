"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { images } from "@/lib/data";
import { useI18n } from "@/lib/i18n/context";
import { useRooms, Room } from "@/hooks/use-rooms";
import { Wifi, Tv, Wine, ConciergeBell, ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";

const amenityIcons: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi,
  "TV": Tv,
  "Mini Bar": Wine,
  "Room Service": ConciergeBell,
};

export default function RoomsPage() {
  const { t } = useI18n();
  const { rooms, loading, error } = useRooms();
  
  // Map API room types to display data
  const getRoomDisplayData = (room: Room) => {
    const typeMap: Record<string, { nameEn: string; amenities: string[]; maxGuests: number }> = {
      standard: { nameEn: "Standard Room", amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service"], maxGuests: 2 },
      deluxe: { nameEn: "Deluxe Room", amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Room Service", "Balcony"], maxGuests: 2 },
      family: { nameEn: "Family Suite", amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Room Service", "Kitchenette", "Extra Bed"], maxGuests: 4 },
      executive_suite: { nameEn: "Executive Suite", amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Butler Service", "Work Desk", "Lounge Area"], maxGuests: 2 },
      presidential_suite: { nameEn: "Presidential Suite", amenities: ["Wi-Fi", "Smart TV", "Private Bar", "Butler Service", "Private Dining", "Jacuzzi", "Panoramic View"], maxGuests: 4 },
    };
    return typeMap[room.type] || { nameEn: room.type, amenities: ["Wi-Fi", "TV"], maxGuests: 2 };
  };

  // If no rooms from API, use fallback data
  const displayRooms = rooms.length > 0 ? rooms : [
    {
      id: "1",
      number: "101",
      type: "standard",
      price: 89,
      description: "Comfortable room with modern amenities",
    },
    {
      id: "2",
      number: "201",
      type: "deluxe",
      price: 129,
      description: "Spacious room with balcony and premium features",
    },
    {
      id: "3",
      number: "301",
      type: "family",
      price: 199,
      description: "Large suite perfect for families",
    },
    {
      id: "4",
      number: "401",
      type: "executive_suite",
      price: 299,
      description: "Luxury suite with business amenities",
    },
    {
      id: "5",
      number: "501",
      type: "presidential_suite",
      price: 599,
      description: "Ultimate luxury presidential experience",
    },
  ];

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.hero})` }}
        >
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-lg text-white mb-4"
          >
            {t("rooms", "title") || "Our Rooms"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="body-lg text-white/80 max-w-2xl"
          >
            {t("rooms", "description") || "Experience luxury accommodation at EastGate Hotel"}
          </motion.p>
        </div>
      </section>

      {/* Room Listings */}
      <section className="py-16 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <FadeInUp>
            <div className="text-center mb-12">
              <h2 className="heading-md text-charcoal mb-4">
                {t("rooms", "title") || "Rooms & Suites"}
              </h2>
              <p className="text-text-muted-custom max-w-2xl mx-auto">
                {t("rooms", "description") || "Discover our selection of luxurious rooms and suites"}
              </p>
            </div>
          </FadeInUp>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-emerald" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive">Failed to load rooms. Please try again.</p>
            </div>
          ) : (
            <StaggerContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayRooms.map((room: any) => {
                  const displayData = room.id && room.type ? getRoomDisplayData(room) : { 
                    nameEn: room.type || "Room", 
                    amenities: ["Wi-Fi", "TV"], 
                    maxGuests: 2 
                  };
                  
                  return (
                    <StaggerItem key={room.id || room.number}>
                      <motion.div
                        whileHover={{ y: -8 }}
                        className="group bg-white rounded-2xl shadow-lg overflow-hidden h-full"
                      >
                        {/* Image */}
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={room.imageUrl || images.hero}
                            alt={displayData.nameEn}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-emerald text-white">
                              {t("common", "available") || "Available"}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-heading text-xl font-semibold text-charcoal">
                                {displayData.nameEn}
                              </h3>
                              <p className="text-sm text-text-muted-custom">
                                Room {room.number}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-heading text-2xl font-bold text-emerald">
                                ${room.price}
                              </p>
                              <p className="text-xs text-text-muted-custom">
                                {t("common", "perNight") || "/night"}
                              </p>
                            </div>
                          </div>

                          <p className="text-text-muted-custom text-sm mb-4 line-clamp-2">
                            {room.description || t("roomTypes", room.type as any) || getRoomDisplayData(room).nameEn}
                          </p>

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

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <p className="text-sm text-text-muted-custom">
                              {displayData.maxGuests} {t("common", "guests") || "Guests"}
                            </p>
                            <Link href={`/book?room=${room.id || room.type}`}>
                              <Button className="bg-emerald hover:bg-emerald/90 gap-2">
                                {t("rooms", "bookNow") || "Book Now"}
                                <ArrowRight size={16} />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  );
                })}
              </div>
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-charcoal">
        <div className="container mx-auto px-4 text-center">
          <FadeInUp>
            <h2 className="heading-md text-white mb-4">
              {t("rooms", "ctaTitle") || "Special Offers"}
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              {t("rooms", "ctaDescription") || "Get exclusive deals on room bookings"}
            </p>
            <Link href="/contact">
              <Button className="bg-gold hover:bg-gold/90 text-charcoal font-semibold gap-2">
                {t("rooms", "ctaButton") || "Contact Us"}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </FadeInUp>
        </div>
      </section>
    </>
  );
}
