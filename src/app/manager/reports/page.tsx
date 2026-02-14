"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BedDouble,
  UtensilsCrossed,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

const monthlyReport = {
  period: "January 2026",
  totalRevenue: 900400000,
  prevRevenue: 800500000,
  roomRevenue: 546000000,
  restaurantRevenue: 169000000,
  eventRevenue: 110500000,
  spaRevenue: 49400000,
  servicesRevenue: 26000000,
  occupancyRate: 78,
  avgDailyRate: 500500,
  revpar: 390000,
  totalBookings: 245,
  cancelledBookings: 12,
  avgStayLength: 3.2,
  topRoom: "Presidential Suite",
  topDish: "Brochette Royale",
  guestSatisfaction: 4.8,
  staffPerformance: 92,
};

const revenueBreakdown = [
  { name: "Rooms", amount: 546000000, pct: 60.6, color: "#0B6E4F" },
  { name: "Restaurant", amount: 169000000, pct: 18.8, color: "#C8A951" },
  { name: "Events", amount: 110500000, pct: 12.3, color: "#3B82F6" },
  { name: "Spa", amount: 49400000, pct: 5.5, color: "#8B5CF6" },
  { name: "Services", amount: 26000000, pct: 2.9, color: "#F59E0B" },
];

export default function ManagerReportsPage() {
  const { user } = useAuthStore();
  const revenueChange = ((monthlyReport.totalRevenue - monthlyReport.prevRevenue) / monthlyReport.prevRevenue) * 100;

  const handleExport = (type: string) => {
    toast.success(`${type} report exported successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Reports</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Monthly summary &bull; {monthlyReport.period}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("PDF")}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("Excel")}>
            <FileText className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("Print")}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-emerald to-emerald-dark text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-white/70 font-medium">Total Revenue — {monthlyReport.period}</p>
              <p className="text-3xl font-bold mt-1">{formatCompactCurrency(monthlyReport.totalRevenue)}</p>
              <div className="flex items-center gap-2 mt-2">
                {revenueChange >= 0 ? (
                  <Badge className="bg-white/20 text-white gap-1">
                    <ArrowUpRight className="h-3 w-3" /> {revenueChange.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 text-white gap-1">
                    <ArrowDownRight className="h-3 w-3" /> {Math.abs(revenueChange).toFixed(1)}%
                  </Badge>
                )}
                <span className="text-xs text-white/60">vs previous month</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{monthlyReport.occupancyRate}%</p>
                <p className="text-xs text-white/70">Occupancy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{monthlyReport.guestSatisfaction}</p>
                <p className="text-xs text-white/70">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{monthlyReport.totalBookings}</p>
                <p className="text-xs text-white/70">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{monthlyReport.avgStayLength}d</p>
                <p className="text-xs text-white/70">Avg Stay</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald" /> Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {revenueBreakdown.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-charcoal">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-charcoal">{formatCompactCurrency(item.amount)}</span>
                  <Badge variant="outline" className="text-[10px] w-14 justify-center">
                    {item.pct}%
                  </Badge>
                </div>
              </div>
              <Progress value={item.pct} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-text-muted-custom font-medium">Average Daily Rate</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatCurrency(monthlyReport.avgDailyRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-text-muted-custom font-medium">RevPAR</p>
            <p className="text-xl font-bold text-charcoal mt-1">{formatCurrency(monthlyReport.revpar)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-text-muted-custom font-medium">Cancelled Bookings</p>
            <p className="text-xl font-bold text-charcoal mt-1">{monthlyReport.cancelledBookings}</p>
            <p className="text-[10px] text-text-muted-custom">{((monthlyReport.cancelledBookings / monthlyReport.totalBookings) * 100).toFixed(1)}% rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-text-muted-custom font-medium">Staff Performance</p>
            <p className="text-xl font-bold text-charcoal mt-1">{monthlyReport.staffPerformance}%</p>
            <Progress value={monthlyReport.staffPerformance} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald" /> Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Best performing room type", value: monthlyReport.topRoom, icon: BedDouble },
              { label: "Most popular dish", value: monthlyReport.topDish, icon: UtensilsCrossed },
              { label: "Average guest rating", value: `${monthlyReport.guestSatisfaction} / 5.0`, icon: TrendingUp },
              { label: "Average length of stay", value: `${monthlyReport.avgStayLength} nights`, icon: Calendar },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-pearl/30">
                <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                  <item.icon className="h-4 w-4 text-emerald" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-muted-custom">{item.label}</p>
                  <p className="text-sm font-bold text-charcoal">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald" /> Quick Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Room Revenue", current: 546000000, prev: 507000000 },
              { label: "Restaurant Revenue", current: 169000000, prev: 149500000 },
              { label: "Event Revenue", current: 110500000, prev: 91000000 },
              { label: "Spa Revenue", current: 49400000, prev: 42900000 },
            ].map((item) => {
              const change = ((item.current - item.prev) / item.prev) * 100;
              return (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-pearl/30">
                  <div>
                    <p className="text-xs text-text-muted-custom">{item.label}</p>
                    <p className="text-sm font-bold text-charcoal">{formatCompactCurrency(item.current)}</p>
                  </div>
                  <Badge className={`text-[10px] ${change >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {Math.abs(change).toFixed(1)}%
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
