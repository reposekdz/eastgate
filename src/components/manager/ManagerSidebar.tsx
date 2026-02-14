"use client";

import DashboardSidebar from "@/components/shared/DashboardSidebar";
import type { NavGroup } from "@/components/shared/DashboardSidebar";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  UtensilsCrossed,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Building2,
  Settings,
  Bell,
} from "lucide-react";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/manager", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Staff Management", href: "/manager/staff", icon: Users },
      { title: "Orders", href: "/manager/orders", icon: UtensilsCrossed, badge: "3" },
      { title: "Bookings", href: "/manager/bookings", icon: CalendarCheck },
      { title: "Service Requests", href: "/manager/services", icon: ClipboardList, badge: "5" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Performance", href: "/manager/performance", icon: BarChart3 },
      { title: "Reports", href: "/manager/reports", icon: Building2 },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Notifications", href: "/manager/notifications", icon: Bell, badge: "4" },
      { title: "Messages", href: "/manager/messages", icon: MessageSquare },
      { title: "Settings", href: "/manager/settings", icon: Settings },
    ],
  },
];

export default function ManagerSidebar() {
  return (
    <DashboardSidebar
      navGroups={navGroups}
      brandIcon={Building2}
      brandTitle="EastGate"
      brandSubtitle="Manager Panel"
      accentColor="#0B6E4F"
      basePath="/manager"
    />
  );
}
