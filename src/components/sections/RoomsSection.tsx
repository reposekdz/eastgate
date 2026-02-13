"use client";

import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { rooms } from "@/lib/data";
import { ArrowRight } from "lucide-react";

function RoomCard({
  room,
}: {
  room: (typeof rooms)[number];
}) {
  return (
    <div className="group overflow-hidden bg-white rounded-[4px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={room.image}
          alt={room.alt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-7">
        <h3 className="heading-sm text-charcoal mb-3">{room.name}</h3>
        <p className="body-md text-text-muted-custom mb-5">{room.description}</p>
        <div className="flex items-center justify-between">
          <span className="body-md font-semibold text-emerald">{room.price}</span>
          <Button
            variant="ghost"
            className="text-gold-dark hover:text-gold hover:bg-transparent p-0 uppercase tracking-wide text-xs font-semibold group/btn"
            asChild
          >
            <a href="#" className="flex items-center gap-1">
              View Details
              <ArrowRight
                size={14}
                className="transition-transform group-hover/btn:translate-x-1"
              />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RoomsSection() {
  return (
    <section id="rooms" className="section-padding bg-pearl">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <FadeInUp>
          <div className="text-center mb-16">
            <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
              Accommodation
            </p>
            <h2 className="heading-lg text-charcoal mb-4">Rooms & Suites</h2>
            <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            <p className="body-lg text-text-muted-custom max-w-2xl mx-auto">
              Each room is a masterpiece of comfort and elegance, designed to
              provide the ultimate retreat after a day of exploration.
            </p>
          </div>
        </FadeInUp>

        {/* Room Cards */}
        <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <StaggerItem key={room.id}>
              <RoomCard room={room} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
