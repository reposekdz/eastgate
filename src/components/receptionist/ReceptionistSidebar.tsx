"use client";

import DashboardSidebar from "@/components/shared/DashboardSidebar";
import type { NavGroup } from "@/components/shared/DashboardSidebar";
import {
  LayoutDashboard,
  UserPlus,
  CalendarCheck,
  BedDouble,
  Users,
  Bell,
  ClipboardList,
  Building2,
} from "lucide-react";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/receptionist", icon: LayoutDashboard },
    ],
  },
  {
    label: "Front Desk",
    items: [
      { title: "Guest Registry", href: "/receptionist/guests", icon: UserPlus },
      { title: "Bookings", href: "/receptionist/bookings", icon: CalendarCheck, badge: "3" },
      { title: "Rooms", href: "/receptionist/rooms", icon: BedDouble },
    ],
  },
  {
    label: "Services",
    items: [
      { title: "Service Requests", href: "/receptionist/services", icon: ClipboardList, badge: "2" },
      { title: "Concierge", href: "/receptionist/concierge", icon: Users },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Notifications", href: "/receptionist/notifications", icon: Bell, badge: "4" },
    ],
  },
];

export default function ReceptionistSidebar() {
  return (
    <DashboardSidebar
      navGroups={navGroups}
      brandIcon={Building2}
      brandTitle="EastGate"
      brandSubtitle="Reception"
      accentColor="#0B6E4F"
      basePath="/receptionist"
    />
  );
}
