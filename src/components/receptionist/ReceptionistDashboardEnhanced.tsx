"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  BedDouble,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  CreditCard,
} from "lucide-react";

export default function ReceptionistDashboardEnhanced() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const branchId = "br-001";

  const loadData = async () => {
    try {
      const res = await fetch(`/api/receptionist/dashboard?branchId=${branchId}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const processPayment = async () => {
    if (!selectedBooking || !paymentAmount) return;

    try {
      await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          branchId,
          bookingId: selectedBooking.id,
          description: `Payment for booking ${selectedBooking.bookingNumber}`,
        }),
      });
      toast.success("Payment processed successfully");
      setSelectedBooking(null);
      setPaymentAmount("");
      loadData();
    } catch (error) {
      toast.error("Payment failed");
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await fetch("/api/manager/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status,
          ...(status === "CHECKED_IN" && { actualCheckIn: new Date().toISOString() }),
          ...(status === "CHECKED_OUT" && { actualCheckOut: new Date().toISOString() }),
        }),
      });
      toast.success(`Booking ${status.toLowerCase()}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update booking");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const rooms = data?.rooms || [];
  const bookings = data?.bookings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reception Dashboard</h1>
          <p className="text-sm text-text-muted-custom">Guest & room management</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <BedDouble className="h-6 w-6 text-emerald mb-2" />
            <p className="text-2xl font-bold">{metrics.available}</p>
            <p className="text-xs text-text-muted-custom">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <BedDouble className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.occupied}</p>
            <p className="text-xs text-text-muted-custom">Occupied</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <BedDouble className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.cleaning}</p>
            <p className="text-xs text-text-muted-custom">Cleaning</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <CheckCircle className="h-6 w-6 text-emerald mb-2" />
            <p className="text-2xl font-bold">{metrics.expectedCheckIns}</p>
            <p className="text-xs text-text-muted-custom">Check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <XCircle className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{metrics.expectedCheckOuts}</p>
            <p className="text-xs text-text-muted-custom">Check-outs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-6 w-6 text-purple-500 mb-2" />
            <p className="text-xl font-bold">{formatCurrency(metrics.todayRevenue || 0)}</p>
            <p className="text-xs text-text-muted-custom">Today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Room Status Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {rooms.map((room: any) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg text-center cursor-pointer transition-all hover:scale-105 ${
                    room.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-700"
                      : room.status === "OCCUPIED"
                      ? "bg-blue-100 text-blue-700"
                      : room.status === "CLEANING"
                      ? "bg-yellow-100 text-yellow-700"
                      : room.status === "MAINTENANCE"
                      ? "bg-red-100 text-red-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  <p className="font-bold">{room.number}</p>
                  <p className="text-xs">{room.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bookings.slice(0, 5).map((booking: any) => (
              <div key={booking.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {booking.guest?.firstName} {booking.guest?.lastName}
                  </span>
                  <Badge
                    className={
                      booking.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-700"
                        : booking.status === "CHECKED_IN"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted-custom">Room {booking.room?.number}</p>
                <div className="flex gap-2">
                  {booking.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateBookingStatus(booking.id, "CHECKED_IN")}
                    >
                      Check In
                    </Button>
                  )}
                  {booking.status === "CHECKED_IN" && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Process Payment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-text-muted-custom">Guest</p>
                              <p className="font-semibold">
                                {selectedBooking?.guest?.firstName} {selectedBooking?.guest?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-text-muted-custom">Total Amount</p>
                              <p className="text-2xl font-bold">
                                {formatCurrency(selectedBooking?.finalAmount || 0)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Amount</label>
                              <Input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Payment Method</label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH">Cash</SelectItem>
                                  <SelectItem value="VISA">Visa</SelectItem>
                                  <SelectItem value="MASTERCARD">Mastercard</SelectItem>
                                  <SelectItem value="MTN_MOBILE">MTN Mobile Money</SelectItem>
                                  <SelectItem value="AIRTEL_MONEY">Airtel Money</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button className="w-full" onClick={processPayment}>
                              Process Payment
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingStatus(booking.id, "CHECKED_OUT")}
                      >
                        Check Out
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
