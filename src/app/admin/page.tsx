"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import KpiCards from "@/components/admin/dashboard/KpiCards";
import RevenueChart from "@/components/admin/dashboard/RevenueChart";
import OccupancyChart from "@/components/admin/dashboard/OccupancyChart";
import RecentBookings from "@/components/admin/dashboard/RecentBookings";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import TodaySummary from "@/components/admin/dashboard/TodaySummary";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import { useAuthStore } from "@/lib/store/auth-store";
import { Shield, Lock, Building2, LayoutDashboard, TrendingUp, CalendarCheck, CreditCard } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { t, isRw } = useI18n();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const isBranchAdmin = user?.role === "branch_admin";
  const [tab, setTab] = useState("overview");

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
              {isSuperAdmin
                ? t("management", "superAdminDashboard")
                : isBranchAdmin
                  ? t("dashboard", "branchAdminDashboard")
                  : t("common", "dashboard")}
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

      {/* Branch Admin notice */}
      {isBranchAdmin && !isSuperAdmin && (
        <Card className="bg-gradient-to-r from-indigo-50 to-emerald/5 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-charcoal">
                  {t("dashboard", "branchAdminDashboard")} — {user?.branchName}
                </p>
                <p className="text-xs text-text-muted-custom">
                  {t("management", "accountsNote")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4 h-11">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">{t("common", "overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("dashboard", "revenueShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1.5 text-xs sm:text-sm">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t("dashboard", "recentBookings")}</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t("dashboard", "quickActions")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <TodaySummary />
          <KpiCards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <OccupancyChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RecentBookings />
            </div>
            <QuickActions />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6 mt-6">
          <KpiCards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <OccupancyChart />
          </div>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-text-muted-custom">{t("dashboard", "viewReports")}</p>
              <Link href="/admin/finance">
                <span className="text-sm font-medium text-emerald hover:underline">{t("management", "viewAll")} →</span>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6 mt-6">
          <TodaySummary />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RecentBookings />
            </div>
            <QuickActions />
          </div>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-text-muted-custom">{t("dashboard", "recentBookings")}</p>
              <Link href="/admin/bookings">
                <span className="text-sm font-medium text-emerald hover:underline">{t("management", "viewAll")} →</span>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActions />
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-charcoal mb-2">{t("dashboard", "viewPayments")}</h3>
                <p className="text-sm text-text-muted-custom mb-4">
                  {isRw ? "Reba amakuru y'ubwishyu n'amakonti yose." : "View all payment transactions and revenue by method."}
                </p>
                <Link href="/admin/payments">
                  <span className="text-sm font-medium text-emerald hover:underline">{t("management", "viewAll")} →</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
