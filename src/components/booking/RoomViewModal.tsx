"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  MapPin, 
  Users, 
  Maximize, 
  Bed, 
  Wifi, 
  Tv, 
  Coffee, 
  Wind,
  Droplets,
  Phone,
  UtensilsCrossed,
  Sparkles,
  Star,
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  status: string;
  floor: number;
  description?: string;
  imageUrl?: string;
  branchId: string;
  maxOccupancy?: number;
  size?: number;
  bedType?: string;
  view?: string;
  branch?: {
    id: string;
    name: string;
    location?: string;
  };
}

interface RoomViewModalProps {
  room: Room;
  onClose: () => void;
  onSelect: () => void;
}

const amenityIcons: Record<string, any> = {
  "Free Wi-Fi": Wifi,
  "Wi-Fi": Wifi,
  "Smart TV": Tv,
  "TV": Tv,
  "Mini Bar": Coffee,
  "Air Conditioning": Wind,
  "Room Service": UtensilsCrossed,
  "Balcony": Building2,
  "Bathrobes": Sparkles,
  "Jacuzzi": Droplets,
  "Butler Service": Phone,
};

export default function RoomViewModal({ room, onClose, onSelect }: RoomViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [
    room.imageUrl || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1920",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920"
  ];

  const amenities = [
    "Free Wi-Fi",
    "Smart TV", 
    "Air Conditioning",
    "Mini Bar",
    "Room Service",
    "24/7 Concierge",
    "Daily Housekeeping",
    "Premium Toiletries"
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Fixed */}
            <button
              onClick={onClose}
              className="fixed top-6 right-6 z-[110] bg-white hover:bg-slate-100 rounded-full p-4 shadow-2xl transition-all hover:scale-110"
            >
              <X className="w-7 h-7 text-charcoal" />
            </button>

            {/* Hero Image Gallery - Full Width */}
            <div className="relative h-screen bg-black">
              <img
                src={images[currentImageIndex]}
                alt={`Room ${room.number}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-xl transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-charcoal" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-xl transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-charcoal" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? "w-12 bg-white" : "w-2 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {/* Floating Info - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                      <Badge className="bg-emerald-500 text-white mb-4 px-6 py-2 text-base">
                        {room.status}
                      </Badge>
                      <h1 className="text-5xl md:text-7xl font-bold text-white mb-3">
                        Room {room.number}
                      </h1>
                      <p className="text-3xl md:text-4xl text-white/90 capitalize font-light">
                        {room.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 text-right shadow-2xl">
                      <p className="text-sm text-slate-500 mb-2">Starting from</p>
                      <p className="text-5xl font-bold text-emerald-600">
                        RWF {room.price.toLocaleString()}
                      </p>
                      <p className="text-base text-slate-500 mt-2">per night</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white">
              <div className="max-w-7xl mx-auto px-6 md:px-16 py-16">
                <div className="grid lg:grid-cols-3 gap-16">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-12">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                        <Users className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
                        <p className="text-sm text-slate-500 mb-1">Guests</p>
                        <p className="text-2xl font-bold text-charcoal">{room.maxOccupancy || 2}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                        <Maximize className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
                        <p className="text-sm text-slate-500 mb-1">Size</p>
                        <p className="text-2xl font-bold text-charcoal">{room.size || 35}m²</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                        <Bed className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
                        <p className="text-sm text-slate-500 mb-1">Bed</p>
                        <p className="text-2xl font-bold text-charcoal">{room.bedType || "King"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                        <Building2 className="w-8 h-8 mx-auto mb-3 text-emerald-600" />
                        <p className="text-sm text-slate-500 mb-1">Floor</p>
                        <p className="text-2xl font-bold text-charcoal">{room.floor}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h2 className="text-4xl font-bold text-charcoal mb-6">About This Room</h2>
                      <p className="text-slate-600 leading-relaxed text-xl">
                        {room.description || `Experience luxury and comfort in our ${room.type.replace('_', ' ')} room. Featuring modern amenities and elegant design, this room provides the perfect retreat for your stay at EastGate Hotel.`}
                      </p>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h2 className="text-4xl font-bold text-charcoal mb-8">Room Amenities</h2>
                      <div className="grid md:grid-cols-2 gap-5">
                        {amenities.map((amenity) => {
                          const Icon = amenityIcons[amenity] || CheckCircle2;
                          return (
                            <div
                              key={amenity}
                              className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all hover:scale-105"
                            >
                              <div className="bg-emerald-100 p-3 rounded-xl">
                                <Icon className="w-6 h-6 text-emerald-600" />
                              </div>
                              <span className="text-slate-700 font-semibold text-lg">{amenity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Location */}
                    {room.branch && (
                      <div className="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-3xl p-8">
                        <div className="flex items-start gap-6">
                          <div className="bg-emerald-100 p-4 rounded-2xl">
                            <MapPin className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-charcoal mb-2">
                              {room.branch.name}
                            </h3>
                            <p className="text-slate-600 text-lg">{room.branch.location}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar - Booking Card */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-8 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-3xl p-8 shadow-2xl">
                      <h3 className="text-2xl font-bold text-charcoal mb-8">Book This Room</h3>
                      
                      <div className="space-y-5 mb-8">
                        <div className="flex items-center gap-4 text-slate-600">
                          <Calendar className="w-6 h-6 text-emerald-600" />
                          <span className="text-base">Flexible check-in/out</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                          <Clock className="w-6 h-6 text-emerald-600" />
                          <span className="text-base">Instant confirmation</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-600">
                          <Star className="w-6 h-6 text-emerald-600" />
                          <span className="text-base">Best price guarantee</span>
                        </div>
                      </div>

                      <Separator className="my-8" />

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-base">
                          <span className="text-slate-500">Room rate</span>
                          <span className="font-semibold">RWF {room.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-slate-500">Service charge</span>
                          <span className="font-semibold">Included</span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-slate-500">Taxes</span>
                          <span className="font-semibold">Included</span>
                        </div>
                      </div>

                      <Button
                        onClick={onSelect}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-7 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                      >
                        Select & Continue
                      </Button>

                      <p className="text-sm text-center text-slate-500 mt-6">
                        Free cancellation up to 24 hours before check-in
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
