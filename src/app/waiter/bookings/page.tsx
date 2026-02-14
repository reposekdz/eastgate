"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatDate, getBookingStatusLabel } from "@/lib/format";
import {
  CalendarCheck,
  Search,
  BedDouble,
  UserCheck,
  Clock,
} from "lucide-react";

export default function WaiterBookingsPage() {
  const { user } = useAuthStore();
  const { getBookings } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "waiter";
  const bookings = getBookings(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.roomNumber.includes(searchTerm) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const checkedInCount = bookings.filter((b) => b.status === "checked_in").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "checked_in":
        return "bg-emerald-100 text-emerald-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "checked_out":
        return "bg-gray-100 text-gray-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Guest Bookings</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          View current bookings &bull; Read-only for waiters
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{checkedInCount}</p>
              <p className="text-xs text-emerald-900 font-medium">Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{confirmedCount}</p>
              <p className="text-xs text-blue-900 font-medium">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-600 rounded-xl flex items-center justify-center shadow">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
              <p className="text-xs text-orange-900 font-medium">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">All Bookings ({bookings.length})</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search guests, rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-60 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
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
                  <TableHead>Room</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead>Status</TableHead>
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
                          <AvatarFallback className="text-xs">
                            {booking.guestName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-charcoal">{booking.guestName}</p>
                          <p className="text-xs text-text-muted-custom">{booking.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BedDouble className="h-3 w-3 text-text-muted-custom" />
                        <span className="text-sm">{booking.roomNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(booking.checkIn)}</TableCell>
                    <TableCell className="text-sm">{formatDate(booking.checkOut)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getStatusBadgeColor(booking.status)}`}>
                        {getBookingStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {formatCurrency(booking.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-text-muted-custom">
                      No bookings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
