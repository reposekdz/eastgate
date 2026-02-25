"use client";

import { useEffect, useState } from "react";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  description?: string;
  imageUrl?: string;
  maxOccupancy: number;
  status: string;
  branch: {
    name: string;
    location: string;
  };
}

function RoomCard({ room }: { room: Room }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="group overflow-hidden bg-white rounded-[4px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      <div className="relative h-72 overflow-hidden">
        <img
          src={room.imageUrl || `/images/rooms/${room.type}.jpg`}
          alt={`${room.type} room`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = '/images/rooms/default.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {room.status === 'available' && (
          <div className="absolute top-4 right-4 bg-emerald text-white px-3 py-1 text-xs font-semibold rounded">
            Available
          </div>
        )}
      </div>

      <div className="p-7">
        <h3 className="heading-sm text-charcoal mb-3 capitalize">{room.type} Room</h3>
        <p className="body-md text-text-muted-custom mb-5">
          {room.description || `Luxurious ${room.type} room with modern amenities and stunning views. Perfect for up to ${room.maxOccupancy} guests.`}
        </p>
        <div className="flex items-center justify-between">
          <span className="body-md font-semibold text-emerald">{formatPrice(room.price)}/night</span>
          <Button
            variant="ghost"
            className="text-gold-dark hover:text-gold hover:bg-transparent p-0 uppercase tracking-wide text-xs font-semibold group/btn"
            asChild
          >
            <a href="/book" className="flex items-center gap-1">
              Book Now
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms?status=available&limit=6')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.rooms) {
          setRooms(data.data.rooms);
        }
      })
      .catch((err) => console.error('Failed to fetch rooms:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="rooms" className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl text-center">
          <p className="body-lg text-text-muted-custom">Loading rooms...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="rooms" className="section-padding bg-pearl">
      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center mb-16">
            <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
              Accommodation
            </p>
            <h2 className="heading-lg text-charcoal mb-4">Modern Rooms & Suites</h2>
            <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            <p className="body-lg text-text-muted-custom max-w-2xl mx-auto">
              Each room features cutting-edge technology, premium amenities, and contemporary design
              to provide the ultimate luxury experience.
            </p>
          </div>
        </FadeInUp>

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="body-lg text-text-muted-custom">No rooms available at the moment.</p>
          </div>
        ) : (
          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <StaggerItem key={room.id}>
                <RoomCard room={room} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm"
          >
            <a href="/rooms">View All Rooms</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
