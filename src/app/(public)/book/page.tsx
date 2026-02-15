"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
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
import { branches, rooms as allRoomsData } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { format, differenceInDays } from "date-fns";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MenuOrderDialog, type CartItem } from "@/components/MenuOrderDialog";
import CountrySelect from "@/components/shared/CountrySelect";
import { useCurrency } from "@/components/shared/CurrencySelector";
import { formatWithCurrency } from "@/lib/currencies";

// ─── Room Data with Images ───────────────────────────────
const roomTypeDetails = [
  {
    value: "standard",
    price: 234000,
    capacity: 2,
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "TV", "Air Conditioning", "Room Service", "Mini Fridge"],
    size: "28 m²",
    beds: "1 Queen Bed",
    floor: "1-2",
  },
  {
    value: "deluxe",
    price: 325000,
    capacity: 3,
    image: "https://images.pexels.com/photos/34672504/pexels-photo-34672504.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "Smart TV", "Mini Bar", "Balcony", "Bathrobes", "Room Service"],
    size: "38 m²",
    beds: "1 King Bed",
    floor: "1-3",
  },
  {
    value: "family",
    price: 416000,
    capacity: 5,
    image: "https://images.pexels.com/photos/5883728/pexels-photo-5883728.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "Smart TV", "Mini Bar", "Living Room", "Kitchenette", "Room Service", "2 Bathrooms"],
    size: "55 m²",
    beds: "1 King + 2 Singles",
    floor: "1-3",
  },
  {
    value: "executive_suite",
    price: 585000,
    capacity: 3,
    image: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "Smart TV", "Full Bar", "Work Desk", "Lounge Access", "Butler Service", "Jacuzzi"],
    size: "65 m²",
    beds: "1 King Bed",
    floor: "2-4",
  },
  {
    value: "presidential_suite",
    price: 1105000,
    capacity: 4,
    image: "https://images.pexels.com/photos/18285947/pexels-photo-18285947.jpeg?auto=compress&cs=tinysrgb&w=600",
    amenities: ["Free Wi-Fi", "Cinema Room", "Full Bar", "Private Dining", "Butler Service", "Jacuzzi", "Sauna", "Grand Piano"],
    size: "120 m²",
    beds: "1 Emperor Bed",
    floor: "3-4",
  },
];

// ─── Add-On Services ─────────────────────────────────────
const addOnServicesMeta = [
  { id: "airport_pickup", price: 45000, icon: Plane },
  { id: "airport_dropoff", price: 45000, icon: Car },
  { id: "late_checkout", price: 65000, icon: Moon },
  { id: "early_checkin", price: 55000, icon: Sun },
  { id: "extra_bed", price: 35000, icon: Bed },
  { id: "breakfast", price: 25000, icon: Coffee },
  { id: "spa_package", price: 120000, icon: Waves },
  { id: "tour_package", price: 85000, icon: Palmtree },
  { id: "honeymoon_decor", price: 75000, icon: Heart },
  { id: "gym_access", price: 15000, icon: Dumbbell },
];

// Using full world countries from CountrySelect component

