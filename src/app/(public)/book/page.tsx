"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { format, differenceInDays, addDays } from "date-fns";
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  BedDouble,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Clock,
  UtensilsCrossed,
  ShoppingCart,
  X,
  Search,
  CreditCard,
  Smartphone,
  Building2,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Star,
  BadgeCheck,
  Lock,
  Mail,
  Phone,
  Globe,
  Filter,
  Loader2,
  CheckCircle2,
  Plane,
  Moon,
  Sun,
  Bed,
  Palmtree,
  Heart,
  Download,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MenuOrderDialog, type CartItem } from "@/components/MenuOrderDialog";
import CountrySelect from "@/components/shared/CountrySelect";
import { useCurrency } from "@/components/shared/CurrencySelector";
import { formatWithCurrency } from "@/lib/currencies";

// Room type details mapping with images
const roomTypeDetails: Record<string, {
  price: number;
  capacity: number;
  image: string;
  amenities: string[];
  size: string;
  beds: string;
  floor: string;
}> = {
  standard: {
    price: 234000,
    capacity: 2,
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "TV", "Air Conditioning", "Room Service", "Mini Fridge"],
    size: "28 m²",
    beds: "1 Queen Bed",
    floor: "1-2",
  },
  deluxe: {
    price: 325000,
    capacity: 3,
    image: "https://images.pexels.com/photos/34672504/pexels-photo-34672504.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "Smart TV", "Mini Bar", "Balcony", "Bathrobes", "Room Service"],
    size: "38 m²",
    beds: "1 King Bed",
    floor: "2-3",
  },
  suite: {
    price: 550000,
    capacity: 4,
    image: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "Smart TV", "Mini Bar", "Living Room", "Jacuzzi", "Butler Service"],
    size: "65 m²",
    beds: "2 King Beds",
    floor: "3-5",
  },
  presidential_suite: {
    price: 1200000,
    capacity: 6,
    image: "https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Private Pool", "Personal Chef", "Limousine", "Spa", "Cinema", "Helipad Access"],
    size: "250 m²",
    beds: "3 King Beds",
    floor: "Top Floor",
  },
};

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  status: string;
  floor: number;
  description?: string;
  imageUrl?: string;
  branchId: string;
}

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { currency, setCurrency } = useCurrency();
  
  // State
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(searchParams.get("room"));
  const [selectedBranch, setSelectedBranch] = useState(searchParams.get("branch") || "kigali-main");
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    searchParams.get("checkin") ? new Date(searchParams.get("checkin")!) : addDays(new Date(), 1)
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    searchParams.get("checkout") ? new Date(searchParams.get("checkout")!) : addDays(new Date(), 3)
  );
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCountry, setGuestCountry] = useState("RW");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe_card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState("");

  // Fetch rooms from API with availability checking
  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoadingRooms(true);
        const params = new URLSearchParams({
          branchId: selectedBranch,
          status: "available",
        });
        if (checkIn) params.append("checkIn", checkIn.toISOString());
        if (checkOut) params.append("checkOut", checkOut.toISOString());
        
        const res = await fetch(`/api/public/rooms?${params}`);
        const data = await res.json();
        if (data.rooms) {
          setRooms(data.rooms);
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        toast.error("Failed to load rooms");
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [selectedBranch, checkIn, checkOut]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    if (roomFilter === "all") return rooms;
    return rooms.filter(room => room.type === roomFilter);
  }, [rooms, roomFilter]);

  // Calculate nights
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  // Get selected room details
  const selectedRoomDetails = useMemo(() => {
    if (!selectedRoom) return null;
    const room = rooms.find(r => r.id === selectedRoom);
    if (!room) return null;
    
    const typeDetails = roomTypeDetails[room.type] || roomTypeDetails.standard;
    return {
      ...room,
      ...typeDetails,
      imageUrl: room.imageUrl || typeDetails.image,
    };
  }, [selectedRoom, rooms]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedRoomDetails || nights <= 0) return 0;
    return selectedRoomDetails.price * nights;
  }, [selectedRoomDetails, nights]);

  // Handle booking with payment
  const handleBooking = async () => {
    if (!selectedRoomDetails || !checkIn || !checkOut || !guestName || !guestEmail || !guestPhone) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create booking
      const bookingData = {
        roomId: selectedRoom,
        roomNumber: selectedRoomDetails.number,
        roomType: selectedRoomDetails.type,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        adults,
        children,
        guestName,
        guestEmail,
        guestPhone,
        guestCountry,
        specialRequests,
        totalAmount: totalPrice,
        paymentMethod,
        branchId: selectedBranch,
      };

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const bookingResult = await bookingRes.json();

      if (!bookingResult.success || !bookingResult.booking) {
        toast.error(bookingResult.error || "Booking failed");
        setIsProcessing(false);
        return;
      }

      const booking = bookingResult.booking;

      // Step 2: Create payment intent
      const paymentData = {
        bookingId: booking.id,
        amount: totalPrice,
        currency: "RWF",
        paymentMethod,
        gateway: paymentMethod === "stripe_card" ? "stripe" : paymentMethod === "flutterwave" ? "flutterwave" : "paypal",
        branchId: selectedBranch,
      };

      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const paymentResult = await paymentRes.json();

      if (!paymentResult.success) {
        toast.error("Payment initialization failed");
        setIsProcessing(false);
        return;
      }

      // Step 3: Process payment based on gateway
      const gateway = paymentData.gateway;
      
      if (gateway === "stripe") {
        await processStripePayment(paymentResult.clientSecret, booking.id);
      } else if (gateway === "flutterwave") {
        window.location.href = paymentResult.clientSecret;
      } else if (gateway === "paypal") {
        window.location.href = `https://www.paypal.com/checkoutnow?token=${paymentResult.clientSecret}`;
      }

    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to process booking");
      setIsProcessing(false);
    }
  };

  // Process Stripe payment
  const processStripePayment = async (clientSecret: string, bookingId: string) => {
    try {
      // In production, use Stripe Elements
      // For now, simulate successful payment
      const paymentUpdateRes = await fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          status: "completed",
          transactionId: `txn_${Date.now()}`,
        }),
      });

      const result = await paymentUpdateRes.json();
      
      if (result.success) {
        setBookingId(bookingId);
        setBookingSuccess(true);
        toast.success("Payment successful!");
      }
    } catch (error) {
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Success view
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">Booking Confirmed!</h2>
          <p className="text-text-muted-custom mb-4">
            Your reservation has been successfully processed.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-text-muted-custom">Booking ID</p>
            <p className="text-xl font-mono font-bold text-charcoal">{bookingId}</p>
          </div>
          <div className="space-y-2 text-left text-sm mb-6">
            <p><span className="font-semibold">Room:</span> {selectedRoomDetails?.type}</p>
            <p><span className="font-semibold">Check-in:</span> {checkIn?.toLocaleDateString()}</p>
            <p><span className="font-semibold">Check-out:</span> {checkOut?.toLocaleDateString()}</p>
            <p><span className="font-semibold">Total:</span> {formatCurrency(totalPrice)}</p>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Return Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-charcoal via-slate-800 to-charcoal text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Your Stay</h1>
          <p className="text-slate-300">Experience luxury at EastGate Hotel</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: "Select Room" },
            { num: 2, label: "Guest Details" },
            { num: 3, label: "Payment" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                  step >= s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={cn(
                  "mx-2 text-sm hidden sm:inline",
                  step >= s.num ? "text-charcoal font-medium" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
              {i < 2 && <ArrowRight className="w-4 h-4 mx-2 text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Branch & Date Selection */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">Select Branch</Label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kigali-main">Kigali Main</SelectItem>
                            <SelectItem value="ngoma">Ngoma</SelectItem>
                            <SelectItem value="kirehe">Kirehe</SelectItem>
                            <SelectItem value="gatsibo">Gatsibo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Room Type</Label>
                        <Select value={roomFilter} onValueChange={setRoomFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All rooms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Rooms</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="deluxe">Deluxe</SelectItem>
                            <SelectItem value="suite">Suite</SelectItem>
                            <SelectItem value="presidential_suite">Presidential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Check-in</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkIn ? format(checkIn, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={checkIn}
                              onSelect={(date) => {
                                setCheckIn(date);
                                if (date && checkOut && date >= checkOut) {
                                  setCheckOut(addDays(date, 1));
                                }
                              }}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="mb-2 block">Check-out</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkOut ? format(checkOut, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={checkOut}
                              onSelect={setCheckOut}
                              disabled={(date) => date <= (checkIn || new Date())}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rooms Grid */}
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-charcoal">
                    {loadingRooms ? "Loading rooms..." : `${filteredRooms.length} Rooms Available`}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => {
                    setLoadingRooms(true);
                    const params = new URLSearchParams({
                      branchId: selectedBranch,
                      status: "available",
                    });
                    if (checkIn) params.append("checkIn", checkIn.toISOString());
                    if (checkOut) params.append("checkOut", checkOut.toISOString());
                    fetch(`/api/public/rooms?${params}`)
                      .then(r => r.json())
                      .then(data => {
                        setRooms(data.rooms || []);
                        setLoadingRooms(false);
                        toast.success("Rooms refreshed");
                      })
                      .catch(() => {
                        setLoadingRooms(false);
                        toast.error("Failed to refresh rooms");
                      });
                  }}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingRooms ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {loadingRooms ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <Card className="p-8 text-center">
                    <BedDouble className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No rooms available for selected criteria</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredRooms.map((room) => {
                      const details = roomTypeDetails[room.type] || roomTypeDetails.standard;
                      const imageUrl = room.imageUrl || details.image;
                      
                      return (
                        <motion.div
                          key={room.id}
                          whileHover={{ y: -4 }}
                          className={cn(
                            "bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all",
                            selectedRoom === room.id
                              ? "ring-2 ring-emerald-600 shadow-lg"
                              : "hover:shadow-lg"
                          )}
                          onClick={() => setSelectedRoom(room.id)}
                        >
                          <div className="relative h-48">
                            <img
                              src={imageUrl}
                              alt={`Room ${room.number}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <Badge className="absolute top-3 right-3 bg-emerald-600">
                              {room.status}
                            </Badge>
                            <div className="absolute bottom-3 left-3 text-white">
                              <p className="text-sm opacity-80">Room {room.number}</p>
                              <p className="font-semibold capitalize">{room.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm text-slate-500">{details.size} • {details.beds}</p>
                                <div className="flex gap-1 mt-1">
                                  {details.amenities.slice(0, 3).map((a) => (
                                    <Badge key={a} variant="outline" className="text-xs">
                                      {a}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-emerald-600">
                                  {formatCurrency(room.price || details.price)}
                                </p>
                                <p className="text-xs text-slate-500">per night</p>
                              </div>
                            </div>
                            {selectedRoom === room.id && (
                              <div className="mt-3 pt-3 border-t">
                                <Button
                                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStep(2);
                                  }}
                                >
                                  Continue Booking
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Guest Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <Input
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+250 788 123 456"
                        />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <CountrySelect value={guestCountry} onChange={setGuestCountry} />
                      </div>
                    </div>
                    <div>
                      <Label>Special Requests</Label>
                      <Textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any special requirements..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setStep(3)}
                        disabled={!guestName || !guestEmail || !guestPhone}
                      >
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <RadioGroupItem value="stripe_card" id="stripe" />
                        <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-5 h-5" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <RadioGroupItem value="flutterwave" id="flutterwave" />
                        <Label htmlFor="flutterwave" className="flex items-center gap-2 cursor-pointer">
                          <Smartphone className="w-5 h-5" />
                          Mobile Money (Africa)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-5 h-5" />
                          PayPal
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Lock className="w-4 h-4" />
                        Secure payment powered by industry leaders
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Stripe</Badge>
                        <Badge variant="outline">PayPal</Badge>
                        <Badge variant="outline">Flutterwave</Badge>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleBooking}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Pay {formatCurrency(totalPrice)}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRoomDetails ? (
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={selectedRoomDetails.imageUrl}
                        alt={selectedRoomDetails.type}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{selectedRoomDetails.type.replace('_', ' ')}</h3>
                      <p className="text-sm text-slate-500">Room {selectedRoomDetails.number}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-in</span>
                        <span>{checkIn?.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-out</span>
                        <span>{checkOut?.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nights</span>
                        <span>{nights}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Guests</span>
                        <span>{adults} Adults, {children} Children</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{formatCurrency(selectedRoomDetails.price)} × {nights} nights</span>
                        <span>{formatCurrency(selectedRoomDetails.price * nights)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-emerald-600">{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">
                    Select a room to see summary
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
