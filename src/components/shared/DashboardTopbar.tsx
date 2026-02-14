"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { useRouter } from "next/navigation";

interface DashboardTopbarProps {
  accentColor: string;
  showBranchSelector?: boolean;
}

export default function DashboardTopbar({
  accentColor,
  showBranchSelector = false,
}: DashboardTopbarProps) {
  const { user, logout } = useAuthStore();
  const { selectedBranchId, setSelectedBranch, getNotifications, markNotificationRead } = useBranchStore();
  const router = useRouter();
  const isSuperRole = user?.role === "super_admin" || user?.role === "super_manager";
  const branchId = isSuperRole ? selectedBranchId : (user?.branchId || "br-001");
  const notifications = getNotifications(branchId, user?.role || "waiter");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4">
      <SidebarTrigger className="-ml-1 text-slate-custom hover:text-charcoal" />
      <Separator orientation="vertical" className="h-5" />

      {/* Branch name */}
      {showBranchSelector && isSuperRole ? (
        <Select value={selectedBranchId} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-[180px] h-8 text-sm border-dashed">
            <SelectValue placeholder="Select Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="br-001">Kigali Main</SelectItem>
            <SelectItem value="br-002">Ngoma Branch</SelectItem>
            <SelectItem value="br-003">Kirehe Branch</SelectItem>
            <SelectItem value="br-004">Gatsibo Branch</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <span className="text-sm font-medium text-charcoal">
          {user?.branchName || "EastGate Hotel"}
        </span>
      )}

      <div className="flex-1" />

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative text-slate-custom hover:text-charcoal h-8 w-8 p-0"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
              >
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.slice(0, 5).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 py-3 cursor-pointer"
              onClick={() => markNotificationRead(n.id)}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.read && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
                <span className="text-sm font-medium">{n.title}</span>
              </div>
              <span className="text-xs text-muted-foreground pl-4">
                {n.message}
              </span>
            </DropdownMenuItem>
          ))}
          {notifications.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback
                className="text-white text-[10px]"
                style={{ backgroundColor: accentColor }}
              >
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-medium text-charcoal leading-tight">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-text-muted-custom leading-tight">
                {user?.branchName}
              </span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
