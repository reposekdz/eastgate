"use client";

import KpiCards from "@/components/admin/dashboard/KpiCards";
import RevenueChart from "@/components/admin/dashboard/RevenueChart";
import OccupancyChart from "@/components/admin/dashboard/OccupancyChart";
import RecentBookings from "@/components/admin/dashboard/RecentBookings";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import TodaySummary from "@/components/admin/dashboard/TodaySummary";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="heading-md text-charcoal">Dashboard</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Welcome back, Jean-Pierre. Here&apos;s what&apos;s happening at Kigali Main today.
        </p>
      </div>

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
