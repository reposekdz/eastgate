"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { formatCurrency, formatPercentage } from "@/lib/format";
import {
  DollarSign,
  BedDouble,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";

export default function KpiCards() {
  const { data, loading } = useAdminDashboard();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="py-4 shadow-xs border-transparent">
            <CardContent className="px-5 flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-emerald" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const kpi = data.kpi;

  const kpis = [
    {
      title: "Total Revenue",
      value: formatCurrency(kpi.totalRevenue),
      change: kpi.revenueChange,
      icon: DollarSign,
      iconBg: "bg-emerald/10",
      iconColor: "text-emerald",
    },
    {
      title: "Occupancy Rate",
      value: formatPercentage(kpi.occupancyRate),
      change: kpi.occupancyChange,
      icon: BedDouble,
      iconBg: "bg-status-occupied/10",
      iconColor: "text-status-occupied",
    },
    {
      title: "Avg. Daily Rate",
      value: formatCurrency(kpi.adr),
      change: kpi.adrChange,
      icon: TrendingUp,
      iconBg: "bg-gold/10",
      iconColor: "text-gold-dark",
    },
    {
      title: "RevPAR",
      value: formatCurrency(kpi.revpar),
      change: kpi.revparChange,
      icon: BarChart3,
      iconBg: "bg-status-reserved/10",
      iconColor: "text-status-reserved",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpiItem) => (
        <Card
          key={kpiItem.title}
          className="py-4 shadow-xs border-transparent hover:shadow-sm transition-shadow"
        >
          <CardContent className="px-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted-custom">
                  {kpiItem.title}
                </p>
                <p className="text-2xl font-bold text-charcoal tracking-tight">
                  {kpiItem.value}
                </p>
                <div className="flex items-center gap-1">
                  {kpiItem.change > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      kpiItem.change > 0 ? "text-emerald" : "text-destructive"
                    }`}
                  >
                    {Math.abs(kpiItem.change)}%
                  </span>
                  <span className="text-xs text-text-muted-custom">vs last month</span>
                </div>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${kpiItem.iconBg}`}
              >
                <kpiItem.icon className={`h-5 w-5 ${kpiItem.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
