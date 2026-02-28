"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect, Suspense } from "react";
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
  Eye,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MenuOrderDialog, type CartItem } from "@/components/MenuOrderDialog";
import CountrySelect from "@/components/shared/CountrySelect";
import { loadStripe } from "@stripe/stripe-js";
import { useCurrency } from "@/components/shared/CurrencySelector";
import { formatWithCurrency } from "@/lib/currencies";

import RoomViewModal from "@/components/booking/RoomViewModal";

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
  maxOccupancy?: number;
  size?: number;
  bedType?: string;
  view?: string;
  branch?: {
    id: string;
    name: string;
    location?: string;
  };
}

function BookContent() {
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
  const [displayedRoomsCount, setDisplayedRoomsCount] = useState(9);
  const [viewingRoomImages, setViewingRoomImages] = useState<Room | null>(null);
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
          branchId: selectedBranch || "br-kigali-main",
          status: "available",
          limit: "50",
        });

        const res = await fetch(`/api/public/rooms?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        if (data.success && data.data?.rooms) {
          setRooms(data.data.rooms);
        } else if (data.rooms) {
          setRooms(data.rooms);
        } else {
          setRooms([]);
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        toast.error("Failed to load rooms. Please try again.");
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

  const displayedRooms = filteredRooms.slice(0, displayedRoomsCount);
  const hasMore = displayedRoomsCount < filteredRooms.length;

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
        method: paymentMethod,
        email: guestEmail,
        fullName: guestName,
        description: `Booking ${booking.bookingRef} for ${selectedRoomDetails?.type} room`,
        branchId: selectedBranch,
      };

      const paymentRes = await fetch("/api/payments/public", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!paymentRes.ok) {
        throw new Error(`Payment API error: ${paymentRes.status}`);
      }

      const paymentResult = await paymentRes.json();

      if (!paymentResult.success) {
        toast.error(paymentResult.error || "Payment initialization failed");
        setIsProcessing(false);
        return;
      }

      // Step 3: Process payment based on gateway
      if (paymentMethod.includes("stripe") && paymentResult.clientSecret) {
        // Redirect to Stripe checkout
        const stripe = await loadStripe(paymentResult.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (!stripe) {
          toast.error("Stripe failed to load");
          setIsProcessing(false);
          return;
        }

        const { error } = await stripe.confirmPayment({
          clientSecret: paymentResult.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/payment/success?bookingId=${booking.id}`,
          },
        });

        if (error) {
          toast.error(error.message || "Payment failed");
          setIsProcessing(false);
        }
      } else if (paymentMethod.includes("paypal") && paymentResult.approvalUrl) {
        window.location.href = paymentResult.approvalUrl;
      } else if (paymentMethod.includes("flutterwave") && paymentResult.paymentUrl) {
        window.location.href = paymentResult.paymentUrl;
      } else {
        setBookingId(booking.id);
        setBookingSuccess(true);
        toast.success("Booking created! Awaiting payment confirmation.");
        setIsProcessing(false);
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
      const paymentUpdateRes = await fetch("/api/payments/public", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: bookingId,
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-3">Booking Confirmed!</h2>
            <p className="text-lg text-slate-600">
              Your reservation has been successfully processed. We've sent a confirmation email to <span className="font-semibold text-emerald-600">{guestEmail}</span>
            </p>
          </motion.div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500 font-medium">Booking Reference</p>
              <Badge className="bg-emerald-600 text-white px-4 py-1.5 text-base">
                <BadgeCheck className="w-4 h-4 mr-1" />
                Confirmed
              </Badge>
            </div>
            <p className="text-3xl font-mono font-bold text-charcoal mb-6 tracking-wider">{bookingId}</p>
            
            <Separator className="my-4" />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BedDouble className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Room Type</p>
                    <p className="font-semibold text-charcoal capitalize">{selectedRoomDetails?.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Guests</p>
                    <p className="font-semibold text-charcoal">{adults} Adults, {children} Children</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Check-in</p>
                    <p className="font-semibold text-charcoal">{checkIn?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Check-out</p>
                    <p className="font-semibold text-charcoal">{checkOut?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Total Amount Paid</span>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPrice)}</span>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-2 gap-4 mb-6"
          >
            <Button
              variant="outline"
              className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-6 rounded-xl font-semibold"
              onClick={() => window.print()}
            >
              <Download className="mr-2 w-5 h-5" />
              Download Receipt
            </Button>
            <Button
              variant="outline"
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 py-6 rounded-xl font-semibold"
              onClick={() => {
                navigator.clipboard.writeText(bookingId);
                toast.success("Booking ID copied!");
              }}
            >
              <Mail className="mr-2 w-5 h-5" />
              Copy Booking ID
            </Button>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Check-in Time: 2:00 PM | Check-out Time: 12:00 PM</p>
                <p className="text-blue-700">Please arrive after 2:00 PM on your check-in date. Early check-in subject to availability.</p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              onClick={() => router.push("/")}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-6 rounded-xl shadow-lg font-semibold text-lg"
            >
              Return to Home
            </Button>
            <Button
              onClick={() => router.push("/rooms")}
              variant="outline"
              className="flex-1 border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white py-6 rounded-xl font-semibold text-lg transition-all"
            >
              Explore More Rooms
            </Button>
          </motion.div>

          {/* Contact Support */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-slate-500 mt-6"
          >
            Need help? Contact us at <a href="tel:+250788123456" className="text-emerald-600 font-semibold hover:underline">+250 788 123 456</a> or <a href="mailto:info@eastgate.rw" className="text-emerald-600 font-semibold hover:underline">info@eastgate.rw</a>
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-full max-w-[100vw] overflow-x-hidden">
      {/* Full Page Room View Modal */}
      {viewingRoomImages && (
        <RoomViewModal
          room={viewingRoomImages}
          onClose={() => setViewingRoomImages(null)}
          onSelect={() => {
            setSelectedRoom(viewingRoomImages.id);
            setViewingRoomImages(null);
          }}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-charcoal via-slate-800 to-charcoal text-white py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Book Your Stay</h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300">Experience luxury at EastGate Hotel</p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 w-full max-w-full overflow-x-hidden">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8 gap-1 sm:gap-2">
          {[
            { num: 1, label: "Select Room" },
            { num: 2, label: "Guest Details" },
            { num: 3, label: "Payment" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={cn(
                  "w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base flex-shrink-0",
                  step >= s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {step > s.num ? <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : s.num}
              </div>
              <span
                className={cn(
                  "mx-1 sm:mx-1.5 md:mx-2 text-[10px] sm:text-xs md:text-sm hidden sm:inline whitespace-nowrap",
                  step >= s.num ? "text-charcoal font-medium" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
              {i < 2 && <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 mx-0.5 sm:mx-1 md:mx-2 text-slate-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Branch & Date Selection */}
                <Card className="mb-4 sm:mb-6">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                      <div className="w-full">
                        <Label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium">Select Branch</Label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
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
                      <div className="w-full">
                        <Label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium">Room Type</Label>
                        <Select value={roomFilter} onValueChange={setRoomFilter}>
                          <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="All rooms" />
                          </SelectTrigger>
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
                      <div className="w-full">
                        <Label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium">Check-in</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-xs sm:text-sm">
                              <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="truncate">{checkIn ? format(checkIn, "PPP") : "Select date"}</span>
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
                      <div className="w-full">
                        <Label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium">Check-out</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-xs sm:text-sm">
                              <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="truncate">{checkOut ? format(checkOut, "PPP") : "Select date"}</span>
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
                <div className="mb-3 sm:mb-4 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-charcoal">
                    {loadingRooms ? "Loading..." : `${filteredRooms.length} Rooms`}
                  </h2>
                  <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => {
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
                    <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loadingRooms ? 'animate-spin' : ''}`} />
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
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                      {displayedRooms.map((room) => {
                        const details = roomTypeDetails[room.type] || roomTypeDetails.standard;
                        const imageUrl = room.imageUrl || details.image;
                        
                        return (
                          <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all",
                              selectedRoom === room.id
                                ? "ring-4 ring-emerald-500 shadow-2xl"
                                : "hover:shadow-2xl"
                            )}
                          >
                            {/* Image with Overlay */}
                            <div 
                              className="relative h-40 sm:h-48 md:h-56 lg:h-64 overflow-hidden"
                              onClick={() => setViewingRoomImages(room)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Room ${room.number}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              
                              {/* Status Badge */}
                              <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-emerald-500 text-white shadow-lg px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs">
                                {room.status}
                              </Badge>
                              
                              {/* View Icon */}
                              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600" />
                              </div>
                              
                              {/* Room Info Overlay */}
                              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 lg:p-5 text-white">
                                <p className="text-[10px] sm:text-xs md:text-sm opacity-90 mb-0.5 sm:mb-1">Room {room.number}</p>
                                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold capitalize line-clamp-1">
                                  {room.type.replace('_', ' ')}
                                </h3>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-3 sm:p-4 md:p-5" onClick={() => setSelectedRoom(room.id)}>
                              {/* Price */}
                              <div className="flex items-baseline justify-between mb-2 sm:mb-3 md:mb-4">
                                <div>
                                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-600">
                                    RWF {(room.price || details.price).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] sm:text-xs md:text-sm text-slate-500">per night</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] sm:text-xs">
                                  Floor {room.floor}
                                </Badge>
                              </div>

                              {/* Quick Info */}
                              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
                                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm text-slate-600">
                                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-600 flex-shrink-0" />
                                  <span className="truncate">{room.maxOccupancy || details.capacity} guests</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs md:text-sm text-slate-600">
                                  <Maximize className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-600 flex-shrink-0" />
                                  <span className="truncate">{room.size || details.size}</span>
                                </div>
                              </div>

                              {/* Amenities */}
                              <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mb-2 sm:mb-3 md:mb-4">
                                {details.amenities.slice(0, 3).map((amenity) => (
                                  <Badge key={amenity} variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 sm:px-2 sm:py-1">
                                    {amenity}
                                  </Badge>
                                ))}
                                {details.amenities.length > 3 && (
                                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 sm:px-2 sm:py-1">
                                    +{details.amenities.length - 3} more
                                  </Badge>
                                )}
                              </div>

                              {/* Action Button */}
                              {selectedRoom === room.id ? (
                                <Button
                                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl shadow-lg font-semibold text-xs sm:text-sm md:text-base"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStep(2);
                                  }}
                                >
                                  Continue Booking
                                  <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 sm:py-4 md:py-5 lg:py-6 rounded-xl font-semibold text-xs sm:text-sm md:text-base"
                                >
                                  Select Room
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center mt-8">
                        <Button
                          onClick={() => setDisplayedRoomsCount(prev => prev + 9)}
                          variant="outline"
                          size="lg"
                          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                        >
                          Load More Rooms ({filteredRooms.length - displayedRoomsCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-base sm:text-lg md:text-xl">Guest Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
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
                        <CountrySelect value={guestCountry} onValueChange={setGuestCountry} />
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
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="order-last sm:order-first">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 order-first sm:order-last"
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
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
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
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-white">🔒 256-bit SSL</Badge>
                        <Badge variant="outline" className="bg-white">Stripe</Badge>
                        <Badge variant="outline" className="bg-white">PayPal</Badge>
                        <Badge variant="outline" className="bg-white">Flutterwave</Badge>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-900 mb-1">100% Secure Payment</p>
                          <p className="text-sm text-emerald-700">Your payment information is encrypted and secure. We never store your card details.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                      <Button variant="outline" onClick={() => setStep(2)} className="order-last sm:order-first">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 order-first sm:order-last"
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
          <div className="lg:sticky lg:top-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
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

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <BookContent />
    </Suspense>
  );
}
