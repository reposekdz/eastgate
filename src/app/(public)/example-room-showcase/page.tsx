"use client";

/**
 * Example Page: Room Showcase Integration
 * 
 * This page demonstrates how to integrate the RoomShowcase component
 * which displays 6 rooms from the database with a "Load More" button
 * that redirects to the booking page.
 * 
 * Features:
 * - Fetches real data from database API
 * - Shows rooms from different branches
 * - Fully translatable in 10 languages
 * - Modern animations and responsive design
 */

import RoomShowcase from "@/components/sections/RoomShowcase";
import { useI18n } from "@/lib/i18n/context";

export default function ExampleRoomShowcasePage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-charcoal text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            {t("rooms", "title")}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {t("rooms", "description")}
          </p>
        </div>
      </section>

      {/* Room Showcase Component */}
      {/* 
        This component will:
        1. Fetch 6 available rooms from /api/rooms?status=available
        2. Display them with branch information
        3. Show amenities and room details
        4. Provide a "View All Rooms" button that redirects to /book
      */}
      <RoomShowcase />

      {/* Additional Content (Optional) */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold text-charcoal mb-4">
            {t("rooms", "ctaTitle")}
          </h2>
          <p className="text-text-muted-custom max-w-2xl mx-auto mb-8">
            {t("rooms", "ctaDescription")}
          </p>
        </div>
      </section>
    </div>
  );
}
