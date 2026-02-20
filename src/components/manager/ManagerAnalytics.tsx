"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useManagerApi } from "@/hooks/use-manager-api";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/format";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];

export default function ManagerAnalytics() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || "";
  const [period, setPeriod] = useState("month");
  const { data, loading, get } = useManagerApi("analytics");

  useEffect(() => {
    if (branchId) {
      get({ branchId, period });
    }
  }, [branchId, period]);

  const handleRefresh = () => {
    get({ branchId, period });
  };

  const handleExport = () => {
    // Export logic
    console.log("Exporting analytics...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Analytics & Insights</h1>
          <p className="text-sm text-text-muted-custom">Performance metrics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                12.5%
              </Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Total Revenue</p>
            <p className="text-2xl font-bold text-charcoal">{formatCurrency(summary.totalRevenue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700">{summary.occupancyRate || 0}%</Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Occupancy Rate</p>
            <p className="text-2xl font-bold text-charcoal">
              {summary.occupiedRooms || 0}/{summary.totalRooms || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <Badge className="bg-purple-100 text-purple-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                8.2%
              </Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Total Guests</p>
            <p className="text-2xl font-bold text-charcoal">{summary.totalGuests || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-700">{summary.totalOrders || 0}</Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Restaurant Revenue</p>
            <p className="text-2xl font-bold text-charcoal">{formatCurrency(summary.restaurantRevenue || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.revenueBySource || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / summary.totalRevenue) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(charts.revenueBySource || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.topItems || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.paymentMethods || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Total</span>
              <span className="font-semibold">{data?.bookings?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Confirmed</span>
              <span className="font-semibold">{data?.bookings?.confirmed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Checked In</span>
              <span className="font-semibold">{data?.bookings?.checkedIn || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Checked Out</span>
              <span className="font-semibold">{data?.bookings?.checkedOut || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Total</span>
              <span className="font-semibold">{data?.orders?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Pending</span>
              <span className="font-semibold">{data?.orders?.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Preparing</span>
              <span className="font-semibold">{data?.orders?.preparing || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Completed</span>
              <span className="font-semibold">{data?.orders?.completed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Total Guests</span>
              <span className="font-semibold">{summary.totalGuests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">New Guests</span>
              <span className="font-semibold">{summary.newGuests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Returning</span>
              <span className="font-semibold">{summary.returningGuests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-text-muted-custom">Avg Performance</span>
              <span className="font-semibold">{summary.avgPerformance || 0}/5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
