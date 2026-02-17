"use client";

import DashboardSidebar from "@/components/shared/DashboardSidebar";
import type { NavGroup } from "@/components/shared/DashboardSidebar";
import {
  LayoutDashboard,
  ChefHat,
  ClipboardList,
  Bell,
  Flame,
  Timer,
} from "lucide-react";

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/kitchen", icon: LayoutDashboard },
    ],
  },
  {
    label: "Orders",
    items: [
      { title: "Order Queue", href: "/kitchen/orders", icon: ChefHat, badge: "Live" },
      { title: "Prep Board", href: "/kitchen/prep", icon: ClipboardList },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Notifications", href: "/kitchen/notifications", icon: Bell },
    ],
  },
];

export default function KitchenSidebar() {
  return (
    <DashboardSidebar
      navGroups={navGroups}
      brandIcon={Flame}
      brandTitle="EastGate"
      brandSubtitle="Kitchen"
      accentColor="#EA580C"
      basePath="/kitchen"
    />
  );
}
