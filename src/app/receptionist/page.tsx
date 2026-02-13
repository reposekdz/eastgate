"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookings, staff, branches } from "@/lib/mock-data";
import { formatCurrency, formatDate, getBookingStatusLabel } from "@/lib/format";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  UserPlus,
  LogIn,
  LogOut,
  Search,
  Calendar,
  UserCheck,
  Building2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function ReceptionistDashboard() {
  const { user } = useAuthStore();
  const userBranchId = user?.branchId || "br-001";
  const userBranchName = user?.branchName || "Kigali Main";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkInName, setCheckInName] = useState("");
  const [checkInRoom, setCheckInRoom] = useState("");
  const [checkInEmail, setCheckInEmail] = useState("");
  const [checkInPhone, setCheckInPhone] = useState("");

  // Filter bookings by branch
  const branchBookings = bookings.filter((b) => b.branchId === userBranchId);
  
  const todayBookings = branchBookings.filter(
    (b) => b.checkIn === new Date().toISOString().split("T")[0] || b.status === "checked_in"
  );

  const filteredBookings = todayBookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.roomNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Branch stats
  const branchStaff = staff.filter((s) => s.branchId === userBranchId);
  const branchInfo = branches.find((b) => b.id === userBranchId);

  const handleCheckIn = (_bookingId: string) => {
    toast.success(`Guest checked in successfully to Room ${checkInRoom}`);
  };

  const handleCheckOut = (_bookingId: string, roomNumber: string) => {
    toast.success(`Guest checked out from Room ${roomNumber}`);
  };

  const handleWalkInCheckIn = () => {
    if (!checkInName || !checkInRoom || !checkInEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Walk-in guest ${checkInName} checked in to Room ${checkInRoom}`);
    setCheckInName("");
    setCheckInRoom("");
    setCheckInEmail("");
    setCheckInPhone("");
  };

  return (
    <div className="min-h-screen bg-pearl/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-emerald rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="heading-sm text-charcoal">{userBranchName}</h1>
                <p className="text-xs text-text-muted-custom">Reception Desk</p>
              </div>
            </div>
            <p className="body-sm text-text-muted-custom">
              Manage guest check-ins and check-outs • {branchInfo?.location}
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-emerald hover:bg-emerald-dark text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Walk-in Check-in
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Walk-in Guest Check-in</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Guest Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={checkInName}
                      onChange={(e) => setCheckInName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Room Number *</Label>
                    <Input
                      placeholder="101"
                      value={checkInRoom}
                      onChange={(e) => setCheckInRoom(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={checkInEmail}
                      onChange={(e) => setCheckInEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      placeholder="+250 788 000 000"
                      value={checkInPhone}
                      onChange={(e) => setCheckInPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleWalkInCheckIn}
                    className="w-full bg-emerald hover:bg-emerald-dark"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Check In Guest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Expected Check-ins</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {branchBookings.filter((b) => b.status === "confirmed").length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Today</p>
                </div>
                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LogIn className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-900">Checked In</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {branchBookings.filter((b) => b.status === "checked_in").length}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Active</p>
                </div>
                <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Expected Check-outs</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    {branchBookings.filter((b) => b.status === "checked_in" && b.checkOut === new Date().toISOString().split("T")[0]).length}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Today</p>
                </div>
                <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LogOut className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">Total Guests</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{todayBookings.length}</p>
                  <p className="text-xs text-purple-600 mt-1">Today</p>
                </div>
                <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">Branch Staff</p>
                  <p className="text-2xl font-bold text-gold-dark mt-1">{branchStaff.length}</p>
                  <p className="text-xs text-text-muted-custom mt-1">Active team</p>
                </div>
                <div className="h-12 w-12 bg-gold rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-charcoal" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Bookings</CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                  <Input
                    placeholder="Search guests or rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
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
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.guestName}</TableCell>
                      <TableCell>{booking.roomNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(booking.checkIn)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(booking.checkOut)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "checked_in"
                              ? "default"
                              : booking.status === "confirmed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {getBookingStatusLabel(booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(booking.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(booking.id)}
                            className="bg-emerald hover:bg-emerald-dark text-white"
                          >
                            <LogIn className="mr-1 h-3 w-3" />
                            Check In
                          </Button>
                        )}
                        {booking.status === "checked_in" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(booking.id, booking.roomNumber)}
                          >
                            <LogOut className="mr-1 h-3 w-3" />
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-text-muted-custom">
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
    </div>
  );
}
