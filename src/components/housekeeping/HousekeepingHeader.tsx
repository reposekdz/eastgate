"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import { getUserDisplayInfo } from "@/lib/user-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HousekeepingHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const userInfo = getUserDisplayInfo(user?.email || "", user?.name);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-pearl flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-charcoal">
          Housekeeping Dashboard
        </h1>
        <p className="text-xs text-text-muted-custom">
          {user?.branchName || "EastGate Hotel"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-custom" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-pearl px-3 py-2 rounded-lg transition-colors">
              <Avatar className="h-9 w-9 border-2 border-emerald">
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ backgroundColor: userInfo.avatarColor }}
                >
                  {userInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-charcoal">
                  {userInfo.displayName}
                </p>
                <p className="text-xs text-text-muted-custom">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{userInfo.displayName}</p>
                <p className="text-xs text-text-muted-custom font-normal">
                  {userInfo.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/housekeeping/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/housekeeping/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
