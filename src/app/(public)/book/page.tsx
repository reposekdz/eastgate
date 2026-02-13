"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { branches } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Baby,
  BedDouble,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roomTypes = [
  { value: "standard", label: "Standard Room", price: 234000, capacity: 2, description: "Comfortable room with essential amenities" },
  { value: "deluxe", label: "Deluxe Room", price: 325000, capacity: 3, description: "Spacious room with premium amenities" },
  { value: "family", label: "Family Suite", price: 416000, capacity: 5, description: "Large suite perfect for families" },
  { value: "executive_suite", label: "Executive Suite", price: 585000, capacity: 3, description: "Luxury suite with work space" },
  { value: "presidential_suite", label: "Presidential Suite", price: 1105000, capacity: 4, description: "Ultimate luxury experience" },
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [branch, setBranch] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [roomType, setRoomType] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const selectedRoom = roomTypes.find((r) => r.value === roomType);
  const selectedBranch = branches.find((b) => b.id === branch);

  const handleNext = () => {
    if (step === 1 && (!branch || !checkIn || !checkOut)) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step === 2 && !roomType) {
      toast.error("Please select a room type");
      return;
    }
    if (step === 3 && (!guestName || !guestEmail || !guestPhone)) {
      toast.error("Please fill in your contact information");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    toast.success("Booking request submitted successfully! We'll send you a confirmation email shortly.");
    // Reset form after brief delay
    setTimeout(() => {
      setStep(1);
      setBranch("");
      setCheckIn(undefined);
      setCheckOut(undefined);
      setRoomType("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setSpecialRequests("");
    }, 2000);
  };

  const numberOfNights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalAmount = selectedRoom && numberOfNights > 0 
    ? selectedRoom.price * numberOfNights 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pearl via-ivory to-pearl py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-emerald/10 rounded-full">
            <Sparkles className="h-4 w-4 text-emerald" />
            <span className="text-sm font-medium text-emerald uppercase tracking-wider">
              Book Your Stay
            </span>
          </div>
          <h1 className="heading-lg text-charcoal mb-4">
            Reserve Your Perfect Room
          </h1>
          <p className="body-lg text-text-muted-custom max-w-2xl mx-auto">
            Experience luxury across our four stunning locations in Rwanda
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all",
                  s <= step
                    ? "bg-emerald text-white"
                    : "bg-white text-text-muted-custom border-2 border-border"
                )}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={cn(
                    "h-1 w-12 sm:w-20 mx-2 rounded-full transition-all",
                    s < step ? "bg-emerald" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-emerald/5 to-gold/5 border-b">
            <CardTitle className="heading-sm">
              {step === 1 && "Select Branch & Dates"}
              {step === 2 && "Choose Your Room"}
              {step === 3 && "Guest Information"}
              {step === 4 && "Confirm Booking"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {/* Step 1: Branch & Dates */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald" />
                    Select Branch
                  </Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose your preferred location" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{b.name}</span>
                            <span className="text-xs text-text-muted-custom">{b.location}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-emerald" />
                      Check-in Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left h-12 font-normal",
                            !checkIn && "text-text-muted-custom"
                          )}
                        >
                          {checkIn ? format(checkIn, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-emerald" />
                      Check-out Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left h-12 font-normal",
                            !checkOut && "text-text-muted-custom"
                          )}
                        >
                          {checkOut ? format(checkOut, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) => !checkIn || date <= checkIn}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald" />
                      Adults
                    </Label>
                    <Select value={adults} onValueChange={setAdults}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? "Adult" : "Adults"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                      <Baby className="h-4 w-4 text-emerald" />
                      Children
                    </Label>
                    <Select value={children} onValueChange={setChildren}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? "Child" : "Children"}
                          </SelectItem>
                        ))}\
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}\

            {/* Step 2: Room Selection */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {roomTypes.map((room) => (
                  <Card
                    key={room.value}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      roomType === room.value
                        ? "border-2 border-emerald bg-emerald/5"
                        : "border hover:border-emerald/30"
                    )}
                    onClick={() => setRoomType(room.value)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <BedDouble className="h-5 w-5 text-emerald" />
                            <h3 className="font-heading font-semibold text-lg text-charcoal">
                              {room.label}
                            </h3>
                          </div>
                          <p className="text-sm text-text-muted-custom mb-2">{room.description}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted-custom">
                            <Users className="h-3 w-3" />
                            <span>Up to {room.capacity} guests</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-heading text-xl font-bold text-emerald">
                            {formatCurrency(room.price)}
                          </div>
                          <div className="text-xs text-text-muted-custom">per night</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Step 3: Guest Information */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div>
                  <Label className="text-sm font-semibold text-charcoal mb-2">Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-charcoal mb-2">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-charcoal mb-2">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+250 788 000 000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-charcoal mb-2">
                    Special Requests (Optional)
                  </Label>
                  <Textarea
                    placeholder="Any special requirements or preferences..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-emerald/10 to-gold/10 rounded-lg p-6">
                  <h3 className="font-heading font-semibold text-lg text-charcoal mb-4">
                    Booking Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-text-muted-custom">Branch</span>
                      <span className="font-semibold text-charcoal text-right">
                        {selectedBranch?.name}
                      </span>
                    </div>
                    <Separator />

                    <div className="flex justify-between items-start">
                      <span className="text-sm text-text-muted-custom">Room Type</span>
                      <span className="font-semibold text-charcoal text-right">
                        {selectedRoom?.label}
                      </span>
                    </div>
                    <Separator />

                    <div className="flex justify-between items-start">
                      <span className="text-sm text-text-muted-custom">Check-in</span>
                      <span className="font-semibold text-charcoal">
                        {checkIn && format(checkIn, "PPP")}
                      </span>
                    </div>
                    <Separator />

                    <div className="flex justify-between items-start">
                      <span className="text-sm text-text-muted-custom">Check-out</span>
                      <span className="font-semibold text-charcoal">
                        {checkOut && format(checkOut, "PPP")}
                      </span>
                    </div>
                    <Separator />

                    <div className="flex justify-between items-start">
                      <span className="text-sm text-text-muted-custom">Guests</span>
                      <span className="font-semibold text-charcoal">
                        {adults} Adults, {children} Children
                      </span>
                    </div>
                    <Separator />

                    <div className="flex justify-between items-start">
                      <span className="text-sm text-text-muted-custom">Guest Name</span>
                      <span className="font-semibold text-charcoal text-right">{guestName}</span>
                    </div>
                    <Separator />

                    <div className="flex justify-between items-start pt-4">
                      <span className="font-heading text-lg text-charcoal">Total Amount</span>
                      <div className="text-right">
                        <div className="font-heading text-2xl font-bold text-emerald">
                          {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-xs text-text-muted-custom">
                          {numberOfNights} {numberOfNights === 1 ? "night" : "nights"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-blue-900 mb-1">Secure Booking</h4>
                    <p className="text-xs text-blue-700">
                      Your information is encrypted and secure. You&apos;ll receive a confirmation email
                      within minutes.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="px-6"
                >
                  Back
                </Button>
              )}\
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  className="ml-auto bg-emerald hover:bg-emerald-dark text-white px-8"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="ml-auto bg-gradient-to-r from-emerald to-emerald-dark hover:from-emerald-dark hover:to-emerald text-white px-8"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Booking
                </Button>
              )}\
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[
            { icon: Shield, title: "Secure Payment", desc: "Your data is safe with us" },
            { icon: Clock, title: "Instant Confirmation", desc: "Get confirmed in minutes" },
            { icon: Sparkles, title: "Premium Service", desc: "5-star experience guaranteed" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald/10 text-emerald mb-3">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-charcoal mb-1">{feature.title}</h3>
              <p className="text-sm text-text-muted-custom">{feature.desc}</p>
            </motion.div>
          ))}\
        </div>
      </div>
    </div>
  );
}