export default function BookingPage() {
  const { t, locale } = useI18n();
  const { currency } = useCurrency();
  const [step, setStep] = useState(1);

  // Step 1
  const [branch, setBranch] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");

  // Step 2
  const [roomType, setRoomType] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("price_asc");

  // Step 3
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [menuCart, setMenuCart] = useState<CartItem[]>([]);
  const [showMenuDialog, setShowMenuDialog] = useState(false);

  // Step 4
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNationality, setGuestNationality] = useState("");

  // Step 5
  const [paymentMethod, setPaymentMethod] = useState("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const STEPS = [
    { id: 1, label: t("booking", "step1") },
    { id: 2, label: t("booking", "step2") },
    { id: 3, label: t("booking", "step3") },
    { id: 4, label: t("booking", "step4") },
    { id: 5, label: t("booking", "step5") },
    { id: 6, label: t("booking", "step6") },
  ];

  // Helpers
  const getRoomLabel = (value: string) => {
    const key = value as keyof typeof import("@/lib/i18n/translations").translations.roomTypes;
    return t("roomTypes", key);
  };
  const getRoomDesc = (value: string) => {
    const key = value as keyof typeof import("@/lib/i18n/translations").translations.roomDesc;
    return t("roomDesc", key);
  };
  const getAddonLabel = (id: string) => {
    const key = id as keyof typeof import("@/lib/i18n/translations").translations.addOns;
    return t("addOns", key);
  };
  const getAddonDesc = (id: string) => {
    const key = `${id}Desc` as keyof typeof import("@/lib/i18n/translations").translations.addOns;
    return t("addOns", key);
  };

  // Derived values
  const selectedRoom = roomTypeDetails.find((r) => r.value === roomType);
  const selectedBranch = branches.find((b) => b.id === branch);
  const numberOfNights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const roomTotal = selectedRoom && numberOfNights > 0 ? selectedRoom.price * numberOfNights : 0;
  const addOnsTotal = selectedAddOns.reduce((sum, id) => {
    const addon = addOnServicesMeta.find((a) => a.id === id);
    if (!addon) return sum;
    if (["breakfast", "gym_access"].includes(id)) return sum + addon.price * numberOfNights * parseInt(adults);
    return sum + addon.price;
  }, 0);
  const menuTotal = menuCart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const totalAmount = roomTotal + addOnsTotal + menuTotal;
  const totalGuests = parseInt(adults) + parseInt(children);

  const availableRoomTypes = useMemo(() => {
    let filtered = roomTypeDetails.filter((r) => r.capacity >= totalGuests);

    if (roomSearch.trim()) {
      const q = roomSearch.toLowerCase();
      filtered = filtered.filter(
        (r) => getRoomLabel(r.value).toLowerCase().includes(q) || getRoomDesc(r.value).toLowerCase().includes(q)
      );
    }

    if (priceFilter !== "all") {
      if (priceFilter === "budget") filtered = filtered.filter((r) => r.price <= 300000);
      if (priceFilter === "mid") filtered = filtered.filter((r) => r.price > 300000 && r.price <= 600000);
      if (priceFilter === "luxury") filtered = filtered.filter((r) => r.price > 600000);
    }

    if (sortBy === "price_asc") filtered.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") filtered.sort((a, b) => b.price - a.price);
    if (sortBy === "capacity") filtered.sort((a, b) => b.capacity - a.capacity);
    if (sortBy === "size") filtered.sort((a, b) => parseInt(b.size) - parseInt(a.size));

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalGuests, roomSearch, priceFilter, sortBy, locale]);

  const getAvailableCount = (type: string) => {
    if (!branch) return 0;
    return allRoomsData.filter((r) => r.branchId === branch && r.type === type && r.status === "available").length;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!branch) { toast.error(t("booking", "pleaseSelectBranch")); return; }
      if (!checkIn) { toast.error(t("booking", "pleaseSelectCheckIn")); return; }
      if (!checkOut) { toast.error(t("booking", "pleaseSelectCheckOut")); return; }
      if (numberOfNights < 1) { toast.error(t("booking", "checkOutAfterCheckIn")); return; }
    }
    if (step === 2) {
      if (!roomType) { toast.error(t("booking", "pleaseSelectRoom")); return; }
    }
    if (step === 4) {
      if (!guestName.trim()) { toast.error(t("booking", "pleaseEnterName")); return; }
      if (!guestEmail.trim() || !guestEmail.includes("@")) { toast.error(t("booking", "pleaseEnterEmail")); return; }
      if (!guestPhone.trim()) { toast.error(t("booking", "pleaseEnterPhone")); return; }
    }
    setStep(step + 1);
  };

  const handlePayment = async () => {
    if (paymentMethod === "visa" || paymentMethod === "mastercard" || paymentMethod === "stripe") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) { toast.error(t("booking", "pleaseEnterCard")); return; }
      if (!cardExpiry || cardExpiry.length < 5) { toast.error(t("booking", "pleaseEnterExpiry")); return; }
      if (!cardCvv || cardCvv.length < 3) { toast.error(t("booking", "pleaseEnterCvv")); return; }
    }
    if ((paymentMethod === "mtn_mobile" || paymentMethod === "airtel_money") && !mobileNumber) {
      toast.error(t("booking", "pleaseEnterMobile")); return;
    }
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsProcessing(false);
    setStep(6);
    toast.success(t("booking", "paymentSuccess"));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 16);
    return v.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const bookingRef = `EG-${Date.now().toString(36).toUpperCase()}`;
  const progressPercent = (step / STEPS.length) * 100;

  const stepVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pearl via-ivory to-pearl py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-emerald/10 rounded-full">
            <Sparkles className="h-4 w-4 text-emerald" />
            <span className="text-sm font-medium text-emerald uppercase tracking-wider">
              {t("booking", "bookYourStay")}
            </span>
          </div>
          <h1 className="heading-lg text-charcoal mb-3">{t("booking", "title")}</h1>
          <p className="body-lg text-text-muted-custom max-w-2xl mx-auto">{t("booking", "subtitle")}</p>
        </motion.div>

        {/* Progress Steps */}
        {step < 6 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto">
              {STEPS.slice(0, 5).map((s) => (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all text-sm",
                    s.id < step ? "bg-emerald text-white" : s.id === step ? "bg-emerald text-white ring-4 ring-emerald/20" : "bg-white text-text-muted-custom border-2 border-border"
                  )}>
                    {s.id < step ? <Check className="h-5 w-5" /> : s.id}
                  </div>
                  <span className={cn("text-xs mt-1.5 hidden sm:block font-medium", s.id <= step ? "text-emerald" : "text-text-muted-custom")}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-1.5 max-w-3xl mx-auto" />
          </div>
        )}

        {/* Form Card */}
        <Card className="shadow-xl border-0 overflow-hidden">
          {step < 6 && (
            <CardHeader className="bg-gradient-to-r from-emerald/5 to-gold/5 border-b py-5">
              <CardTitle className="heading-sm flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald/10 flex items-center justify-center">
                  {step === 1 && <CalendarIcon className="h-5 w-5 text-emerald" />}
                  {step === 2 && <BedDouble className="h-5 w-5 text-emerald" />}
                  {step === 3 && <Sparkles className="h-5 w-5 text-emerald" />}
                  {step === 4 && <Users className="h-5 w-5 text-emerald" />}
                  {step === 5 && <CreditCard className="h-5 w-5 text-emerald" />}
                </div>
                {STEPS[step - 1]?.label}
              </CardTitle>
            </CardHeader>
          )}

          <CardContent className={cn("p-6 sm:p-8", step === 6 && "p-0")}>
            <AnimatePresence mode="wait">
              {/* ═══ Step 1: Branch, Dates & Guests ═══ */}
              {step === 1 && (
                <motion.div key="step1" {...stepVariants} className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald" />
                      {t("booking", "selectBranch")}
                    </Label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={t("booking", "chooseBranch")} />
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
                        {t("booking", "checkInDate")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left h-12 font-normal", !checkIn && "text-text-muted-custom")}>
                            {checkIn ? format(checkIn, "PPP") : t("booking", "selectDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={(d) => { setCheckIn(d); if (d && checkOut && d >= checkOut) setCheckOut(undefined); }}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-emerald" />
                        {t("booking", "checkOutDate")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left h-12 font-normal", !checkOut && "text-text-muted-custom")}>
                            {checkOut ? format(checkOut, "PPP") : t("booking", "selectDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(date) => !checkIn || date <= checkIn} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {numberOfNights > 0 && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald/5 rounded-lg border border-emerald/20">
                      <Clock className="h-4 w-4 text-emerald" />
                      <span className="text-sm font-medium text-emerald">
                        {numberOfNights} {numberOfNights === 1 ? t("common", "night") : t("common", "nights")} {t("booking", "stayDuration")}
                      </span>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald" />
                      {t("booking", "numberOfGuests")}
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-text-muted-custom mb-1.5 block">{t("booking", "adults")}</Label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <button key={n} onClick={() => setAdults(n.toString())} className={cn(
                              "h-11 w-11 rounded-lg border-2 font-semibold transition-all text-sm",
                              adults === n.toString() ? "border-emerald bg-emerald text-white" : "border-border bg-white text-charcoal hover:border-emerald/50"
                            )}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-text-muted-custom mb-1.5 block">{t("booking", "children")}</Label>
                        <div className="flex items-center gap-2">
                          {[0, 1, 2, 3, 4].map((n) => (
                            <button key={n} onClick={() => setChildren(n.toString())} className={cn(
                              "h-11 w-11 rounded-lg border-2 font-semibold transition-all text-sm",
                              children === n.toString() ? "border-emerald bg-emerald text-white" : "border-border bg-white text-charcoal hover:border-emerald/50"
                            )}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted-custom mt-2">
                      {t("booking", "totalGuests")}: {totalGuests} {totalGuests === 1 ? t("common", "guest") : t("common", "guests")}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 2: Room Selection ═══ */}
              {step === 2 && (
                <motion.div key="step2" {...stepVariants} className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                      <Input placeholder={t("booking", "searchRooms")} value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} className="pl-10 h-11" />
                    </div>
                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                      <SelectTrigger className="w-[160px] h-11">
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("booking", "allPrices")}</SelectItem>
                        <SelectItem value="budget">{t("booking", "budget")} (≤ 300K)</SelectItem>
                        <SelectItem value="mid">{t("booking", "mid")} (300K-600K)</SelectItem>
                        <SelectItem value="luxury">{t("booking", "luxury")} (600K+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px] h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_asc">{t("booking", "priceLowHigh")}</SelectItem>
                        <SelectItem value="price_desc">{t("booking", "priceHighLow")}</SelectItem>
                        <SelectItem value="capacity">{t("booking", "maxCapacity")}</SelectItem>
                        <SelectItem value="size">{t("booking", "roomSize")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-sm text-text-muted-custom">
                    {t("booking", "showingRooms")} <span className="font-semibold text-charcoal">{availableRoomTypes.length}</span> {t("booking", "roomTypes")}{" "}
                    {t("booking", "forGuests")} <span className="font-semibold text-charcoal">{totalGuests}</span> {t("common", "guests")}
                    {selectedBranch && <> {t("booking", "at")} <span className="font-semibold text-emerald">{selectedBranch.name}</span></>}
                  </p>

                  <div className="space-y-4">
                    {availableRoomTypes.map((room) => {
                      const available = getAvailableCount(room.value);
                      const isSelected = roomType === room.value;
                      return (
                        <Card key={room.value} className={cn("cursor-pointer transition-all hover:shadow-lg overflow-hidden", isSelected ? "border-2 border-emerald ring-2 ring-emerald/10" : "border hover:border-emerald/30")} onClick={() => setRoomType(room.value)}>
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                              <div className="relative sm:w-56 h-48 sm:h-auto shrink-0">
                                <img src={room.image} alt={getRoomLabel(room.value)} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-emerald/20 flex items-center justify-center">
                                    <div className="h-12 w-12 rounded-full bg-emerald flex items-center justify-center"><Check className="h-6 w-6 text-white" /></div>
                                  </div>
                                )}
                                <div className="absolute top-3 left-3"><Badge className="bg-charcoal/80 text-white backdrop-blur-sm">{room.size}</Badge></div>
                              </div>
                              <div className="flex-1 p-5">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div>
                                    <h3 className="font-heading font-semibold text-lg text-charcoal">{getRoomLabel(room.value)}</h3>
                                    <div className="flex items-center gap-3 text-xs text-text-muted-custom mt-0.5">
                                      <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {room.beds}</span>
                                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t("booking", "upTo")} {room.capacity}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-heading text-xl font-bold text-emerald">{formatCurrency(room.price)}</div>
                                    <div className="text-xs text-text-muted-custom">{t("common", "perNight")}</div>
                                  </div>
                                </div>
                                <p className="text-sm text-text-muted-custom mb-3 line-clamp-2">{getRoomDesc(room.value)}</p>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {room.amenities.slice(0, 5).map((a) => (
                                    <Badge key={a} variant="outline" className="text-[10px] px-2 py-0.5">{a}</Badge>
                                  ))}
                                  {room.amenities.length > 5 && (
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">+{room.amenities.length - 5}</Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {available > 0 ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">{available} {available > 1 ? t("booking", "roomsAvailable") : t("booking", "roomAvailable")}</Badge>
                                    ) : (
                                      <Badge className="bg-orange-100 text-orange-700 text-xs">{t("booking", "limitedAvailability")}</Badge>
                                    )}
                                  </div>
                                  {numberOfNights > 0 && (
                                    <div className="text-right">
                                      <span className="text-sm font-bold text-charcoal">{formatCurrency(room.price * numberOfNights)}</span>
                                      <span className="text-xs text-text-muted-custom ml-1">/ {numberOfNights} {t("common", "nights")}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {availableRoomTypes.length === 0 && (
                      <div className="text-center py-12 text-text-muted-custom">
                        <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">{t("booking", "noRoomsFound")}</p>
                        <p className="text-sm mt-1">{t("booking", "adjustFilters")}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 3: Add-Ons ═══ */}
              {step === 3 && (
                <motion.div key="step3" {...stepVariants} className="space-y-6">
                  <div>
                    <h3 className="font-heading font-semibold text-charcoal mb-1 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      {t("booking", "enhanceStay")}
                    </h3>
                    <p className="text-sm text-text-muted-custom mb-4">{t("booking", "selectServices")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addOnServicesMeta.map((addon) => {
                        const isChecked = selectedAddOns.includes(addon.id);
                        return (
                          <div key={addon.id} onClick={() => toggleAddOn(addon.id)} className={cn(
                            "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                            isChecked ? "border-emerald bg-emerald/5" : "border-border hover:border-emerald/30 bg-white"
                          )}>
                            <Checkbox checked={isChecked} onCheckedChange={() => toggleAddOn(addon.id)} className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <addon.icon className="h-4 w-4 text-emerald shrink-0" />
                                <span className="font-semibold text-sm text-charcoal">{getAddonLabel(addon.id)}</span>
                              </div>
                              <p className="text-xs text-text-muted-custom mt-0.5">{getAddonDesc(addon.id)}</p>
                            </div>
                            <span className="font-semibold text-sm text-emerald shrink-0">{formatCurrency(addon.price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-2 block">{t("booking", "specialRequests")}</Label>
                    <Textarea placeholder={t("booking", "specialRequestsPlaceholder")} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="min-h-24" />
                  </div>

                  <Separator />

                  <div className="bg-gradient-to-r from-gold/10 to-emerald/10 rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <UtensilsCrossed className="h-5 w-5 text-emerald" />
                          <h3 className="font-heading font-semibold text-charcoal">{t("booking", "preOrderMenu")}</h3>
                        </div>
                        <p className="text-sm text-text-muted-custom">{t("booking", "preOrderDesc")}</p>
                      </div>
                      {menuCart.length > 0 && (
                        <Badge className="bg-emerald shrink-0">
                          {menuCart.reduce((sum, c) => sum + c.quantity, 0)} {t("common", "items")} • {formatCurrency(menuTotal)}
                        </Badge>
                      )}
                    </div>

                    {menuCart.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {menuCart.slice(0, 3).map(({ item, quantity }) => (
                          <div key={item.id} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2">
                            <div className="flex-1">
                              <span className="font-medium text-charcoal">{item.name}</span>
                              <span className="text-text-muted-custom ml-2">× {quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald">{formatCurrency(item.price * quantity)}</span>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setMenuCart(menuCart.filter((c) => c.item.id !== item.id)); }} className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {menuCart.length > 3 && <p className="text-xs text-text-muted-custom text-center">+{menuCart.length - 3} {t("common", "more")} {t("common", "items")}</p>}
                      </div>
                    )}

                    <Button onClick={() => setShowMenuDialog(true)} variant="outline" className="w-full border-emerald text-emerald hover:bg-emerald hover:text-white">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {menuCart.length > 0 ? t("booking", "updateMenuOrder") : t("booking", "browseMenu")}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 4: Guest Info ═══ */}
              {step === 4 && (
                <motion.div key="step4" {...stepVariants} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald" /> {t("booking", "fullName")} *
                      </Label>
                      <Input placeholder={t("booking", "enterFullName")} value={guestName} onChange={(e) => setGuestName(e.target.value)} className="h-12" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald" /> {t("booking", "emailAddress")} *
                      </Label>
                      <Input type="email" placeholder="john@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="h-12" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald" /> {t("booking", "phoneNumber")} *
                      </Label>
                      <Input type="tel" placeholder="+250 788 000 000" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="h-12" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-semibold text-charcoal mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald" /> {t("booking", "nationality")}
                      </Label>
                      <CountrySelect
                        value={guestNationality}
                        onValueChange={setGuestNationality}
                        placeholder={t("booking", "selectNationality")}
                      />
                    </div>
                  </div>

                  <div className="bg-pearl/50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-sm text-charcoal mb-3">{t("booking", "bookingSummary")}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("booking", "location")}</span><span className="font-medium">{selectedBranch?.name}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("common", "room")}</span><span className="font-medium">{selectedRoom ? getRoomLabel(selectedRoom.value) : ""}</span></div>
                      <div className="flex justify-between">
                        <span className="text-text-muted-custom">{t("booking", "stay")}</span>
                        <span className="font-medium">{checkIn && format(checkIn, "MMM d")} – {checkOut && format(checkOut, "MMM d, yyyy")} ({numberOfNights} {t("common", "nights")})</span>
                      </div>
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("common", "guests")}</span><span className="font-medium">{adults} {t("booking", "adults")}, {children} {t("booking", "children")}</span></div>
                      <Separator />
                      <div className="flex justify-between font-semibold"><span className="text-charcoal">{t("common", "total")}</span><span className="text-emerald">{formatCurrency(totalAmount)}</span></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 5: Payment ═══ */}
              {step === 5 && (
                <motion.div key="step5" {...stepVariants} className="space-y-6">
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-blue-900 mb-1">{t("booking", "onlinePaymentOnly")}</h4>
                      <p className="text-xs text-blue-700">{t("booking", "onlinePaymentDesc")}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-charcoal mb-3 block">{t("booking", "selectPayment")}</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { value: "visa", icon: CreditCard, color: "text-blue-600" },
                          { value: "mastercard", icon: CreditCard, color: "text-orange-600" },
                          { value: "stripe", icon: CreditCard, color: "text-purple-600" },
                          { value: "mtn_mobile", icon: Smartphone, color: "text-yellow-600" },
                          { value: "airtel_money", icon: Smartphone, color: "text-red-600" },
                          { value: "bank_transfer", icon: Building2, color: "text-emerald" },
                        ].map((method) => (
                          <label key={method.value} className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                            paymentMethod === method.value ? "border-emerald bg-emerald/5" : "border-border hover:border-emerald/30"
                          )}>
                            <RadioGroupItem value={method.value} />
                            <method.icon className={cn("h-5 w-5", method.color)} />
                            <span className="font-medium text-sm text-charcoal">{t("paymentMethods", method.value as keyof typeof import("@/lib/i18n/translations").translations.paymentMethods)}</span>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {(paymentMethod === "visa" || paymentMethod === "mastercard" || paymentMethod === "stripe") && (
                    <div className="space-y-4 bg-white rounded-lg border p-5">
                      <h4 className="font-semibold text-sm text-charcoal flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald" /> {t("booking", "cardDetails")}</h4>
                      <div>
                        <Label className="text-xs text-text-muted-custom mb-1 block">{t("booking", "cardNumber")}</Label>
                        <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} className="h-12 font-mono text-lg tracking-wider" maxLength={19} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-text-muted-custom mb-1 block">{t("booking", "expiryDate")}</Label>
                          <Input placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} className="h-12 font-mono" maxLength={5} />
                        </div>
                        <div>
                          <Label className="text-xs text-text-muted-custom mb-1 block">CVV</Label>
                          <Input type="password" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} className="h-12 font-mono" maxLength={4} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(paymentMethod === "mtn_mobile" || paymentMethod === "airtel_money") && (
                    <div className="space-y-4 bg-white rounded-lg border p-5">
                      <h4 className="font-semibold text-sm text-charcoal flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-emerald" />
                        {t("paymentMethods", paymentMethod as "mtn_mobile" | "airtel_money")}
                      </h4>
                      <div>
                        <Label className="text-xs text-text-muted-custom mb-1 block">{t("booking", "mobileNumber")}</Label>
                        <Input type="tel" placeholder="+250 78X XXX XXX" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="h-12" />
                      </div>
                      <p className="text-xs text-text-muted-custom">{t("booking", "mobilePayPrompt")}</p>
                    </div>
                  )}

                  {paymentMethod === "bank_transfer" && (
                    <div className="space-y-3 bg-white rounded-lg border p-5">
                      <h4 className="font-semibold text-sm text-charcoal flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald" /> {t("booking", "bankTransfer")}</h4>
                      <div className="text-sm space-y-2 text-text-muted-custom">
                        <div className="flex justify-between"><span>{t("booking", "bankName")}</span><span className="font-medium text-charcoal">Bank of Kigali</span></div>
                        <div className="flex justify-between"><span>{t("booking", "accountName")}</span><span className="font-medium text-charcoal">EastGate Hotel Rwanda Ltd</span></div>
                        <div className="flex justify-between"><span>{t("booking", "accountNumber")}</span><span className="font-medium text-charcoal font-mono">100-2847-5920</span></div>
                        <div className="flex justify-between"><span>{t("booking", "swiftCode")}</span><span className="font-medium text-charcoal font-mono">BKIGRWRW</span></div>
                      </div>
                      <p className="text-xs text-text-muted-custom mt-2">{t("booking", "bankTransferNote")}</p>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-emerald/10 to-gold/10 rounded-lg p-5">
                    <h4 className="font-heading font-semibold text-charcoal mb-4">{t("booking", "paymentSummary")}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted-custom">{selectedRoom ? getRoomLabel(selectedRoom.value) : ""} × {numberOfNights} {t("common", "nights")}</span>
                        <span className="font-medium">{formatCurrency(roomTotal)}</span>
                      </div>
                      {selectedAddOns.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-text-muted-custom">{t("booking", "addOnServices")} ({selectedAddOns.length})</span>
                          <span className="font-medium">{formatCurrency(addOnsTotal)}</span>
                        </div>
                      )}
                      {menuCart.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-text-muted-custom">{t("booking", "menuPreOrder")} ({menuCart.length} {t("common", "items")})</span>
                          <span className="font-medium">{formatCurrency(menuTotal)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-heading text-lg font-bold text-charcoal">{t("common", "total")}</span>
                        <div className="text-right">
                          <span className="font-heading text-2xl font-bold text-emerald block">{formatCurrency(totalAmount)}</span>
                          {currency.code !== "RWF" && (
                            <span className="text-xs text-text-muted-custom">
                              ≈ {formatWithCurrency(totalAmount, currency.code)} ({currency.code})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 6: Confirmation ═══ */}
              {step === 6 && (
                <motion.div key="step6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 px-6">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald/10 mb-6">
                    <CheckCircle2 className="h-12 w-12 text-emerald" />
                  </div>
                  <h2 className="heading-md text-charcoal mb-2">{t("booking", "bookingConfirmed")}</h2>
                  <p className="text-text-muted-custom mb-6">{t("booking", "reservationSuccess")}</p>

                  <div className="inline-block bg-pearl rounded-lg p-6 mb-8 border">
                    <p className="text-xs text-text-muted-custom uppercase tracking-wider mb-1">{t("booking", "bookingReference")}</p>
                    <p className="font-mono text-2xl font-bold text-emerald tracking-wider">{bookingRef}</p>
                  </div>

                  <div className="bg-gradient-to-r from-emerald/5 to-gold/5 rounded-lg p-6 max-w-lg mx-auto text-left mb-8">
                    <h4 className="font-heading font-semibold text-charcoal mb-4">{t("booking", "bookingDetails")}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("common", "guest")}</span><span className="font-medium text-charcoal">{guestName}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("common", "branch")}</span><span className="font-medium text-charcoal">{selectedBranch?.name}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("common", "room")}</span><span className="font-medium text-charcoal">{selectedRoom ? getRoomLabel(selectedRoom.value) : ""}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("booking", "checkIn")}</span><span className="font-medium text-charcoal">{checkIn && format(checkIn, "PPP")}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("booking", "checkOut")}</span><span className="font-medium text-charcoal">{checkOut && format(checkOut, "PPP")}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-text-muted-custom">{t("common", "guests")}</span><span className="font-medium text-charcoal">{adults} {t("booking", "adults")}, {children} {t("booking", "children")}</span></div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-text-muted-custom">{t("booking", "payment")}</span>
                        <span className="font-medium text-charcoal">{t("paymentMethods", paymentMethod as keyof typeof import("@/lib/i18n/translations").translations.paymentMethods)}</span>
                      </div>
                      {selectedAddOns.length > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-text-muted-custom">{t("booking", "addOns")}</span>
                            <div className="text-right">
                              {selectedAddOns.map((id) => <div key={id} className="text-xs text-text-muted-custom">{getAddonLabel(id)}</div>)}
                            </div>
                          </div>
                        </>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-heading text-lg font-bold text-charcoal">{t("booking", "totalPaid")}</span>
                        <span className="font-heading text-xl font-bold text-emerald">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-emerald/5 border border-emerald/20 rounded-lg p-4 max-w-lg mx-auto text-left mb-6">
                    <Mail className="h-5 w-5 text-emerald mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-charcoal mb-1">{t("booking", "confirmationEmail")}</h4>
                      <p className="text-xs text-text-muted-custom">
                        {t("booking", "confirmationEmailDesc")} <span className="font-medium text-charcoal">{guestEmail}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setStep(1); setBranch(""); setCheckIn(undefined); setCheckOut(undefined);
                      setRoomType(""); setGuestName(""); setGuestEmail(""); setGuestPhone("");
                      setSpecialRequests(""); setSelectedAddOns([]); setMenuCart([]);
                      setCardNumber(""); setCardExpiry(""); setCardCvv(""); setMobileNumber("");
                      setPaymentMethod("visa");
                    }}
                    className="bg-emerald hover:bg-emerald-dark text-white px-8"
                  >
                    {t("booking", "bookAnother")}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ Action Buttons ═══ */}
            {step < 6 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="px-6 gap-2">
                    <ArrowLeft className="h-4 w-4" /> {t("common", "back")}
                  </Button>
                ) : <div />}

                {step < 5 ? (
                  <Button onClick={handleNext} className="bg-emerald hover:bg-emerald-dark text-white px-8 gap-2">
                    {t("common", "continue")} <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-emerald to-emerald-dark hover:from-emerald-dark hover:to-emerald text-white px-8 gap-2"
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {t("booking", "processing")}</>
                    ) : (
                      <><Lock className="h-4 w-4" /> {t("booking", "pay")} {formatCurrency(totalAmount)}</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust Features */}
        {step < 6 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-12">
            {[
              { icon: Shield, title: t("booking", "securePayment"), desc: t("booking", "securePaymentDesc") },
              { icon: Clock, title: t("booking", "instantConfirmation"), desc: t("booking", "instantConfirmationDesc") },
              { icon: BadgeCheck, title: t("booking", "bestRate"), desc: t("booking", "bestRateDesc") },
              { icon: Sparkles, title: t("booking", "premiumService"), desc: t("booking", "premiumServiceDesc") },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald/10 text-emerald mb-3">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-charcoal mb-1 text-sm">{feature.title}</h3>
                <p className="text-xs text-text-muted-custom">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        )}

        <MenuOrderDialog open={showMenuDialog} onOpenChange={setShowMenuDialog} cart={menuCart} onUpdateCart={setMenuCart} />
      </div>
    </div>
  );
}
