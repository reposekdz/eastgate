"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, MapPin, CreditCard, Star, Wifi, Coffee, Utensils, Shield, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface Room {
  id: string;
  type: string;
  price: number;
  capacity: number;
  size: string;
  amenities: string[];
  image: string;
  available: boolean;
}

export default function BookPage() {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
    specialRequests: "",
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [nights, setNights] = useState(0);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/rooms?status=available");
      const data = await res.json();
      if (data.success) {
        const transformedRooms = data.data.rooms.map((room: any) => ({
          id: room.id,
          type: room.type,
          price: room.price,
          capacity: room.maxOccupancy || 2,
          size: `${Math.floor(room.price / 10000)}m²`,
          amenities: ["Free WiFi", "Air Conditioning", "Private Bathroom", "TV"],
          image: room.imageUrl || `/images/rooms/${room.type.toLowerCase().replace(" ", "-")}.jpg`,
          available: room.status === "available",
        }));
        setRooms(transformedRooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays > 0 ? diffDays : 0);
    }
  }, [formData.checkIn, formData.checkOut]);

  useEffect(() => {
    if (selectedRoom && nights > 0) {
      setTotalAmount(selectedRoom.price * nights);
    }
  }, [selectedRoom, nights]);

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          roomType: selectedRoom.type,
          roomId: selectedRoom.id,
          totalAmount,
          nights,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("🎉 Booking confirmed! Check your email for details.");
        setStep(3);
      } else {
        toast.error(data.error || "Booking failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    }
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.includes("WiFi")) return <Wifi className="h-4 w-4" />;
    if (amenity.includes("Service")) return <Utensils className="h-4 w-4" />;
    if (amenity.includes("TV")) return <Coffee className="h-4 w-4" />;
    if (amenity.includes("Bar")) return <Coffee className="h-4 w-4" />;
    if (amenity.includes("Balcony")) return <MapPin className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-pearl flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="h-20 w-20 bg-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h1 className="heading-lg text-charcoal mb-4">Booking Confirmed!</h1>
              <p className="body-lg text-text-muted-custom mb-6">
                Thank you {formData.name}! Your reservation at EastGate Hotel has been confirmed.
              </p>
              <div className="bg-emerald-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Room:</strong> {selectedRoom?.type}</div>
                  <div><strong>Guests:</strong> {formData.guests}</div>
                  <div><strong>Check-in:</strong> {formData.checkIn}</div>
                  <div><strong>Check-out:</strong> {formData.checkOut}</div>
                  <div><strong>Nights:</strong> {nights}</div>
                  <div><strong>Total:</strong> {formatCurrency(totalAmount)}</div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.href = "/"} variant="outline">
                  Back to Home
                </Button>
                <Button onClick={() => window.print()} className="bg-emerald hover:bg-emerald-dark">
                  Print Confirmation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl to-white">
      <div className="bg-gradient-to-r from-emerald to-emerald-dark text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Book Your Perfect Stay</h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">Experience luxury and comfort at EastGate Hotel Rwanda</p>
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Safe & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <span>5-Star Service</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-emerald' : 'text-gray-400'}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Select Room</span>
            </div>
            <div className={`h-1 w-16 mx-4 ${step >= 2 ? 'bg-emerald' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-emerald' : 'text-gray-400'}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Guest Details</span>
            </div>
            <div className={`h-1 w-16 mx-4 ${step >= 3 ? 'bg-emerald' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-emerald' : 'text-gray-400'}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-emerald text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="heading-lg text-charcoal mb-4">Choose Your Room</h2>
              <p className="body-lg text-text-muted-custom">Select from our premium accommodations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {loadingRooms ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald mx-auto"></div>
                  <p className="mt-4 text-text-muted-custom">Loading available rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-text-muted-custom">No rooms available</p>
                </div>
              ) : (
                rooms.map((room: Room) => (
                  <Card key={room.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={() => handleRoomSelect(room)}>
                    <div className="relative h-64 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <div className="text-6xl opacity-20">🏨</div>
                      {room.available && (
                        <Badge className="absolute top-4 right-4 bg-emerald text-white">
                          Available
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-charcoal mb-2">{room.type}</h3>
                          <div className="flex items-center gap-4 text-sm text-text-muted-custom">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Up to {room.capacity} guests
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {room.size}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald">{formatCurrency(room.price)}</div>
                          <div className="text-sm text-text-muted-custom">per night</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-charcoal mb-2">Amenities</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {room.amenities.slice(0, 6).map((amenity, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-text-muted-custom">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-6 bg-emerald hover:bg-emerald-dark text-white group-hover:bg-emerald-dark transition-colors">
                        Select This Room
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedRoom && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald" />
                      Guest Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            className="mt-1"
                            placeholder="+250 788 000 000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guests">Number of Guests</Label>
                          <Select value={formData.guests} onValueChange={(value) => setFormData({ ...formData, guests: value })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: selectedRoom.capacity }, (_, i) => i + 1).map((n) => (
                                <SelectItem key={n} value={n.toString()}>{n} Guest{n > 1 ? 's' : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="checkIn">Check-in Date *</Label>
                          <Input
                            id="checkIn"
                            type="date"
                            value={formData.checkIn}
                            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                            required
                            className="mt-1"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label htmlFor="checkOut">Check-out Date *</Label>
                          <Input
                            id="checkOut"
                            type="date"
                            value={formData.checkOut}
                            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                            required
                            className="mt-1"
                            min={formData.checkIn || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="specialRequests">Special Requests</Label>
                        <Textarea
                          id="specialRequests"
                          value={formData.specialRequests}
                          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                          className="mt-1"
                          placeholder="Any special requirements or requests..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                          Back to Rooms
                        </Button>
                        <Button type="submit" className="flex-1 bg-emerald hover:bg-emerald-dark text-white">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Confirm Booking
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Booking Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-charcoal">{selectedRoom.type}</h4>
                      <p className="text-sm text-text-muted-custom">{selectedRoom.size} • Up to {selectedRoom.capacity} guests</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span>{formData.checkIn || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span>{formData.checkOut || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nights:</span>
                        <span>{nights > 0 ? nights : 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span>{formData.guests}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Room Rate:</span>
                        <span>{formatCurrency(selectedRoom.price)}/night</span>
                      </div>
                      {nights > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{nights} nights:</span>
                          <span>{formatCurrency(selectedRoom.price * nights)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold text-emerald">
                      <span>Total:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <div className="text-xs text-text-muted-custom">
                      * Includes taxes and service charges
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}