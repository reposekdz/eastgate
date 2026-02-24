"use client";

import { useI18n } from "@/lib/i18n/context";
import HeroSection from "@/components/sections/HeroSection";
import RoomShowcase from "@/components/sections/RoomShowcase";
import GuestRatingSystem from "@/components/sections/GuestRatingSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bed, UtensilsCrossed, Sparkles, CalendarDays, Wifi, Car, Coffee, Dumbbell,
  Shield, Clock, MapPin, Phone, Mail, Star, Users, Award, TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { t } = useI18n();

  const features = [
    { icon: Bed, title: t("homepage", "rooms") || "Luxury Rooms", desc: "120+ premium rooms", link: "/rooms" },
    { icon: UtensilsCrossed, title: t("homepage", "dining") || "Fine Dining", desc: "World-class cuisine", link: "/dining" },
    { icon: Sparkles, title: t("homepage", "spa") || "Spa & Wellness", desc: "Relaxation services", link: "/spa" },
    { icon: CalendarDays, title: t("homepage", "events") || "Event Spaces", desc: "Conference halls", link: "/events" },
    { icon: Wifi, title: "Free WiFi", desc: "High-speed internet", link: "#" },
    { icon: Car, title: "Free Parking", desc: "Secure parking", link: "#" },
    { icon: Coffee, title: "24/7 Service", desc: "Always available", link: "#" },
    { icon: Dumbbell, title: "Fitness Center", desc: "Modern equipment", link: "#" },
  ];

  const stats = [
    { icon: Users, value: "2,847+", label: "Happy Guests" },
    { icon: Award, value: "4.9/5", label: "Guest Rating" },
    { icon: Bed, value: "340+", label: "Luxury Rooms" },
    { icon: TrendingUp, value: "98%", label: "Satisfaction" },
  ];

  const branches = [
    { name: "Kigali Main", location: "KG 7 Ave, Kigali", rooms: 120, phone: "+250 788 123 456" },
    { name: "Ngoma Branch", location: "Ngoma District", rooms: 80, phone: "+250 788 123 457" },
    { name: "Kirehe Branch", location: "Kirehe District", rooms: 65, phone: "+250 788 123 458" },
    { name: "Gatsibo Branch", location: "Gatsibo District", rooms: 75, phone: "+250 788 123 459" },
  ];

  return (
    <>
      <HeroSection />

      {/* Stats Section */}
      <section className="py-12 bg-charcoal">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald/20 rounded-full mb-3">
                  <stat.icon className="h-6 w-6 text-emerald" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-widest text-sm mb-2">Our Amenities</p>
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal">
              Experience <span className="text-emerald italic">Excellence</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Link key={i} href={feature.link}>
                <Card className="hover:shadow-lg hover:border-emerald/30 transition-all cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-emerald" />
                    </div>
                    <h3 className="font-semibold text-charcoal mb-1">{feature.title}</h3>
                    <p className="text-sm text-text-muted-custom">{feature.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <RoomShowcase />

      {/* Branches Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-widest text-sm mb-2">Our Locations</p>
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal">
              4 Branches Across <span className="text-emerald italic">Eastern Rwanda</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {branches.map((branch, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-charcoal mb-1">{branch.name}</h3>
                      <Badge className="bg-emerald text-white">{branch.rooms} Rooms</Badge>
                    </div>
                    <MapPin className="h-5 w-5 text-emerald" />
                  </div>
                  <div className="space-y-2 text-sm text-text-muted-custom">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{branch.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button className="w-full mt-4 bg-emerald hover:bg-emerald-dark text-white">
                      Contact Branch
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guest Rating System */}
      <GuestRatingSystem />

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-widest text-sm mb-2">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal">
              Your Comfort is <span className="text-emerald italic">Our Priority</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald/10 rounded-full mb-4">
                <Shield className="h-8 w-8 text-emerald" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Safe & Secure</h3>
              <p className="text-text-muted-custom">24/7 security, CCTV monitoring, and secure payment systems for your peace of mind.</p>
            </Card>
            <Card className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
                <Clock className="h-8 w-8 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">24/7 Service</h3>
              <p className="text-text-muted-custom">Round-the-clock reception, room service, and concierge at your disposal.</p>
            </Card>
            <Card className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald/10 rounded-full mb-4">
                <Star className="h-8 w-8 text-emerald" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Premium Quality</h3>
              <p className="text-text-muted-custom">Luxury amenities, world-class service, and attention to every detail.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald to-emerald-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready for an Unforgettable Stay?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Book now and experience luxury in the heart of Rwanda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8">
                Book Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
