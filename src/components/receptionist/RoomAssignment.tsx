"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search,
  Filter,
  RefreshCw,
  BedDouble,
  Users,
  DollarSign,
  Building,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAvailableRooms } from "@/hooks/use-available-rooms";
import { useGuests } from "@/hooks/use-guests";
import RoomCard from "./RoomCard";
import { formatCurrency } from "@/lib/format";

export default function RoomAssignment() {
  const {
    rooms,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    assignRoom,
    refetch,
  } = useAvailableRooms();

  const { searchGuests } = useGuests();

  const displayRooms = rooms || [];

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestResults, setGuestResults] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState({
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    infants: 0,
    specialRequests: "",
    paymentMethod: "cash",
    paymentStatus: "pending" as "pending" | "paid",
    totalAmount: 0,
  });
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (guestSearch.length > 2) {
      searchGuests(guestSearch).then(setGuestResults);
    } else {
      setGuestResults([]);
    }
  }, [guestSearch, searchGuests]);

  const handleAssignRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowAssignDialog(true);
  };

  const handleAssignment = async () => {
    if (!selectedGuest || !selectedRoomId) {
      toast.error("Please select a guest and room");
      return;
    }

    if (!assignmentData.checkIn || !assignmentData.checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    try {
      setIsAssigning(true);
      
      await assignRoom({
        guestId: selectedGuest.id,
        roomId: selectedRoomId,
        ...assignmentData,
      });

      toast.success("Room assigned successfully!");
      setShowAssignDialog(false);
      resetAssignmentForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign room");
    } finally {
      setIsAssigning(false);
    }
  };

  const resetAssignmentForm = () => {
    setSelectedGuest(null);
    setSelectedRoomId("");
    setGuestSearch("");
    setGuestResults([]);
    setAssignmentData({
      checkIn: "",
      checkOut: "",
      adults: 1,
      children: 0,
      infants: 0,
      specialRequests: "",
      paymentMethod: "cash",
      paymentStatus: "pending",
      totalAmount: 0,
    });
  };

  const selectedRoom = rooms?.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (selectedRoom && assignmentData.checkIn && assignmentData.checkOut) {
      const checkIn = new Date(assignmentData.checkIn);
      const checkOut = new Date(assignmentData.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      setAssignmentData(prev => ({
        ...prev,
        totalAmount: nights * selectedRoom.price,
      }));
    }
  }, [selectedRoom, assignmentData.checkIn, assignmentData.checkOut]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Branch Rooms</h1>
          <p className="text-text-muted-custom">Manage room assignments for your branch</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters - only show if rooms exist */}
      {displayRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={filters.checkIn || ""}
                  onChange={(e) => updateFilters({ checkIn: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={filters.checkOut || ""}
                  onChange={(e) => updateFilters({ checkOut: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="roomType">Room Type</Label>
                <Select value={filters.roomType || "all"} onValueChange={(value) => updateFilters({ roomType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="executive_suite">Executive Suite</SelectItem>
                    <SelectItem value="presidential_suite">Presidential Suite</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="guests">Guests</Label>
                <Select value={filters.guests?.toString() || "1"} onValueChange={(value) => updateFilters({ guests: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="1 Guest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4">4 Guests</SelectItem>
                    <SelectItem value="5">5+ Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats - only show if rooms exist */}
      {stats && displayRooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-emerald" />
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.totalAvailable || 0}</p>
                  <p className="text-sm text-text-muted-custom">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.occupied || 0}</p>
                  <p className="text-sm text-text-muted-custom">Occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-charcoal">{stats.totalRooms || 0}</p>
                  <p className="text-sm text-text-muted-custom">Total Rooms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-2xl font-bold text-charcoal">{formatCurrency(stats.priceRange.avg || 0)}</p>
                  <p className="text-sm text-text-muted-custom">Avg. Price</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rooms Grid */}
      {!loading && !error && displayRooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onAssign={() => handleAssignRoom(room.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State - No Rooms */}
      {!loading && !error && displayRooms.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Building className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">No Rooms in Your Branch</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No rooms have been set up for your assigned branch yet. Only your branch manager can add rooms to your branch.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
              <h4 className="font-medium text-blue-800 mb-2">What you can do:</h4>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Contact your branch manager to add rooms</li>
                <li>• You can only see rooms from your assigned branch</li>
                <li>• Refresh to check for newly added rooms</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Rooms
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Room {selectedRoom?.number}</DialogTitle>
            <DialogDescription>
              Assign {selectedRoom?.type?.replace('_', ' ')} room to a guest with payment verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="guestSearch">Search Guest</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="guestSearch"
                  placeholder="Search by name, email, phone, or ID..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {guestResults.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  {guestResults.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedGuest?.id === guest.id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => {
                        setSelectedGuest(guest);
                        setGuestSearch(guest.name);
                        setGuestResults([]);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-sm text-gray-600">{guest.email}</p>
                          <p className="text-sm text-gray-600">{guest.phone}</p>
                        </div>
                        <Badge variant="outline">{guest.loyaltyTier}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedGuest && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Selected: {selectedGuest.name}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={assignmentData.checkIn}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, checkIn: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={assignmentData.checkOut}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, checkOut: e.target.value }))}
                  min={assignmentData.checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="adults">Adults</Label>
                <Select value={assignmentData.adults.toString()} onValueChange={(value) => setAssignmentData(prev => ({ ...prev, adults: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="children">Children</Label>
                <Select value={assignmentData.children.toString()} onValueChange={(value) => setAssignmentData(prev => ({ ...prev, children: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0,1,2,3,4].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="infants">Infants</Label>
                <Select value={assignmentData.infants.toString()} onValueChange={(value) => setAssignmentData(prev => ({ ...prev, infants: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0,1,2].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={assignmentData.paymentMethod} onValueChange={(value) => setAssignmentData(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={assignmentData.paymentStatus} onValueChange={(value: "pending" | "paid") => setAssignmentData(prev => ({ ...prev, paymentStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {assignmentData.totalAmount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(assignmentData.totalAmount)}
                  </span>
                </div>
                {selectedRoom && assignmentData.checkIn && assignmentData.checkOut && (
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.ceil((new Date(assignmentData.checkOut).getTime() - new Date(assignmentData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights × {formatCurrency(selectedRoom.price)}/night
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Input
                id="specialRequests"
                placeholder="Any special requests or notes..."
                value={assignmentData.specialRequests}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, specialRequests: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAssignDialog(false);
                  resetAssignmentForm();
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignment}
                disabled={!selectedGuest || !assignmentData.checkIn || !assignmentData.checkOut || isAssigning}
                className="flex-1"
              >
                {isAssigning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assign Room
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}