"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatDate } from "@/lib/format";
import {
  Activity,
  CalendarCheck,
  UtensilsCrossed,
  UserCheck,
  LogIn,
  LogOut,
  UserPlus,
  BedDouble,
  ChefHat,
  Building2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof CalendarCheck> = {
  booking_created: CalendarCheck,
  booking_confirmed: CalendarCheck,
  check_in: LogIn,
  check_out: LogOut,
  order_placed: UtensilsCrossed,
  order_status: ChefHat,
  service_request: Activity,
  guest_registered: UserPlus,
  room_updated: BedDouble,
  menu_updated: UtensilsCrossed,
};

const TYPE_LABELS: Record<string, string> = {
  booking_created: "Booking created",
  booking_confirmed: "Booking confirmed",
  check_in: "Check-in",
  check_out: "Check-out",
  order_placed: "Order placed",
  order_status: "Order status",
  service_request: "Service request",
  guest_registered: "Guest registered",
  room_updated: "Room updated",
  menu_updated: "Menu updated",
};

const ROLE_LABELS: Record<string, string> = {
  receptionist: "Receptionist",
  waiter: "Waiter",
  kitchen_staff: "Kitchen",
  branch_manager: "Manager",
  super_manager: "Super Manager",
  super_admin: "Admin",
};

export default function AdminOperationsPage() {
  const { user } = useAuthStore();
  const getBranches = useBranchStore((s) => s.getBranches);
  const getActivityLog = useBranchStore((s) => s.getActivityLog);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [branchFilter, setBranchFilter] = useState(selectedBranchId || "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const role = user?.role ?? "guest";
  const isSuper = role === "super_admin" || role === "super_manager";
  const branchList = getBranches(role, "all");
  const branchIdForLog = isSuper ? branchFilter : (user?.branchId ?? "br-001");
  const activityLog = getActivityLog(branchIdForLog, role);

  const filtered = useMemo(() => {
    let list = activityLog;
    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter);
    return list.slice(0, 200);
  }, [activityLog, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activityLog.forEach((a) => {
      counts[a.type] = (counts[a.type] ?? 0) + 1;
    });
    return counts;
  }, [activityLog]);

  const uniqueTypes = useMemo(() => Array.from(new Set(activityLog.map((a) => a.type))), [activityLog]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Operations & Activity</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Real actions by waiters, receptionists, kitchen, and managers — from your database
          </p>
        </div>
      </div>

      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            {isSuper && (
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[200px] h-9">
                  <Building2 className="h-4 w-4 mr-2 text-text-muted-custom" />
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branchList.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <Activity className="h-4 w-4 mr-2 text-text-muted-custom" />
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t] ?? t} ({typeCounts[t] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-text-muted-custom ml-auto">
              {filtered.length} action{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="h-12 w-12 text-text-muted-custom/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-charcoal">No activity yet</p>
              <p className="text-xs text-text-muted-custom mt-1">
                Actions from bookings, orders, check-ins, and service requests appear here
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((entry) => {
                const Icon = TYPE_ICONS[entry.type] ?? Activity;
                const label = TYPE_LABELS[entry.type] ?? entry.type;
                const roleLabel = ROLE_LABELS[entry.actorRole] ?? entry.actorRole;
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border border-transparent",
                      "hover:bg-pearl/30 transition-colors"
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-emerald" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{entry.description}</p>
                      <p className="text-xs text-text-muted-custom mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{entry.actorName}</span>
                        <span>·</span>
                        <span>{roleLabel}</span>
                        {isSuper && branchFilter === "all" && (
                          <>
                            <span>·</span>
                            <Badge variant="outline" className="text-[10px] font-normal">{entry.branchName}</Badge>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-text-muted-custom">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(entry.createdAt)} {entry.createdAt.includes("T") ? new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
