"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Phone, Mail, UserPlus, Users, Bed } from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries";

export default function GuestsPage() {
  const { user } = useAuthStore();
  const [guests, setGuests] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [guestData, setGuestData] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    nationality: "Rwanda",
    dateOfBirth: "",
    address: "",
  });
  
  const [assignmentData, setAssignmentData] = useState({
    roomId: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    specialRequests: "",
  });

  useEffect(() => {
    fetchGuests();
    fetchRooms();
  }, [user?.branchId]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guests?branchId=${user?.branchId}`);
      const data = await res.json();
      if (data.success) {
        setGuests(data.data.guests || []);
      }
    } catch (error) {
      toast.error("Failed to fetch guests");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const checkInDate = assignmentData.checkIn;
      const checkOutDate = assignmentData.checkOut;
      
      let url = `/api/rooms/availability?branchId=${user?.branchId}`;
      if (checkInDate && checkOutDate) {
        url += `&checkIn=${checkInDate}&checkOut=${checkOutDate}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRooms(data.data.rooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch rooms");
    }
  };

  const handleRegisterGuest = async () => {
    if (!guestData.name || !guestData.email || !guestData.phone || !guestData.idNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsRegistering(true);
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(guestData),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Guest registered successfully!");
        setShowRegisterDialog(false);
        setGuestData({
          name: "",
          email: "",
          phone: "",
          idNumber: "",
          nationality: "Rwanda",
          dateOfBirth: "",
          address: "",
        });
        fetchGuests();
      } else {
        toast.error(data.message || "Failed to register guest");
      }
    } catch (error) {
      toast.error("Failed to register guest");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteGuest = async (guestId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} deleted successfully`);
        fetchGuests();
      } else {
        toast.error(data.message || "Failed to delete guest");
      }
    } catch (error) {
      toast.error("Failed to delete guest");
    }
  };

  const handleAssignRoom = async () => {
    if (!assignmentData.roomId || !assignmentData.checkIn || !assignmentData.checkOut) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsAssigning(true);
      const res = await fetch(`/api/guests/${selectedGuest.id}/assign-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(assignmentData),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Room assigned to ${selectedGuest.name} successfully!`);
        setShowAssignDialog(false);
        setSelectedGuest(null);
        setAssignmentData({
          roomId: "",
          checkIn: "",
          checkOut: "",
          adults: 1,
          children: 0,
          specialRequests: "",
        });
        fetchGuests();
        fetchRooms();
      } else {
        toast.error(data.message || "Failed to assign room");
      }
    } catch (error) {
      toast.error("Failed to assign room");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredGuests = guests.filter((g) =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone?.includes(searchTerm) ||
    g.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Guest Registry</h1>
          <p className="text-muted-foreground">Manage guest registrations and room assignments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Register New Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Guest</DialogTitle>
                <DialogDescription>Add a new guest to the registry</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={guestData.name}
                    onChange={(e) => setGuestData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestData.email}
                    onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={guestData.phone}
                    onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={guestData.idNumber}
                    onChange={(e) => setGuestData(prev => ({ ...prev, idNumber: e.target.value }))}
                    placeholder="Enter ID number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Select value={guestData.nationality} onValueChange={(value) => setGuestData(prev => ({ ...prev, nationality: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowRegisterDialog(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegisterGuest}
                    disabled={isRegistering}
                    className="flex-1"
                  >
                    {isRegistering ? "Registering..." : "Register Guest"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchGuests} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guests by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGuests.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              {searchTerm ? "No guests found" : "No guests registered"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No guests match your search for "${searchTerm}".`
                : "No guests have been registered yet. Start by registering your first guest."
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowRegisterDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Register First Guest
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{guest.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {guest.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {guest.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {guest.idNumber}
                    </span>
                    <span className="text-sm text-gray-600">
                      {guest.nationality}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={guest.loyaltyTier === 'gold' ? 'default' : 'secondary'}>
                      {guest.loyaltyTier} Member
                    </Badge>
                    {guest.totalSpent > 0 && (
                      <Badge variant="outline">
                        Spent: RWF {guest.totalSpent.toLocaleString()}
                      </Badge>
                    )}
                    {guest._count?.bookings > 0 && (
                      <Badge variant="outline">
                        {guest._count.bookings} Bookings
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedGuest(guest);
                      setShowAssignDialog(true);
                    }}
                  >
                    <Bed className="h-4 w-4 mr-1" />
                    Assign Room
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteGuest(guest.id, guest.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Room Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Room to {selectedGuest?.name}</DialogTitle>
            <DialogDescription>
              Select dates first, then choose from available rooms
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={assignmentData.checkIn}
                  onChange={(e) => {
                    setAssignmentData(prev => ({ ...prev, checkIn: e.target.value, roomId: "" }));
                    if (e.target.value && assignmentData.checkOut) {
                      setTimeout(fetchRooms, 100);
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={assignmentData.checkOut}
                  onChange={(e) => {
                    setAssignmentData(prev => ({ ...prev, checkOut: e.target.value, roomId: "" }));
                    if (assignmentData.checkIn && e.target.value) {
                      setTimeout(fetchRooms, 100);
                    }
                  }}
                  min={assignmentData.checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="room">Available Rooms *</Label>
              <Select 
                value={assignmentData.roomId} 
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, roomId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select available room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.length === 0 ? (
                    <SelectItem value="no-rooms" disabled>
                      {assignmentData.checkIn && assignmentData.checkOut 
                        ? "No rooms available for selected dates" 
                        : "Please select dates first"
                      }
                    </SelectItem>
                  ) : (
                    rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.number} - {room.type} - Floor {room.floor} (RWF {room.price.toLocaleString()}/night)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {assignmentData.checkIn && assignmentData.checkOut && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rooms.length} available rooms for {assignmentData.checkIn} to {assignmentData.checkOut}
                </p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowAssignDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignRoom}
                disabled={isAssigning || !assignmentData.roomId}
                className="flex-1"
              >
                {isAssigning ? "Assigning..." : "Assign Room"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}