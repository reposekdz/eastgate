"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useManagerApi } from "@/hooks/use-manager-api";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  BedDouble,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function ManagerBookings() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  const { data, loading, get, patch } = useManagerApi("bookings");

  useEffect(() => {
    if (branchId) {
      loadBookings();
    }
  }, [branchId, statusFilter]);

  const loadBookings = () => {
    const params: any = { branchId };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    get(params);
  };

  const handleStatusChange = async (bookingId: string, status: string) => {
    try {
      await patch({ id: bookingId, status });
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      loadBookings();
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      await patch({
        id: bookingId,
        status: "CHECKED_IN",
        actualCheckIn: new Date().toISOString(),
      });
      toast.success("Guest checked in successfully");
      loadBookings();
    } catch (error) {
      toast.error("Failed to check in guest");
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      await patch({
        id: bookingId,
        status: "CHECKED_OUT",
        actualCheckOut: new Date().toISOString(),
      });
      toast.success("Guest checked out successfully");
      loadBookings();
    } catch (error) {
      toast.error("Failed to check out guest");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      CHECKED_IN: "bg-emerald-100 text-emerald-700",
      CHECKED_OUT: "bg-gray-100 text-gray-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Bookings Management</h1>
          <p className="text-sm text-text-muted-custom">
            {pagination.total || 0} total bookings
          </p>
        </div>
        <Button className="bg-emerald hover:bg-emerald-dark">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search by name, email, booking number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadBookings()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "CONFIRMED" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("CONFIRMED")}
              >
                Confirmed
              </Button>
              <Button
                variant={statusFilter === "CHECKED_IN" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("CHECKED_IN")}
              >
                Checked In
              </Button>
              <Button
                variant={statusFilter === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("PENDING")}
              >
                Pending
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={loadBookings}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking #</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald" />
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-text-muted-custom">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-text-muted-custom" />
                        <div>
                          <p className="font-medium">
                            {booking.guest?.firstName} {booking.guest?.lastName}
                          </p>
                          <p className="text-xs text-text-muted-custom">{booking.guest?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-text-muted-custom" />
                        {booking.room?.number}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(booking.checkInDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.checkOutDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{booking.nights}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(booking.finalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Guest Name</p>
                                    <p className="font-medium">
                                      {selectedBooking.guest?.firstName}{" "}
                                      {selectedBooking.guest?.lastName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Email</p>
                                    <p className="font-medium">{selectedBooking.guest?.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Phone</p>
                                    <p className="font-medium">{selectedBooking.guest?.phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Room</p>
                                    <p className="font-medium">{selectedBooking.room?.number}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Check In</p>
                                    <p className="font-medium">
                                      {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Check Out</p>
                                    <p className="font-medium">
                                      {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Total Amount</p>
                                    <p className="font-medium text-lg">
                                      {formatCurrency(selectedBooking.finalAmount)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Status</p>
                                    {getStatusBadge(selectedBooking.status)}
                                  </div>
                                </div>
                                {selectedBooking.specialRequests && (
                                  <div>
                                    <p className="text-sm text-text-muted-custom">Special Requests</p>
                                    <p className="font-medium">{selectedBooking.specialRequests}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {booking.status === "CONFIRMED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckIn(booking.id)}
                            className="text-emerald"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {booking.status === "CHECKED_IN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckOut(booking.id)}
                            className="text-blue-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {["PENDING", "CONFIRMED"].includes(booking.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted-custom">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => get({ branchId, page: String(pagination.page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => get({ branchId, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
