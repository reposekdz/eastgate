"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  UserPlus,
  ConciergeBell,
  FileBarChart,
  BedDouble,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";

const actions = [
  { label: "New Booking", icon: CalendarPlus, href: "/admin/bookings", color: "text-emerald", bg: "bg-emerald/10 hover:bg-emerald/15" },
  { label: "Check-in Guest", icon: UserPlus, href: "/admin/bookings", color: "text-status-occupied", bg: "bg-status-occupied/10 hover:bg-status-occupied/15" },
  { label: "Room Service", icon: ConciergeBell, href: "/admin/rooms", color: "text-gold-dark", bg: "bg-gold/10 hover:bg-gold/15" },
  { label: "View Reports", icon: FileBarChart, href: "/admin/finance", color: "text-status-reserved", bg: "bg-status-reserved/10 hover:bg-status-reserved/15" },
  { label: "Manage Rooms", icon: BedDouble, href: "/admin/rooms", color: "text-emerald-light", bg: "bg-emerald-light/10 hover:bg-emerald-light/15" },
  { label: "Restaurant", icon: UtensilsCrossed, href: "/admin/restaurant", color: "text-status-cleaning", bg: "bg-status-cleaning/10 hover:bg-status-cleaning/15" },
];

export default function QuickActions() {
  return (
    <Card className="py-4 shadow-xs border-transparent">
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-sm font-semibold text-charcoal">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`h-auto flex-col gap-1.5 py-3 rounded-[8px] ${action.bg} transition-all`}
              asChild
            >
              <Link href={action.href}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-[11px] font-medium text-charcoal">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
