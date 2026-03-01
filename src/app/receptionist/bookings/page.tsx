"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Calendar, User, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchBookings();
  }, [user?.branchId, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/bookings?branchId=${user?.branchId}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/receptionist/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "checked_in" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guest checked in successfully");
        fetchBookings();
      }
    } catch (error) {
      toast.error("Failed to check in guest");
    }
  };

  const filteredBookings = bookings.filter((b) =>
    b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.roomNumber.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <Button onClick={fetchBookings}>Refresh</Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{booking.guestName}</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Room {booking.roomNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {booking.checkIn} - {booking.checkOut}
                    </span>
                  </div>
                  <Badge>{booking.status}</Badge>
                </div>
                {booking.status === "confirmed" && (
                  <Button onClick={() => handleCheckIn(booking.id)} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
