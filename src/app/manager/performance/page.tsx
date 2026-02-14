"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import { revenueData } from "@/lib/mock-data";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BedDouble,
  UtensilsCrossed,
  Users,
  Star,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Clock,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#0B6E4F", "#C8A951", "#3B82F6", "#8B5CF6", "#F59E0B"];

const weeklyData = [
  { day: "Mon", revenue: 52000000, guests: 45, orders: 78 },
  { day: "Tue", revenue: 48000000, guests: 38, orders: 65 },
  { day: "Wed", revenue: 55000000, guests: 52, orders: 89 },
  { day: "Thu", revenue: 62000000, guests: 58, orders: 95 },
  { day: "Fri", revenue: 78000000, guests: 72, orders: 124 },
  { day: "Sat", revenue: 95000000, guests: 89, orders: 156 },
  { day: "Sun", revenue: 82000000, guests: 76, orders: 134 },
];

const departmentPerformance = [
  { name: "Rooms", target: 85, actual: 78, revenue: 546000000, color: "#0B6E4F" },
  { name: "Restaurant", target: 80, actual: 88, revenue: 169000000, color: "#C8A951" },
  { name: "Events", target: 75, actual: 72, revenue: 110500000, color: "#3B82F6" },
  { name: "Spa", target: 70, actual: 65, revenue: 49400000, color: "#8B5CF6" },
  { name: "Services", target: 90, actual: 92, revenue: 26000000, color: "#F59E0B" },
];

const satisfactionData = [
  { name: "Excellent", value: 45, color: "#10B981" },
  { name: "Good", value: 30, color: "#3B82F6" },
  { name: "Average", value: 15, color: "#F59E0B" },
  { name: "Poor", value: 10, color: "#EF4444" },
];

const staffMetrics = [
  { name: "Patrick Bizimana", role: "Waiter", ordersHandled: 34, rating: 4.9, tips: 125000 },
  { name: "Fabrice Nkurunziza", role: "Waiter", ordersHandled: 28, rating: 4.7, tips: 98000 },
  { name: "Jeanne Mukamana", role: "Waiter", ordersHandled: 31, rating: 4.8, tips: 115000 },
  { name: "Grace Uwase", role: "Receptionist", ordersHandled: 0, rating: 4.9, tips: 0 },
  { name: "Claudine Mukamana", role: "Housekeeping", ordersHandled: 0, rating: 4.6, tips: 0 },
];

export default function PerformancePage() {
  const { user } = useAuthStore();
  const { getOrders, getBookings, getTables, getStaff } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "branch_manager";

  const orders = getOrders(branchId, userRole);
  const bookings = getBookings(branchId, userRole);
  const tables = getTables(branchId, userRole);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0) +
    orders.reduce((sum, o) => sum + o.total, 0);
  const restaurantRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;

  const [period, setPeriod] = useState("week");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Performance Analytics</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Track KPIs, revenue trends, and staff performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <Badge className="bg-emerald-600 text-white gap-1 text-[10px]">
                <ArrowUpRight className="h-3 w-3" /> 12.5%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{formatCompactCurrency(totalRevenue)}</p>
            <p className="text-xs text-emerald-900 font-medium mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <BedDouble className="h-5 w-5 text-blue-600" />
              <Badge className="bg-blue-600 text-white text-[10px]">78%</Badge>
            </div>
            <p className="text-2xl font-bold text-blue-700">78%</p>
            <p className="text-xs text-blue-900 font-medium mt-1">Occupancy Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-5 w-5 text-amber-600" />
              <Badge className="bg-amber-600 text-white gap-1 text-[10px]">
                <ArrowUpRight className="h-3 w-3" /> 0.2
              </Badge>
            </div>
            <p className="text-2xl font-bold text-amber-700">4.8</p>
            <p className="text-xs text-amber-900 font-medium mt-1">Guest Satisfaction</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <UtensilsCrossed className="h-5 w-5 text-purple-600" />
              <Badge className="bg-purple-600 text-white gap-1 text-[10px]">
                <ArrowUpRight className="h-3 w-3" /> 8.3%
              </Badge>
            </div>
            <p className="text-2xl font-bold text-purple-700">{formatCompactCurrency(restaurantRevenue)}</p>
            <p className="text-xs text-purple-900 font-medium mt-1">Restaurant Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald" /> Revenue Trend
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B6E4F" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0B6E4F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), "Revenue"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0B6E4F"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Guest Satisfaction Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600" /> Guest Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={satisfactionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, ""]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {satisfactionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-text-muted-custom">{item.name}</span>
                  <span className="text-xs font-bold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald" /> Department Performance vs Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentPerformance.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="text-sm font-medium text-charcoal">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-muted-custom">
                      Target: {dept.target}%
                    </span>
                    <Badge
                      className={`text-[10px] ${
                        dept.actual >= dept.target
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {dept.actual >= dept.target ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {dept.actual}%
                    </Badge>
                    <span className="text-xs font-semibold text-charcoal w-24 text-right">
                      {formatCompactCurrency(dept.revenue)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={dept.actual} className="h-2" />
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-charcoal/40 rounded"
                    style={{ left: `${dept.target}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Breakdown & Staff Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald" /> Monthly Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCompactCurrency(value as number)]}
                    contentStyle={{ borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="rooms" stackId="a" fill="#0B6E4F" name="Rooms" />
                  <Bar dataKey="restaurant" stackId="a" fill="#C8A951" name="Restaurant" />
                  <Bar dataKey="events" stackId="a" fill="#3B82F6" name="Events" />
                  <Bar dataKey="spa" stackId="a" fill="#8B5CF6" name="Spa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" /> Staff Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffMetrics
                .sort((a, b) => b.rating - a.rating)
                .map((staff, idx) => (
                  <div
                    key={staff.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-pearl/30 hover:bg-pearl/50 transition-colors"
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                        idx === 0
                          ? "bg-amber-500"
                          : idx === 1
                          ? "bg-gray-400"
                          : idx === 2
                          ? "bg-amber-700"
                          : "bg-emerald/50"
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate">
                        {staff.name}
                      </p>
                      <p className="text-xs text-text-muted-custom">{staff.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-charcoal">{staff.rating}</span>
                      </div>
                      {staff.ordersHandled > 0 && (
                        <p className="text-[10px] text-text-muted-custom">
                          {staff.ordersHandled} orders
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald" /> Weekly Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="guests"
                  stroke="#0B6E4F"
                  strokeWidth={2}
                  dot={{ fill: "#0B6E4F", r: 4 }}
                  name="Guests"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#C8A951"
                  strokeWidth={2}
                  dot={{ fill: "#C8A951", r: 4 }}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
