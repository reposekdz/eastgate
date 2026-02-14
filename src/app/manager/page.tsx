"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  BedDouble,
  UtensilsCrossed,
  UserCheck,
  Activity,
  CalendarCheck,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const { getStaff, getBookings, getRooms, getOrders, getServiceRequests, getTables } = useBranchStore();
  
  const userRole = user?.role || "branch_manager";
  const branchId = user?.branchId || "br-001";
  const isSuperRole = userRole === "super_manager" || userRole === "super_admin";

  const branchStaff = getStaff(branchId, userRole);
  const branchBookings = getBookings(branchId, userRole);
  const branchRooms = getRooms(branchId, userRole);
  const branchOrders = getOrders(branchId, userRole);
  const serviceRequests = getServiceRequests(branchId, userRole);
  const tables = getTables(branchId, userRole);

  // Statistics
  const totalRevenue = branchBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const activeStaff = branchStaff.filter((s) => s.status === "active").length;
  const occupiedRooms = branchRooms.filter((r) => r.status === "occupied").length;
  const occupancyRate = branchRooms.length > 0 ? (occupiedRooms / branchRooms.length) * 100 : 0;
  const restaurantRevenue = branchOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingRequests = serviceRequests.filter((sr) => sr.status === "pending").length;
  const activeOrders = branchOrders.filter((o) => o.status !== "served").length;
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;

  const waiters = branchStaff.filter((s) => s.role === "waiter");
  const recentBookings = branchBookings.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-emerald rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="heading-md text-charcoal">
                {isSuperRole ? "All Branches" : user?.branchName}
              </h1>
              <p className="text-xs text-text-muted-custom">
                {isSuperRole ? "Super Manager Dashboard" : "Branch Manager Dashboard"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/manager/staff">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" /> Manage Staff
            </Button>
          </Link>
          <Link href="/manager/performance">
            <Button className="bg-emerald hover:bg-emerald-dark text-white" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" /> View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-emerald-600 text-white gap-1">
                <ArrowUpRight className="h-3 w-3" /> 12.5%
              </Badge>
            </div>
            <p className="text-sm font-medium text-emerald-900 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BedDouble className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-blue-600 text-white">{occupancyRate.toFixed(0)}%</Badge>
            </div>
            <p className="text-sm font-medium text-blue-900 mb-1">Occupancy</p>
            <p className="text-2xl font-bold text-blue-700">{occupiedRooms}/{branchRooms.length}</p>
            <Progress value={occupancyRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-purple-600 text-white">{activeStaff} active</Badge>
            </div>
            <p className="text-sm font-medium text-purple-900 mb-1">Team Members</p>
            <p className="text-2xl font-bold text-purple-700">{branchStaff.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-11 w-11 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-orange-600 text-white">{activeOrders} live</Badge>
            </div>
            <p className="text-sm font-medium text-orange-900 mb-1">Restaurant</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(restaurantRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">
                {branchBookings.filter((b) => b.status === "checked_in").length}
              </p>
              <p className="text-xs text-text-muted-custom">Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{pendingRequests}</p>
              <p className="text-xs text-text-muted-custom">Service Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{occupiedTables}/{tables.length}</p>
              <p className="text-xs text-text-muted-custom">Tables Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">4.8</p>
              <p className="text-xs text-text-muted-custom">Guest Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Waiters Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald" /> Waiters On Duty
              </CardTitle>
              <Link href="/manager/staff">
                <Button variant="ghost" size="sm" className="text-emerald text-xs h-7">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {waiters.map((waiter) => (
              <div key={waiter.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-pearl/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={waiter.avatar} alt={waiter.name} />
                  <AvatarFallback className="bg-emerald text-white text-xs">
                    {waiter.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{waiter.name}</p>
                  <p className="text-xs text-text-muted-custom">{waiter.shift} Shift</p>
                </div>
                <Badge variant={waiter.status === "active" ? "default" : "secondary"} className="text-[10px]">
                  {waiter.status === "active" ? "On Duty" : "Off"}
                </Badge>
              </div>
            ))}
            {waiters.length === 0 && (
              <p className="text-sm text-center text-text-muted-custom py-4">No waiters assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald" /> Recent Bookings
              </CardTitle>
              <Link href="/manager/bookings">
                <Button variant="ghost" size="sm" className="text-emerald text-xs h-7">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg border hover:border-emerald/30 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={booking.guestAvatar} alt={booking.guestName} />
                    <AvatarFallback>{booking.guestName.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-charcoal">{booking.guestName}</p>
                      <Badge variant="outline" className="text-[10px]">Room {booking.roomNumber}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-text-muted-custom" />
                      <p className="text-xs text-text-muted-custom">
                        {booking.checkIn} → {booking.checkOut}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-charcoal">{formatCurrency(booking.totalAmount)}</p>
                    <Badge
                      className="text-[10px] mt-1"
                      variant={booking.status === "checked_in" ? "default" : "secondary"}
                    >
                      {booking.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Orders + Service Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-orange-600" /> Live Orders
              </CardTitle>
              <Link href="/manager/orders">
                <Button variant="ghost" size="sm" className="text-emerald text-xs h-7">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {branchOrders.filter((o) => o.status !== "served").slice(0, 4).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-pearl/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    order.status === "pending" ? "bg-orange-500" :
                    order.status === "preparing" ? "bg-blue-500" : "bg-emerald-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-charcoal">Table {order.tableNumber}</p>
                    <p className="text-xs text-text-muted-custom">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    className={`text-[10px] ${
                      order.status === "pending" ? "bg-orange-100 text-orange-700" :
                      order.status === "preparing" ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {order.status}
                  </Badge>
                  <p className="text-xs font-semibold text-charcoal mt-1">{formatCurrency(order.total)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-600" /> Service Requests
              </CardTitle>
              <Link href="/manager/services">
                <Button variant="ghost" size="sm" className="text-emerald text-xs h-7">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceRequests.filter((sr) => sr.status !== "completed").slice(0, 4).map((sr) => (
              <div key={sr.id} className="flex items-center justify-between p-3 rounded-lg bg-pearl/50">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    sr.priority === "urgent" ? "bg-red-500" :
                    sr.priority === "high" ? "bg-orange-500" :
                    sr.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-charcoal">{sr.guestName} - Room {sr.roomNumber}</p>
                    <p className="text-xs text-text-muted-custom">{sr.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    sr.priority === "urgent" ? "border-red-300 text-red-700" :
                    sr.priority === "high" ? "border-orange-300 text-orange-700" :
                    "border-gray-300"
                  }`}
                >
                  {sr.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
