"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { events } from "@/lib/mock-data";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { HotelEvent } from "@/lib/types/schema";
import type { EventType } from "@/lib/types/enums";
import {
  CalendarDays,
  Plus,
  Users,
  Clock,
  DollarSign,
  Building2,
} from "lucide-react";

const eventTypeConfig: Record<EventType, { color: string; bg: string }> = {
  wedding: { color: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
  corporate: { color: "text-status-occupied", bg: "bg-status-occupied/10 border-status-occupied/20" },
  conference: { color: "text-emerald", bg: "bg-emerald/10 border-emerald/20" },
  private_dining: { color: "text-gold-dark", bg: "bg-gold/10 border-gold/20" },
  gala: { color: "text-status-reserved", bg: "bg-status-reserved/10 border-status-reserved/20" },
};

const eventStatusConfig: Record<string, { color: string; bg: string }> = {
  upcoming: { color: "text-status-occupied", bg: "bg-status-occupied/10 border-status-occupied/20" },
  ongoing: { color: "text-emerald", bg: "bg-emerald/10 border-emerald/20" },
  completed: { color: "text-slate-custom", bg: "bg-slate-100 border-slate-200" },
  cancelled: { color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

const typeLabels: Record<EventType, string> = {
  wedding: "Wedding",
  corporate: "Corporate",
  conference: "Conference",
  private_dining: "Private Dining",
  gala: "Gala",
};

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<HotelEvent | null>(null);

  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const totalRevenue = events.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Events & Conferences</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage event bookings, halls, and catering
          </p>
        </div>
        <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm">
          <Plus className="h-4 w-4" /> Create Event
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <CalendarDays className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{events.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-status-occupied/10 shrink-0">
              <Clock className="h-4 w-4 text-status-occupied" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{upcomingCount}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-gold/10 shrink-0">
              <DollarSign className="h-4 w-4 text-gold-dark" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => {
          const typeConfig = eventTypeConfig[event.type];
          const statConfig = eventStatusConfig[event.status];
          return (
            <Card
              key={event.id}
              className="py-0 shadow-xs border-transparent hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-charcoal">{event.name}</h3>
                    <p className="text-xs text-text-muted-custom mt-0.5">{event.organizer}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wider rounded-[4px] ${statConfig.bg} ${statConfig.color}`}>
                    {event.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-custom">
                    <CalendarDays className="h-3 w-3 text-text-muted-custom" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-custom">
                    <Clock className="h-3 w-3 text-text-muted-custom" />
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-custom">
                    <Building2 className="h-3 w-3 text-text-muted-custom" />
                    {event.hall}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-custom">
                    <Users className="h-3 w-3 text-text-muted-custom" />
                    {event.attendees}/{event.capacity}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <Badge variant="outline" className={`text-[10px] rounded-[4px] ${typeConfig.bg} ${typeConfig.color} font-semibold`}>
                    {typeLabels[event.type]}
                  </Badge>
                  <span className="text-sm font-bold text-charcoal">{formatCurrency(event.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              {selectedEvent && `Organized by ${selectedEvent.organizer}`}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Date</p>
                  <p className="text-sm font-semibold text-charcoal">{formatDate(selectedEvent.date)}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Time</p>
                  <p className="text-sm font-semibold text-charcoal">{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Venue</p>
                  <p className="text-sm font-semibold text-charcoal">{selectedEvent.hall}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Attendees</p>
                  <p className="text-sm font-semibold text-charcoal">{selectedEvent.attendees} / {selectedEvent.capacity}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Type</p>
                  <p className="text-sm font-semibold text-charcoal capitalize">{typeLabels[selectedEvent.type]}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Revenue</p>
                  <p className="text-sm font-bold text-emerald">{formatCurrency(selectedEvent.totalAmount)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-[6px] text-sm">Edit Event</Button>
                <Button className="flex-1 bg-emerald hover:bg-emerald-dark text-white rounded-[6px] text-sm">Generate Contract</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
