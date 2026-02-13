"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LogIn, LogOut, CalendarPlus, Clock } from "lucide-react";

const summaryItems = [
  { label: "Check-ins Today", value: 4, icon: LogIn, color: "text-emerald", bg: "bg-emerald/10" },
  { label: "Check-outs Today", value: 2, icon: LogOut, color: "text-status-cleaning", bg: "bg-status-cleaning/10" },
  { label: "New Bookings", value: 6, icon: CalendarPlus, color: "text-status-occupied", bg: "bg-status-occupied/10" },
  { label: "Pending Approval", value: 3, icon: Clock, color: "text-status-reserved", bg: "bg-status-reserved/10" },
];

export default function TodaySummary() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {summaryItems.map((item) => (
        <Card key={item.label} className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${item.bg} shrink-0`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal leading-tight">{item.value}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
