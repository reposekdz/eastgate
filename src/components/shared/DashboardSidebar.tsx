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
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  navGroups: NavGroup[];
  brandIcon: LucideIcon;
  brandTitle: string;
  brandSubtitle: string;
  accentColor: string;
  basePath: string;
}

export default function DashboardSidebar({
  navGroups,
  brandIcon: BrandIcon,
  brandTitle,
  brandSubtitle,
  accentColor,
  basePath,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 py-5">
        <Link
          href={basePath}
          className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white"
            style={{ backgroundColor: accentColor }}
          >
            <BrandIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-wide text-charcoal">
              East<span className="text-gold">Gate</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-text-muted-custom">
              {brandSubtitle}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

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
                    item.href === basePath
                      ? pathname === basePath
                      : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={
                          isActive
                            ? `bg-opacity-10 font-semibold hover:bg-opacity-15`
                            : "text-slate-custom hover:bg-pearl hover:text-charcoal"
                        }
                        style={
                          isActive
                            ? {
                                backgroundColor: `${accentColor}15`,
                                color: accentColor,
                              }
                            : undefined
                        }
                      >
                        <Link href={item.href}>
                          <item.icon
                            className="h-4 w-4"
                            style={isActive ? { color: accentColor } : undefined}
                          />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge
                              className="ml-auto h-5 px-1.5 text-[10px]"
                              style={{ backgroundColor: accentColor, color: "#fff" }}
                            >
                              {item.badge}
                            </Badge>
                          )}
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

      <SidebarFooter className="px-3 pb-4">
        <SidebarSeparator className="mb-3" />
        <div className="flex items-center gap-3 rounded-[8px] px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback
              className="text-white text-xs"
              style={{ backgroundColor: accentColor }}
            >
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
            <span className="text-sm font-medium text-charcoal truncate">
              {user?.name || "User"}
            </span>
            <span className="text-[11px] text-text-muted-custom">
              {user?.branchName || "Branch"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto text-text-muted-custom hover:text-destructive transition-colors group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
