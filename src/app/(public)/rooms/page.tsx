"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { images } from "@/lib/data";
import { Wifi, Tv, Wine, ConciergeBell, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const amenityIcons: Record<string, React.ElementType> = {
  "Wi-Fi": Wifi,
  "TV": Tv,
  "Mini Bar": Wine,
  "Room Service": ConciergeBell,
};

export default function RoomsPage() {
  const { t } = useI18n();
  
  // Room data with translations
  const roomsData = [
    {
      id: 1,
      type: "standard",
      image: images.hero,
      alt: "Standard Room",
      price: "$89",
      nameEn: "Standard Room",
      name: t("roomTypes", "standard"),
      description: t("roomDesc", "standard"),
      amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service"],
      maxGuests: 2,
    },
    {
      id: 2,
      type: "deluxe",
      image: images.hero,
      alt: "Deluxe Room",
      price: "$129",
      nameEn: "Deluxe Room",
      name: t("roomTypes", "deluxe"),
      description: t("roomDesc", "deluxe"),
      amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Room Service", "Balcony"],
      maxGuests: 2,
    },
    {
      id: 3,
      type: "family",
      image: images.hero,
      alt: "Family Suite",
      price: "$199",
      nameEn: "Family Suite",
      name: t("roomTypes", "family"),
      description: t("roomDesc", "family"),
      amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Room Service", "Kitchenette", "Extra Bed"],
      maxGuests: 4,
    },
    {
      id: 4,
      type: "executive_suite",
      image: images.hero,
      alt: "Executive Suite",
      price: "$299",
      nameEn: "Executive Suite",
      name: t("roomTypes", "executive_suite"),
      description: t("roomDesc", "executive_suite"),
      amenities: ["Wi-Fi", "Smart TV", "Mini Bar", "Butler Service", "Work Desk", "Lounge Area"],
      maxGuests: 2,
    },
    {
      id: 5,
      type: "presidential_suite",
      image: images.hero,
      alt: "Presidential Suite",
      price: "$599",
      nameEn: "Presidential Suite",
      name: t("roomTypes", "presidential_suite"),
      description: t("roomDesc", "presidential_suite"),
      amenities: ["Wi-Fi", "Smart TV", "Private Bar", "Butler Service", "Private Dining", "Jacuzzi", "Panoramic View"],
      maxGuests: 4,
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
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="body-sm uppercase tracking-[0.25em] text-gold-light mb-3 font-medium"
          >
            {t("rooms", "sectionLabel")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {t("rooms", "title")}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-[2px] w-16 bg-gold mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="body-md sm:body-lg text-white/70 max-w-2xl"
          >
            {t("rooms", "description")}
          </motion.p>
        </div>
      </section>

      {/* Room Cards */}
      <section className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl">
          <StaggerContainer className="space-y-12 sm:space-y-16">
            {roomsData.map((room, idx) => (
              <StaggerItem key={room.id}>
                <div
                  className={`grid gap-8 lg:grid-cols-2 items-center ${
                    idx % 2 === 1 ? "lg:direction-rtl" : ""
                  }`}
                >
                  {/* Image */}
                  <div className={`relative overflow-hidden rounded-[4px] ${idx % 2 === 1 ? "lg:order-2" : ""}`}>
                    <img
                      src={room.image}
                      alt={room.nameEn}
                      className="w-full h-64 sm:h-80 lg:h-[450px] object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-emerald text-white px-3 py-1 text-sm rounded-[2px]">
                        {room.price} <span className="text-xs ml-1">{t("rooms", "perNight")}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${idx % 2 === 1 ? "lg:order-1" : ""} px-2 sm:px-0`}>
                    <p className="body-sm uppercase tracking-[0.2em] text-gold-dark mb-2 font-medium">
                      {t("rooms", "guests")}: {room.maxGuests}
                    </p>
                    <h2 className="heading-md sm:heading-lg text-charcoal mb-4 font-heading">
                      {room.name}
                    </h2>
                    <div className="h-[2px] w-12 bg-gold mb-6" />
                    <p className="body-md sm:body-lg text-text-muted-custom mb-8">
                      {room.description}
                    </p>

                    {/* Amenities */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {room.amenities.map((amenity) => {
                        const Icon = amenityIcons[amenity] || Check;
                        return (
                          <div key={amenity} className="flex items-center gap-2">
                            <Check size={16} className="text-emerald shrink-0" />
                            <span className="body-sm text-slate-custom">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      asChild
                      className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
                    >
                      <Link href="/book" className="flex items-center gap-2">
                        {t("rooms", "bookNow")}
                        <ArrowRight size={16} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal py-16 sm:py-20 px-4 sm:px-6">
        <FadeInUp>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:heading-md text-white mb-4 font-heading font-bold">
              {t("rooms", "ctaTitle")}
            </h2>
            <p className="body-md text-white/60 mb-8">
              {t("rooms", "ctaDescription")}
            </p>
            <Button
              asChild
              variant="outline"
              className="border-gold text-gold hover:bg-gold hover:text-charcoal rounded-[2px] uppercase tracking-wider text-sm px-8 py-5"
            >
              <Link href="/contact">{t("rooms", "ctaButton")}</Link>
            </Button>
          </div>
        </FadeInUp>
      </section>
    </>
  );
}
