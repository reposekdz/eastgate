"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LogIn, LogOut, UtensilsCrossed, Calendar, Loader2 } from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

export default function TodaySummary() {
  const { data, loading } = useAdminDashboard();

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="py-3 shadow-xs border-transparent">
            <CardContent className="px-4 flex items-center justify-center h-16">
              <Loader2 className="h-5 w-5 animate-spin text-emerald" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const summaryItems = [
    { label: "Check-ins Today", value: data.todaySummary.checkInsToday, icon: LogIn, color: "text-emerald", bg: "bg-emerald/10" },
    { label: "Check-outs Today", value: data.todaySummary.checkOutsToday, icon: LogOut, color: "text-status-cleaning", bg: "bg-status-cleaning/10" },
    { label: "Active Orders", value: data.todaySummary.activeOrders, icon: UtensilsCrossed, color: "text-status-occupied", bg: "bg-status-occupied/10" },
    { label: "Upcoming Events", value: data.todaySummary.upcomingEvents, icon: Calendar, color: "text-status-reserved", bg: "bg-status-reserved/10" },
  ];
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
