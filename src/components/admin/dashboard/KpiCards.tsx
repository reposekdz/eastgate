"use client";

import { Card, CardContent } from "@/components/ui/card";
import { kpiData } from "@/lib/mock-data";
import { formatCurrency, formatPercentage } from "@/lib/format";
import {
  DollarSign,
  BedDouble,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const kpis = [
  {
    title: "Total Revenue",
    value: formatCurrency(kpiData.totalRevenue),
    change: kpiData.revenueChange,
    icon: DollarSign,
    iconBg: "bg-emerald/10",
    iconColor: "text-emerald",
  },
  {
    title: "Occupancy Rate",
    value: formatPercentage(kpiData.occupancyRate),
    change: kpiData.occupancyChange,
    icon: BedDouble,
    iconBg: "bg-status-occupied/10",
    iconColor: "text-status-occupied",
  },
  {
    title: "Avg. Daily Rate",
    value: formatCurrency(kpiData.adr),
    change: kpiData.adrChange,
    icon: TrendingUp,
    iconBg: "bg-gold/10",
    iconColor: "text-gold-dark",
  },
  {
    title: "RevPAR",
    value: formatCurrency(kpiData.revpar),
    change: kpiData.revparChange,
    icon: BarChart3,
    iconBg: "bg-status-reserved/10",
    iconColor: "text-status-reserved",
  },
];

export default function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="py-4 shadow-xs border-transparent hover:shadow-sm transition-shadow">
          <CardContent className="px-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted-custom">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-charcoal tracking-tight">
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1">
                  {kpi.change > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      kpi.change > 0 ? "text-emerald" : "text-destructive"
                    }`}
                  >
                    {Math.abs(kpi.change)}%
                  </span>
                  <span className="text-xs text-text-muted-custom">vs last month</span>
                </div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
