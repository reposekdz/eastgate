"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import {
  Building2,
  MapPin,
  Users,
  ArrowRight,
  Shield,
  UserCog,
} from "lucide-react";
import Link from "next/link";

export default function BranchesPage() {
  const { user, getAllStaff, hasAccess } = useAuthStore();
  const { getBranches, getBookings, getOrders } = useBranchStore();
  const isSuper = hasAccess(["super_admin", "super_manager"]);
  const branchId = user?.branchId ?? "all";
  const role = user?.role ?? "guest";
  const branches = getBranches(role, branchId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Branches</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          All 4 EastGate branches — managers, waiters, receptionists, kitchen staff & admin per branch
        </p>
      </div>

      {isSuper && (
        <Card className="bg-gradient-to-r from-emerald/5 to-gold/5 border-emerald/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">Super Admin / Super Manager</p>
              <p className="text-xs text-text-muted-custom">
                Add staff to any branch and assign credentials from Staff Management. Staff must change password & email on first login.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-emerald text-emerald hover:bg-emerald/10">
              <Link href="/admin/staff-management">
                <UserCog className="h-4 w-4 mr-2" />
                Manage Staff
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((branch) => {
          const staffList = isSuper || branchId === branch.id ? getAllStaff(branch.id, true) : [];
          const bookings = getBookings(branch.id, user?.role ?? "guest");
          const orders = getOrders(branch.id, user?.role ?? "guest");
          const revenue = bookings
            .filter((b) => b.status === "checked_in" || b.status === "checked_out" || b.status === "confirmed")
            .reduce((s, b) => s + b.totalAmount, 0);

          return (
            <Card key={branch.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-emerald" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-text-muted-custom">
                        <MapPin className="h-3.5 w-3.5" />
                        {branch.location}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{branch.totalRooms} rooms</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-pearl p-2">
                    <p className="text-lg font-bold text-charcoal">{staffList.length}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted-custom">Staff</p>
                  </div>
                  <div className="rounded-lg bg-pearl p-2">
                    <p className="text-lg font-bold text-charcoal">{bookings.length}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted-custom">Bookings</p>
                  </div>
                  <div className="rounded-lg bg-pearl p-2">
                    <p className="text-sm font-bold text-emerald">{formatCurrency(revenue)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted-custom">Revenue</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Users className="h-4 w-4 text-text-muted-custom" />
                  <span className="text-xs text-text-muted-custom">
                    {staffList.filter((s) => s.user.role === "branch_manager").length} manager(s),{" "}
                    {staffList.filter((s) => s.user.role === "waiter" || s.user.role === "restaurant_staff").length} waiter(s),{" "}
                    {staffList.filter((s) => s.user.role === "receptionist").length} receptionist(s),{" "}
                    {staffList.filter((s) => s.user.role === "kitchen_staff").length} kitchen
                  </span>
                </div>
                {isSuper && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/admin/staff-management" className="flex items-center justify-center gap-2">
                      Manage staff for {branch.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
