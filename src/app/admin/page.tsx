"use client";

export const dynamic = "force-dynamic";

import KpiCards from "@/components/admin/dashboard/KpiCards";
import RevenueChart from "@/components/admin/dashboard/RevenueChart";
import OccupancyChart from "@/components/admin/dashboard/OccupancyChart";
import RecentBookings from "@/components/admin/dashboard/RecentBookings";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import TodaySummary from "@/components/admin/dashboard/TodaySummary";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { useAuthStore } from "@/lib/store/auth-store";
import { Shield, Lock, Building2 } from "lucide-react";

export default function AdminDashboard() {
  const { t, isRw } = useI18n();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-emerald rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="heading-md text-charcoal">
              {isSuperAdmin ? t("management", "superAdminDashboard") : t("common", "dashboard")}
            </h1>
            <p className="body-sm text-text-muted-custom mt-0.5">
              {isRw
                ? `Murakaze nanone, ${user?.name || "Umuyobozi"}. Iki ni ibigenda muri EastGate uyu munsi.`
                : `Welcome back, ${user?.name || "Admin"}. Here's what's happening at EastGate today.`}
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Notice */}
      {isSuperAdmin && (
        <Card className="bg-gradient-to-r from-emerald/5 to-gold/5 border-emerald/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-charcoal">
                  {isRw ? "Ikibaho cy'Umunyamabanga Mukuru — Gucunga Sisitemu Yose" : "Super Admin Panel — Full System Control"}
                </p>
                <p className="text-xs text-text-muted-custom">
                  {t("management", "accountsNote")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <Lock className="h-3.5 w-3.5" />
                {t("management", "credentialsManaged")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Summary */}
      <TodaySummary />

      {/* KPI Cards */}
      <KpiCards />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <OccupancyChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentBookings />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
