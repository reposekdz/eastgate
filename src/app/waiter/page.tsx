"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  TrendingUp,
  Grid3X3,
  CalendarCheck,
  ClipboardList,
  Users,
  Activity,
  Zap,
  Timer,
  Flame,
  Bell,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function WaiterDashboard() {
  const { user } = useAuthStore();
  const { isRw } = useI18n();
  const {
    getOrders,
    getTables,
    getBookings,
    getServiceRequests,
  } = useBranchStore();

  const userRole = user?.role || "waiter";
  const branchId = user?.branchId || "br-001";

  const orders = getOrders(branchId, userRole);
  const tables = getTables(branchId, userRole);
  const bookings = getBookings(branchId, userRole);
  const serviceRequests = getServiceRequests(branchId, userRole);

  // Stats
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const preparingOrders = orders.filter((o) => o.status === "preparing").length;
  const readyOrders = orders.filter((o) => o.status === "ready").length;
  const activeOrders = orders.filter((o) => o.status !== "served").length;
  const todayRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const occupiedTables = tables.filter((t) => t.status === "occupied").length;
  const availableTables = tables.filter((t) => t.status === "available").length;
  const reservedTables = tables.filter((t) => t.status === "reserved").length;

  const pendingServices = serviceRequests.filter(
    (sr) => sr.status === "pending"
  ).length;
  const todayBookings = bookings.filter(
    (b) => b.status === "checked_in"
  ).length;

  const liveOrders = orders.filter((o) => o.status !== "served").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="heading-md text-charcoal">
                Welcome, {user?.name?.split(" ")[0] || "Waiter"}
              </h1>
              <p className="text-xs text-text-muted-custom">
                {user?.branchName} &bull; Waiter Dashboard
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/waiter/tables">
            <Button variant="outline" size="sm">
              <Grid3X3 className="mr-2 h-4 w-4" /> Table Map
            </Button>
          </Link>
          <Link href="/waiter/new-order">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              <Zap className="mr-2 h-4 w-4" /> New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Performance Efficiency Bar */}
      <Card className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 border-0 shadow-xl">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Timer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">4.2 min</p>
                <p className="text-[11px] text-white/80">{isRw ? "Igihe Cyiza cyo Gutanga" : "Avg Serve Time"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">{orders.filter((o) => o.status === "served").length}</p>
                <p className="text-[11px] text-white/80">{isRw ? "Byarangiye Uyu munsi" : "Completed Today"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">98%</p>
                <p className="text-[11px] text-white/80">{isRw ? "Ubuziranenge" : "Service Quality"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">{orders.reduce((sum, o) => sum + o.items.length, 0)}</p>
                <p className="text-[11px] text-white/80">{isRw ? "Ibyo Ubatanzwe" : "Items Served"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Link href="/waiter/new-order" className="group">
          <Card className="hover:border-amber-300 hover:shadow-md transition-all">
            <CardContent className="p-3 text-center">
              <Zap className="h-5 w-5 text-amber-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-semibold text-charcoal">{isRw ? "Ibitumizwa Bishya" : "New Order"}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/waiter/tables" className="group">
          <Card className="hover:border-blue-300 hover:shadow-md transition-all">
            <CardContent className="p-3 text-center">
              <Grid3X3 className="h-5 w-5 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-semibold text-charcoal">{isRw ? "Imeza" : "Tables"}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/waiter/messages" className="group">
          <Card className="hover:border-purple-300 hover:shadow-md transition-all">
            <CardContent className="p-3 text-center">
              <MessageSquare className="h-5 w-5 text-purple-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-semibold text-charcoal">{isRw ? "Ubutumwa" : "Messages"}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/waiter/notifications" className="group">
          <Card className="hover:border-red-300 hover:shadow-md transition-all">
            <CardContent className="p-3 text-center">
              <Bell className="h-5 w-5 text-red-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-semibold text-charcoal">{isRw ? "Amakuru" : "Alerts"}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-700">{pendingOrders}</p>
            <p className="text-[11px] text-orange-900 font-medium">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4 text-center">
            <ChefHat className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">
              {preparingOrders}
            </p>
            <p className="text-[11px] text-blue-900 font-medium">Preparing</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-700">{readyOrders}</p>
            <p className="text-[11px] text-emerald-900 font-medium">
              Ready to Serve
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Grid3X3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-700">
              {occupiedTables}/{tables.length}
            </p>
            <p className="text-[11px] text-purple-900 font-medium">
              Tables Busy
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200">
          <CardContent className="p-4 text-center">
            <CalendarCheck className="h-5 w-5 text-cyan-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-cyan-700">{todayBookings}</p>
            <p className="text-[11px] text-cyan-900 font-medium">Checked In</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700">
              {formatCurrency(todayRevenue)}
            </p>
            <p className="text-[11px] text-amber-900 font-medium">Revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Orders Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-600" /> Live Order Feed
              </CardTitle>
              <Link href="/waiter/orders">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 text-xs h-7"
                >
                  View All ({activeOrders})
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-xl border hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      order.status === "pending"
                        ? "bg-orange-500"
                        : order.status === "preparing"
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  >
                    T{order.tableNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-charcoal">
                        {order.id}
                      </p>
                      <Badge
                        className={`text-[10px] ${
                          order.status === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : order.status === "preparing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted-custom mt-0.5">
                      {order.items
                        .map((i) => `${i.quantity}x ${i.name}`)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-charcoal">
                    {formatCurrency(order.total)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-text-muted-custom mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTime(
                      new Date(order.createdAt).toTimeString().slice(0, 5)
                    )}
                  </div>
                </div>
              </div>
            ))}
            {liveOrders.length === 0 && (
              <div className="text-center py-8 text-text-muted-custom">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No active orders right now</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Table Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-amber-600" /> Table Status
              </CardTitle>
              <Link href="/waiter/tables">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 text-xs h-7"
                >
                  Full Map
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {availableTables}
                </p>
                <p className="text-[11px] text-emerald-900 font-medium">
                  Available
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {occupiedTables}
                </p>
                <p className="text-[11px] text-blue-900 font-medium">
                  Occupied
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {reservedTables}
                </p>
                <p className="text-[11px] text-purple-900 font-medium">
                  Reserved
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {tables.filter((t) => t.status === "cleaning").length}
                </p>
                <p className="text-[11px] text-yellow-900 font-medium">
                  Cleaning
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted-custom">Capacity Usage</span>
                <span className="font-medium text-charcoal">
                  {tables.length > 0
                    ? Math.round((occupiedTables / tables.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  tables.length > 0
                    ? (occupiedTables / tables.length) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-text-muted-custom uppercase tracking-wide">
                Quick Actions
              </p>
              <Link href="/waiter/services" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-pearl/50 transition-colors border">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">
                      Service Requests
                    </p>
                  </div>
                  {pendingServices > 0 && (
                    <Badge className="bg-purple-600 text-white text-[10px]">
                      {pendingServices}
                    </Badge>
                  )}
                </div>
              </Link>
              <Link href="/waiter/bookings" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-pearl/50 transition-colors border">
                  <CalendarCheck className="h-4 w-4 text-cyan-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">
                      Today&apos;s Bookings
                    </p>
                  </div>
                  <Badge className="bg-cyan-600 text-white text-[10px]">
                    {todayBookings}
                  </Badge>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
