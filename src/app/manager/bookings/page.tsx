"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatDate, getBookingStatusLabel, getRoomTypeLabel } from "@/lib/format";
import {
  CalendarCheck, Search, UserCheck, CalendarDays, DollarSign, Clock,
} from "lucide-react";

export default function ManagerBookingsPage() {
  const { user } = useAuthStore();
  const { getBookings } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "branch_manager";
  const allBookings = getBookings(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = allBookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const checkedInCount = allBookings.filter((b) => b.status === "checked_in").length;
  const confirmedCount = allBookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = allBookings.filter((b) => b.status === "pending").length;
  const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      checked_in: "bg-emerald-100 text-emerald-700",
      confirmed: "bg-blue-100 text-blue-700",
      pending: "bg-orange-100 text-orange-700",
      checked_out: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
      refunded: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Bookings Management</h1>
        <p className="body-sm text-text-muted-custom mt-1">View and manage all guest bookings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-11 w-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{checkedInCount}</p>
              <p className="text-xs text-emerald-600">Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-11 w-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{confirmedCount}</p>
              <p className="text-xs text-blue-600">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-11 w-11 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
              <p className="text-xs text-orange-600">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-11 w-11 bg-gold rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-5 w-5 text-charcoal" />
            </div>
            <div>
              <p className="text-xl font-bold text-gold-dark">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-text-muted-custom">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">All Bookings ({allBookings.length})</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-60 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={booking.guestAvatar} alt={booking.guestName} />
                          <AvatarFallback>{booking.guestName.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{booking.guestName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">Room {booking.roomNumber}</span>
                        <p className="text-xs text-text-muted-custom">{getRoomTypeLabel(booking.roomType)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(booking.checkIn)}</TableCell>
                    <TableCell className="text-sm">{formatDate(booking.checkOut)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(booking.status)}>
                        {getBookingStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{booking.paymentMethod.replace("_", " ")}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(booking.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
