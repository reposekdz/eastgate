"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Clock,
  Users,
  DollarSign,
  Plus,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

const spaServices = [
  { id: 1, name: "Signature African Stone Massage", duration: "90 min", price: 120, category: "Massage", available: true },
  { id: 2, name: "Rwandan Coffee Body Scrub", duration: "60 min", price: 85, category: "Body Treatment", available: true },
  { id: 3, name: "Volcanic Clay Detox Wrap", duration: "75 min", price: 95, category: "Body Treatment", available: true },
  { id: 4, name: "Deep Tissue Massage", duration: "60 min", price: 100, category: "Massage", available: true },
  { id: 5, name: "Couples Harmony Package", duration: "120 min", price: 280, category: "Package", available: true },
  { id: 6, name: "Meditation & Yoga Session", duration: "45 min", price: 50, category: "Wellness", available: false },
  { id: 7, name: "Facial Rejuvenation", duration: "50 min", price: 75, category: "Facial", available: true },
  { id: 8, name: "Manicure & Pedicure", duration: "60 min", price: 55, category: "Beauty", available: true },
];

const todayAppointments = [
  { time: "09:00 AM", guest: "Sarah Mitchell", service: "Signature African Stone Massage", therapist: "Sandrine I." },
  { time: "10:30 AM", guest: "Victoria Laurent", service: "Couples Harmony Package", therapist: "Team" },
  { time: "02:00 PM", guest: "Ingrid Johansson", service: "Rwandan Coffee Body Scrub", therapist: "Claudine M." },
  { time: "03:30 PM", guest: "Walk-in", service: "Deep Tissue Massage", therapist: "Sandrine I." },
];

export default function SpaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Spa & Wellness</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage spa services, appointments, and therapist schedules
          </p>
        </div>
        <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm">
          <Plus className="h-4 w-4" /> Book Appointment
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <Calendar className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{todayAppointments.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Today&apos;s Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-status-reserved/10 shrink-0">
              <Sparkles className="h-4 w-4 text-status-reserved" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{spaServices.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Services</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-status-occupied/10 shrink-0">
              <Users className="h-4 w-4 text-status-occupied" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">3</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Therapists</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-gold/10 shrink-0">
              <DollarSign className="h-4 w-4 text-gold-dark" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{formatCurrency(2850)}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Week Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Today&apos;s Schedule</h2>
          <div className="space-y-2">
            {todayAppointments.map((appt, i) => (
              <Card key={i} className="py-0 shadow-xs border-transparent">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald">{appt.time}</span>
                    <span className="text-[10px] text-text-muted-custom">{appt.therapist}</span>
                  </div>
                  <p className="text-sm font-medium text-charcoal">{appt.guest}</p>
                  <p className="text-xs text-text-muted-custom">{appt.service}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">Services Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spaServices.map((service) => (
              <Card key={service.id} className="py-0 shadow-xs border-transparent hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal">{service.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] rounded-[3px]">{service.category}</Badge>
                        <span className="text-xs text-text-muted-custom flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {service.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-emerald">{formatCurrency(service.price)}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] rounded-[3px] ${
                        service.available
                          ? "bg-status-available/10 text-status-available border-status-available/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}
                    >
                      {service.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
