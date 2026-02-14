"use client";

import DashboardSidebar from "@/components/shared/DashboardSidebar";
import type { NavGroup } from "@/components/shared/DashboardSidebar";
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarCheck,
  ClipboardList,
  Grid3X3,
  Bell,
  CoffeeIcon,
  ChefHat,
} from "lucide-react";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/waiter", icon: LayoutDashboard },
    ],
  },
  {
    label: "Restaurant",
    items: [
      { title: "Kitchen Display", href: "/waiter/kitchen-display", icon: ChefHat },
      { title: "Table Map", href: "/waiter/tables", icon: Grid3X3 },
      { title: "Orders", href: "/waiter/orders", icon: UtensilsCrossed, badge: "3" },
      { title: "New Order", href: "/waiter/new-order", icon: CoffeeIcon },
    ],
  },
  {
    label: "Guest Services",
    items: [
      { title: "Bookings", href: "/waiter/bookings", icon: CalendarCheck },
      { title: "Service Requests", href: "/waiter/services", icon: ClipboardList, badge: "2" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Notifications", href: "/waiter/notifications", icon: Bell, badge: "4" },
    ],
  },
];

export default function WaiterSidebar() {
  return (
    <DashboardSidebar
      navGroups={navGroups}
      brandIcon={UtensilsCrossed}
      brandTitle="EastGate"
      brandSubtitle="Waiter Panel"
      accentColor="#D97706"
      basePath="/waiter"
    />
  );
}
