"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Settings, Building2, TrendingUp, Users, BedDouble } from "lucide-react";
import { useRouter } from "next/navigation";

interface BranchInfo {
  id: string;
  name: string;
  location: string;
  totalRooms: number;
  activeStaff: number;
  occupancyRate: number;
  todayRevenue: number;
  manager: {
    name: string;
    email: string;
    level: string;
  } | null;
}

export default function ManagerTopbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId || "all");
  const [allBranches, setAllBranches] = useState<BranchInfo[]>([]);
  
  const isSuperRole = user?.role === "super_admin" || user?.role === "super_manager";

  useEffect(() => {
    const fetchBranchInfo = async () => {
      try {
        const token = localStorage.getItem("eastgate-token");
        if (!token) return;

        if (isSuperRole) {
          const res = await fetch("/api/branches", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setAllBranches(data.branches);
            if (selectedBranch !== "all") {
              const branch = data.branches.find((b: BranchInfo) => b.id === selectedBranch);
              setBranchInfo(branch || null);
            }
          }
        } else {
          const res = await fetch(`/api/manager/branch-info?branchId=${user?.branchId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setBranchInfo(data.branch);
          }
        }
      } catch (error) {
        console.error("Failed to fetch branch info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchInfo();
    const interval = setInterval(fetchBranchInfo, 30000);
    return () => clearInterval(interval);
  }, [user?.branchId, isSuperRole, selectedBranch]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    if (branchId === "all") {
      setBranchInfo(null);
    } else {
      const branch = allBranches.find(b => b.id === branchId);
      setBranchInfo(branch || null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-white px-4 shadow-sm">
      <SidebarTrigger className="-ml-1 text-slate-custom hover:text-charcoal" />
      <Separator orientation="vertical" className="h-5" />

      {isSuperRole ? (
        <Select value={selectedBranch} onValueChange={handleBranchChange}>
          <SelectTrigger className="w-[220px] h-9 border-emerald/30">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                All Branches
              </div>
            </SelectItem>
            {allBranches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {branch.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald" />
          <div>
            <p className="text-sm font-semibold text-charcoal">{branchInfo?.name || user?.branchName}</p>
            <p className="text-xs text-text-muted-custom">{branchInfo?.location}</p>
          </div>
        </div>
      )}

      {!loading && branchInfo && (
        <>
          <Separator orientation="vertical" className="h-5" />
          <div className="hidden lg:flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <BedDouble className="h-3 w-3" />
              {branchInfo.occupancyRate.toFixed(0)}% Occupied
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Users className="h-3 w-3" />
              {branchInfo.activeStaff} Staff
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <TrendingUp className="h-3 w-3" />
              RWF {branchInfo.todayRevenue.toLocaleString()}
            </Badge>
          </div>
        </>
      )}

      <div className="flex-1" />

      <Separator orientation="vertical" className="h-5 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-emerald text-white text-[10px]">
                {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-medium text-charcoal leading-tight">
                {user?.name || "Manager"}
              </span>
              <span className="text-[10px] text-text-muted-custom leading-tight">
                {isSuperRole ? user?.department || "Management" : `${branchInfo?.name || user?.branchName} • ${user?.department || "Management"}`}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
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
