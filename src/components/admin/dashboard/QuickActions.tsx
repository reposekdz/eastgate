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
  CreditCard,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const actionConfig = [
  { labelKey: "newBooking" as const, icon: CalendarPlus, href: "/admin/bookings", color: "text-emerald", bg: "bg-emerald/10 hover:bg-emerald/15" },
  { labelKey: "checkInGuest" as const, icon: UserPlus, href: "/admin/bookings", color: "text-status-occupied", bg: "bg-status-occupied/10 hover:bg-status-occupied/15" },
  { labelKey: "roomService" as const, icon: ConciergeBell, href: "/admin/rooms", color: "text-gold-dark", bg: "bg-gold/10 hover:bg-gold/15" },
  { labelKey: "viewReports" as const, icon: FileBarChart, href: "/admin/finance", color: "text-status-reserved", bg: "bg-status-reserved/10 hover:bg-status-reserved/15" },
  { labelKey: "manageRooms" as const, icon: BedDouble, href: "/admin/rooms", color: "text-emerald-light", bg: "bg-emerald-light/10 hover:bg-emerald-light/15" },
  { labelKey: "restaurant" as const, icon: UtensilsCrossed, href: "/admin/restaurant", color: "text-status-cleaning", bg: "bg-status-cleaning/10 hover:bg-status-cleaning/15" },
  { labelKey: "viewPayments" as const, icon: CreditCard, href: "/admin/payments", color: "text-blue-600", bg: "bg-blue-500/10 hover:bg-blue-500/15" },
  { labelKey: "guestMessages" as const, icon: MessageCircle, href: "/admin/messages", color: "text-purple", bg: "bg-purple/10 hover:bg-purple/15" },
];

export default function QuickActions() {
  const { t } = useI18n();
  return (
    <Card className="py-4 shadow-xs border-transparent">
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-sm font-semibold text-charcoal">{t("dashboard", "quickActions")}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {actionConfig.map((action) => (
            <Button
              key={action.labelKey}
              variant="ghost"
              className={`h-auto flex-col gap-1.5 py-3 rounded-[8px] ${action.bg} transition-all`}
              asChild
            >
              <Link href={action.href}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-[11px] font-medium text-charcoal">{t("dashboard", action.labelKey)}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
