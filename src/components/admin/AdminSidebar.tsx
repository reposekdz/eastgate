"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  UtensilsCrossed,
  CalendarDays,
  DollarSign,
  UserCog,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Rooms", href: "/admin/rooms", icon: BedDouble },
      { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
      { title: "Guests", href: "/admin/guests", icon: Users },
    ],
  },
  {
    label: "Services",
    items: [
      { title: "Restaurant", href: "/admin/restaurant", icon: UtensilsCrossed },
      { title: "Events", href: "/admin/events", icon: CalendarDays },
      { title: "Spa & Wellness", href: "/admin/spa", icon: Sparkles },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Finance", href: "/admin/finance", icon: DollarSign },
      { title: "Staff", href: "/admin/staff", icon: UserCog },
      { title: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
    >
      {/* Header / Brand */}
      <SidebarHeader className="px-4 py-5">
        <Link href="/admin" className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-emerald text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-wide text-charcoal">
              East<span className="text-gold">Gate</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-text-muted-custom">
              Admin Panel
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-text-muted-custom/70 px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={
                          isActive
                            ? "bg-emerald/10 text-emerald font-semibold hover:bg-emerald/15"
                            : "text-slate-custom hover:bg-pearl hover:text-charcoal"
                        }
                      >
                        <Link href={item.href}>
                          <item.icon className={`h-4 w-4 ${isActive ? "text-emerald" : ""}`} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 pb-4">
        <SidebarSeparator className="mb-3" />
        <div className="flex items-center gap-3 rounded-[8px] px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="https://i.pravatar.cc/40?u=admin-jp" alt="Jean-Pierre Habimana" />
            <AvatarFallback className="bg-emerald text-white text-xs">JP</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-sm font-medium text-charcoal truncate">Jean-Pierre H.</span>
            <span className="text-[11px] text-text-muted-custom">Branch Manager</span>
          </div>
          <button className="ml-auto text-text-muted-custom hover:text-destructive transition-colors group-data-[collapsible=icon]:hidden">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
