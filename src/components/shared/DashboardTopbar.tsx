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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
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
  const { selectedBranchId, setSelectedBranch } = useBranchStore();
  const router = useRouter();
  const isSuperRole = user?.role === "super_admin" || user?.role === "super_manager";

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
