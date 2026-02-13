"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/lib/store/auth-store";
import { staff, bookings, restaurantOrders, rooms, branches } from "@/lib/mock-data";
import { formatCurrency, getRoleLabel, formatDate } from "@/lib/format";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  BedDouble,
  UtensilsCrossed,
  UserCheck,
  Clock,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  CalendarCheck,
} from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const userBranchId = user?.branchId || "br-001";
  const userBranchName = user?.branchName || "Kigali Main";
  const isSuperManager = user?.role === "super_manager" || user?.role === "super_admin";

  // Branch-specific data
  const branchInfo = branches.find((b) => b.id === userBranchId);
  const branchStaff = staff.filter((s) => s.branchId === userBranchId);
  const branchBookings = bookings.filter((b) => b.branchId === userBranchId);
  const branchRooms = rooms.filter((r) => r.branchId === userBranchId);
  const branchOrders = restaurantOrders; // In real app, filter by branch

  // Statistics
  const totalRevenue = branchBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const activeStaff = branchStaff.filter((s) => s.status === "active").length;
  const occupiedRooms = branchRooms.filter((r) => r.status === "occupied").length;
  const occupancyRate = branchRooms.length > 0 ? (occupiedRooms / branchRooms.length) * 100 : 0;
  const restaurantRevenue = branchOrders.reduce((sum, o) => sum + o.total, 0);

  // Staff by department
  const staffByDepartment = branchStaff.reduce((acc, s) => {
    acc[s.department] = (acc[s.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent bookings
  const recentBookings = branchBookings.slice(0, 5);

  // Performance metrics
  const checkInsToday = branchBookings.filter(
    (b) => b.status === "checked_in" && b.checkIn === new Date().toISOString().split("T")[0]
  ).length;
  const activeOrders = branchOrders.filter((o) => o.status !== "served").length;

  return (
    <div className="min-h-screen bg-pearl/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 bg-emerald rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="heading-md text-charcoal">
                  {isSuperManager ? "All Branches Overview" : userBranchName}
                </h1>
                <p className="text-xs text-text-muted-custom">
                  {isSuperManager ? "Super Manager Dashboard" : "Branch Manager Dashboard"}
                </p>
              </div>
            </div>
            <p className="body-sm text-text-muted-custom">
              {isSuperManager
                ? "Monitor and manage all EastGate Hotel branches"
                : `Manage operations • ${branchInfo?.location}`}
            </p>
          </div>
          <Button className="bg-emerald hover:bg-emerald-dark text-white">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Full Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-emerald-600 text-white">+12.5%</Badge>
              </div>
              <p className="text-sm font-medium text-emerald-900 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-emerald-600 mt-2">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BedDouble className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-blue-600 text-white">{occupancyRate.toFixed(0)}%</Badge>
              </div>
              <p className="text-sm font-medium text-blue-900 mb-1">Occupancy Rate</p>
              <p className="text-2xl font-bold text-blue-700">
                {occupiedRooms}/{branchRooms.length}
              </p>
              <div className="mt-3">
                <Progress value={occupancyRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-purple-600 text-white">Active</Badge>
              </div>
              <p className="text-sm font-medium text-purple-900 mb-1">Team Members</p>
              <p className="text-2xl font-bold text-purple-700">
                {activeStaff}/{branchStaff.length}
              </p>
              <p className="text-xs text-purple-600 mt-2">Across all departments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-orange-600 text-white">{activeOrders} active</Badge>
              </div>
              <p className="text-sm font-medium text-orange-900 mb-1">Restaurant</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(restaurantRevenue)}
              </p>
              <p className="text-xs text-orange-600 mt-2">Today's revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Today's Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">Check-ins</p>
                        <p className="text-xs text-text-muted-custom">Completed today</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{checkInsToday}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        <UtensilsCrossed className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">Active Orders</p>
                        <p className="text-xs text-text-muted-custom">In restaurant</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-orange-700">{activeOrders}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <CalendarCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">Upcoming Bookings</p>
                        <p className="text-xs text-text-muted-custom">Next 7 days</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">
                      {branchBookings.filter((b) => b.status === "confirmed").length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-emerald" />
                    Staff by Department
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(staffByDepartment).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-text-muted-custom">
                        {dept.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald h-2 rounded-full"
                            style={{
                              width: `${(count / branchStaff.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-charcoal w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.guestName}</TableCell>
                          <TableCell>{booking.roomNumber}</TableCell>
                          <TableCell>{formatDate(booking.checkIn)}</TableCell>
                          <TableCell>{formatDate(booking.checkOut)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === "checked_in" ? "default" : "secondary"
                              }
                            >
                              {booking.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(booking.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team Members ({branchStaff.length})</CardTitle>
                  <Button className="bg-emerald hover:bg-emerald-dark text-white">
                    <Users className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchStaff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{member.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleLabel(member.role)}</TableCell>
                          <TableCell className="capitalize">
                            {member.department.replace("_", " ")}
                          </TableCell>
                          <TableCell>{member.shift}</TableCell>
                          <TableCell>
                            <Badge
                              variant={member.status === "active" ? "default" : "secondary"}
                            >
                              {member.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{member.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings ({branchBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branchBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                          <TableCell className="font-medium">{booking.guestName}</TableCell>
                          <TableCell>{booking.roomNumber}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === "checked_in" ? "default" : "secondary"
                              }
                            >
                              {booking.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(booking.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Revenue Target</p>
                      <p className="text-xs text-emerald-600">This month</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted-custom">Progress</span>
                      <span className="font-semibold text-emerald-700">78%</span>
                    </div>
                    <Progress value={78} className="h-3" />
                    <p className="text-xs text-emerald-600">
                      {formatCurrency(totalRevenue)} / {formatCurrency(totalRevenue * 1.28)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Guest Satisfaction</p>
                      <p className="text-xs text-blue-600">Average rating</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-700">4.8</span>
                      <span className="text-sm text-blue-600">/ 5.0</span>
                    </div>
                    <p className="text-xs text-blue-600">Based on 127 reviews</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Growth Rate</p>
                      <p className="text-xs text-purple-600">vs last month</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-purple-700">+12.5%</span>
                    </div>
                    <p className="text-xs text-purple-600">Revenue increased</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
