"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useBranchStore } from "@/lib/store/branch-store";
import {
  formatCurrency,
  formatDate,
  getBookingStatusLabel,
  getRoomStatusLabel,
  getRoomTypeLabel,
} from "@/lib/format";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  useGuestStore,
  type GuestStatus,
  type IdType,
} from "@/stores/guest-store";
import { useI18n } from "@/lib/i18n/context";
import { countries, searchCountries } from "@/lib/countries";
import CountrySelect from "@/components/shared/CountrySelect";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReceiptDialog, { type ReceiptData } from "@/components/receptionist/ReceiptDialog";
import PayPalPayment from "@/components/receptionist/PayPalPayment";
import {
  UserPlus,
  LogIn,
  LogOut,
  Search,
  Calendar,
  UserCheck,
  Building2,
  Users,
  Globe,
  CreditCard,
  Phone,
  Mail,
  BedDouble,
  FileText,
  Eye,
  ClipboardList,
  Printer,
  Clock,
  Bell,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  DoorOpen,
  Wrench,
  Sparkles,
  KeyRound,
  Activity,
  MessageSquare,
  TrendingUp,
  Shield,
  RefreshCw,
  Download,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

// Use full world countries list from countries.ts

// Activity log types
type ActivityType = "check_in" | "check_out" | "booking" | "service" | "alert" | "payment";

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  messageRw: string;
  time: string;
  guest?: string;
  room?: string;
}

const mockActivities: ActivityItem[] = [
  { id: "act-1", type: "check_in", message: "Checked in to Room 201", messageRw: "Yinjiye mu Cyumba 201", time: "2 min ago", guest: "James Okafor", room: "201" },
  { id: "act-2", type: "service", message: "Extra towels requested", messageRw: "Amaservieti yongeyeho yasabwe", time: "8 min ago", guest: "Sarah Mitchell", room: "101" },
  { id: "act-3", type: "booking", message: "New reservation confirmed", messageRw: "Ifatwa rishya ryemejwe", time: "15 min ago", guest: "Elena Petrova", room: "302" },
  { id: "act-4", type: "alert", message: "VIP guest arriving in 30 min", messageRw: "Umushyitsi VIP azagera mu minota 30", time: "20 min ago", guest: "Mohammed Al-Rashid", room: "105" },
  { id: "act-5", type: "check_out", message: "Checked out from Room 304", messageRw: "Yasohotse mu Cyumba 304", time: "25 min ago", guest: "Ingrid Johansson", room: "304" },
  { id: "act-6", type: "payment", message: "Room charge payment received", messageRw: "Kwishyura icyumba byakiriwe", time: "32 min ago", guest: "Victoria Laurent", room: "301" },
  { id: "act-7", type: "service", message: "Room service ordered — Lunch", messageRw: "Serivisi y'icyumba yasabwe — Ifunguro", time: "40 min ago", guest: "Amara Chen", room: "204" },
  { id: "act-8", type: "check_in", message: "Walk-in guest registered", messageRw: "Umushyitsi ahageze yanditswe", time: "45 min ago", guest: "David Kirabo", room: "305" },
  { id: "act-9", type: "alert", message: "Maintenance completed — Room 203 ready", messageRw: "Gukosorwa byarangiye — Icyumba 203 cyateguwe", time: "55 min ago", room: "203" },
  { id: "act-10", type: "booking", message: "Booking cancelled by guest", messageRw: "Ifatwa ryahagaritswe n'umushyitsi", time: "1 hr ago", guest: "Fatima Hassan", room: "103" },
];

// Service request types
interface ServiceRequest {
  id: string;
  guest: string;
  room: string;
  type: string;
  typeRw: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  time: string;
}

const mockServiceRequests: ServiceRequest[] = [
  { id: "sr-1", guest: "Sarah Mitchell", room: "101", type: "Extra Pillows", typeRw: "Umusego Wongeyeho", priority: "low", status: "pending", time: "5 min ago" },
  { id: "sr-2", guest: "James Okafor", room: "201", type: "Room Cleaning", typeRw: "Gusukura Icyumba", priority: "medium", status: "in_progress", time: "12 min ago" },
  { id: "sr-3", guest: "Victoria Laurent", room: "301", type: "Airport Transfer", typeRw: "Guhura ku Kibuga", priority: "high", status: "pending", time: "18 min ago" },
  { id: "sr-4", guest: "Amara Chen", room: "204", type: "WiFi Issue", typeRw: "Ikibazo cya WiFi", priority: "urgent", status: "pending", time: "3 min ago" },
  { id: "sr-5", guest: "David Kirabo", room: "305", type: "Late Check-out", typeRw: "Gusohoka Buhoro", priority: "medium", status: "completed", time: "30 min ago" },
  { id: "sr-6", guest: "Lisa Wang", room: "402", type: "Room Service", typeRw: "Serivisi y'Icyumba", priority: "low", status: "in_progress", time: "22 min ago" },
];

export default function ReceptionistDashboard() {
  const { user } = useAuthStore();
  const { t, isRw } = useI18n();
  const userBranchId = user?.branchId || "br-001";
  const userBranchName = user?.branchName || "Kigali Main";

  const {
    registerGuest,
    updateGuestStatus,
    getGuestsByBranch,
    getActiveGuests,
    searchGuests,
  } = useGuestStore();

  const getBookings = useBranchStore((s) => s.getBookings);
  const getStaff = useBranchStore((s) => s.getStaff);
  const getBranches = useBranchStore((s) => s.getBranches);
  const getRooms = useBranchStore((s) => s.getRooms);
  const userRole = user?.role ?? "receptionist";
  const branchBookings = getBookings(userBranchId, userRole);
  const branchStaff = getStaff(userBranchId, userRole);
  const branches = getBranches(userRole, userBranchId);
  const branchInfo = branches.find((b) => b.id === userBranchId);
  const branchRooms = getRooms(userBranchId, userRole);
  const availableRooms = branchRooms.filter((r) => r.status === "available");

  // Local form state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<ReturnType<typeof getGuestsByBranch>[0] | null>(null);
  const [roomFloorFilter, setRoomFloorFilter] = useState("all");
  const [roomStatusFilter, setRoomStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showPayPalDialog, setShowPayPalDialog] = useState(false);
  const [payPalGuest, setPayPalGuest] = useState<{ name: string; amount: number } | null>(null);

  // Registration form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regNationality, setRegNationality] = useState("");
  const [regIdType, setRegIdType] = useState<IdType>("passport");
  const [regIdNumber, setRegIdNumber] = useState("");
  const [regRoom, setRegRoom] = useState("");
  const [regCheckIn, setRegCheckIn] = useState(new Date().toISOString().split("T")[0]);
  const [regCheckOut, setRegCheckOut] = useState("");
  const [regGuests, setRegGuests] = useState("1");
  const [regRequests, setRegRequests] = useState("");

  // Data
  const branchGuests = getGuestsByBranch(userBranchId);
  const activeGuests = getActiveGuests(userBranchId);

  // Room stats
  const roomStats = useMemo(() => {
    const total = branchRooms.length;
    const occupied = branchRooms.filter((r) => r.status === "occupied").length;
    const available = branchRooms.filter((r) => r.status === "available").length;
    const cleaning = branchRooms.filter((r) => r.status === "cleaning").length;
    const maintenance = branchRooms.filter((r) => r.status === "maintenance").length;
    const reserved = branchRooms.filter((r) => r.status === "reserved").length;
    return { total, occupied, available, cleaning, maintenance, reserved };
  }, [branchRooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return branchRooms.filter((r) => {
      const floorMatch = roomFloorFilter === "all" || r.floor.toString() === roomFloorFilter;
      const statusMatch = roomStatusFilter === "all" || r.status === roomStatusFilter;
      return floorMatch && statusMatch;
    });
  }, [branchRooms, roomFloorFilter, roomStatusFilter]);

  // Filter guests
  const filteredGuests = searchTerm
    ? searchGuests(searchTerm, userBranchId)
    : branchGuests.filter((g) =>
        statusFilter === "all" ? true : g.status === statusFilter
      );

  // Booking filters
  const todayBookings = branchBookings.filter(
    (b) =>
      b.checkIn === new Date().toISOString().split("T")[0] ||
      b.status === "checked_in"
  );
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const filteredBookings = todayBookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.roomNumber.includes(bookingSearch);
    const matchesStatus =
      bookingStatusFilter === "all" || b.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered service requests
  const filteredServiceRequests = mockServiceRequests.filter((sr) =>
    serviceFilter === "all" ? true : sr.status === serviceFilter
  );

  // Unique floors
  const floors = [...new Set(branchRooms.map((r) => r.floor))].sort();

  const handleRegister = () => {
    if (!regName || !regEmail || !regPhone || !regIdNumber || !regRoom || !regCheckOut) {
      toast.error(t("receptionist", "fillAllFields"));
      return;
    }

    const id = registerGuest({
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      nationality: regNationality || "Rwanda",
      idType: regIdType,
      idNumber: regIdNumber,
      roomNumber: regRoom,
      branchId: userBranchId,
      checkInDate: regCheckIn,
      checkOutDate: regCheckOut,
      numberOfGuests: parseInt(regGuests) || 1,
      specialRequests: regRequests || undefined,
      status: "checked_in",
    });

    toast.success(`${t("receptionist", "guestRegisteredSuccess")} ID: ${id}`);
    resetRegForm();
    setShowRegisterDialog(false);
  };

  const resetRegForm = () => {
    setRegName(""); setRegEmail(""); setRegPhone(""); setRegNationality("");
    setRegIdType("passport"); setRegIdNumber(""); setRegRoom("");
    setRegCheckIn(new Date().toISOString().split("T")[0]);
    setRegCheckOut(""); setRegGuests("1"); setRegRequests("");
  };

  const handleCheckOut = (guestId: string, name: string) => {
    updateGuestStatus(guestId, "checked_out");
    toast.success(`${name} ${t("receptionist", "checkedOutSuccess")}`);
  };

  const handleViewGuest = (guest: ReturnType<typeof getGuestsByBranch>[0]) => {
    setSelectedGuest(guest);
    setShowViewDialog(true);
  };

  const handleGenerateReceipt = (guest: ReturnType<typeof getGuestsByBranch>[0]) => {
    const nights = Math.max(1, Math.ceil((new Date(guest.checkOutDate).getTime() - new Date(guest.checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    const roomInfo = branchRooms.find((r) => r.number === guest.roomNumber);
    const roomRate = roomInfo?.price || 234000;

    const receipt: ReceiptData = {
      invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
      dateIssued: new Date().toLocaleDateString(isRw ? "rw-RW" : "en-US", { year: "numeric", month: "long", day: "numeric" }),
      guestName: guest.fullName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      roomNumber: guest.roomNumber,
      checkIn: formatDate(guest.checkInDate),
      checkOut: formatDate(guest.checkOutDate),
      nights,
      roomRate,
      items: [
        { description: isRw ? `Icyumba ${guest.roomNumber} — ${nights} amajoro` : `Room ${guest.roomNumber} — ${nights} night(s)`, qty: nights, unitPrice: roomRate },
        { description: isRw ? "Ifunguro rya Buri Gitondo" : "Daily Breakfast", qty: nights, unitPrice: 15000 },
        { description: isRw ? "Serivisi y'Icyumba" : "Room Service", qty: 1, unitPrice: 25000 },
      ],
      paymentMethod: "Visa",
      paymentStatus: "paid",
    };

    setReceiptData(receipt);
    setShowReceiptDialog(true);
  };

  const handlePayPalPayment = (guest: ReturnType<typeof getGuestsByBranch>[0]) => {
    const nights = Math.max(1, Math.ceil((new Date(guest.checkOutDate).getTime() - new Date(guest.checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    const roomInfo = branchRooms.find((r) => r.number === guest.roomNumber);
    const roomRate = roomInfo?.price || 234000;
    const total = nights * roomRate + nights * 15000 + 25000;
    setPayPalGuest({ name: guest.fullName, amount: total });
    setShowPayPalDialog(true);
  };

  const getGuestStatusColor = (status: GuestStatus) => {
    const colors: Record<GuestStatus, string> = {
      checked_in: "bg-emerald-100 text-emerald-700",
      checked_out: "bg-gray-100 text-gray-700",
      reserved: "bg-purple-100 text-purple-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getRoomStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-status-available",
      occupied: "bg-status-occupied",
      cleaning: "bg-status-cleaning",
      maintenance: "bg-status-maintenance",
      reserved: "bg-status-reserved",
    };
    return colors[status] || "bg-gray-400";
  };

  const getRoomStatusBorder = (status: string) => {
    const colors: Record<string, string> = {
      available: "border-green-300 bg-green-50",
      occupied: "border-blue-300 bg-blue-50",
      cleaning: "border-yellow-300 bg-yellow-50",
      maintenance: "border-red-300 bg-red-50",
      reserved: "border-purple-300 bg-purple-50",
    };
    return colors[status] || "border-gray-300 bg-gray-50";
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "check_in": return <LogIn className="h-4 w-4 text-emerald" />;
      case "check_out": return <LogOut className="h-4 w-4 text-orange-500" />;
      case "booking": return <Calendar className="h-4 w-4 text-blue-500" />;
      case "service": return <Bell className="h-4 w-4 text-purple-500" />;
      case "alert": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "payment": return <CreditCard className="h-4 w-4 text-gold" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700", urgent: "bg-red-100 text-red-700",
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  const getServiceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700", in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-emerald rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="heading-md text-charcoal">{userBranchName}</h1>
              <p className="text-xs text-text-muted-custom">
                Shared receptionist dashboard · {branchInfo?.location} · Managed by branch manager
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${liveUpdates ? "bg-emerald animate-pulse" : "bg-gray-300"}`} />
            <span className="text-text-muted-custom text-xs">{t("receptionist", "live")}</span>
            <Switch checked={liveUpdates} onCheckedChange={setLiveUpdates} className="scale-75" />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info(t("receptionist", "refreshingData"))}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t("receptionist", "refresh")}
          </Button>
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald hover:bg-emerald-dark text-white shadow-lg">
                <UserPlus className="mr-2 h-4 w-4" />
                {t("receptionist", "registerGuest")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-emerald" />
                  </div>
                  {t("receptionist", "registerGuest")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Personal Information */}
                <div>
                  <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald" />
                    {t("receptionist", "personalInfo")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "fullName")} *</Label>
                      <Input placeholder="John Doe" value={regName} onChange={(e) => setRegName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "email")} *</Label>
                      <Input type="email" placeholder="john@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "phone")} *</Label>
                      <Input type="tel" placeholder="+250 788 000 000" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "nationality")}</Label>
                      <div className="mt-1">
                        <CountrySelect
                          value={regNationality}
                          onValueChange={setRegNationality}
                          placeholder={t("receptionist", "selectCountry")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Identification */}
                <div>
                  <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald" />
                    {t("receptionist", "identification")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "idType")} *</Label>
                      <Select value={regIdType} onValueChange={(v) => setRegIdType(v as IdType)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">{t("receptionist", "passport")}</SelectItem>
                          <SelectItem value="national_id">{t("receptionist", "nationalId")}</SelectItem>
                          <SelectItem value="driving_license">{t("receptionist", "drivingLicense")}</SelectItem>
                          <SelectItem value="other">{t("receptionist", "other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "idNumber")} *</Label>
                      <Input placeholder={isRw ? "Nimero y'igitabo" : "Document number"} value={regIdNumber} onChange={(e) => setRegIdNumber(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Stay Details */}
                <div>
                  <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-emerald" />
                    {t("receptionist", "stayDetails")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "roomNumber")} *</Label>
                      <Select value={regRoom} onValueChange={setRegRoom}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder={t("receptionist", "selectRoom")} /></SelectTrigger>
                        <SelectContent>
                          {availableRooms.length > 0 ? (
                            availableRooms.map((r) => (
                              <SelectItem key={r.id} value={r.number}>
                                {isRw ? "Icyumba" : "Room"} {r.number} • {getRoomTypeLabel(r.type)} • {formatCurrency(r.price)}/{isRw ? "ijoro" : "night"}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="manual" disabled>{t("receptionist", "noAvailableRooms")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "numberOfGuests")}</Label>
                      <Select value={regGuests} onValueChange={setRegGuests}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? t("common", "guest") : t("common", "guests")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "checkInDate")} *</Label>
                      <Input type="date" value={regCheckIn} onChange={(e) => setRegCheckIn(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("receptionist", "checkOutDate")} *</Label>
                      <Input type="date" value={regCheckOut} onChange={(e) => setRegCheckOut(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">{t("receptionist", "specialRequests")}</Label>
                  <Textarea placeholder={isRw ? "Ibyifuzo bidasanzwe..." : "Any special requirements..."} value={regRequests} onChange={(e) => setRegRequests(e.target.value)} className="mt-1 min-h-20" />
                </div>
                <Button onClick={handleRegister} className="w-full bg-emerald hover:bg-emerald-dark text-white h-12">
                  <UserCheck className="mr-2 h-5 w-5" />
                  {t("receptionist", "registerAndCheckIn")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-900">{t("receptionist", "activeGuests")}</p>
                <p className="text-2xl font-bold text-emerald-700 mt-0.5">{activeGuests.length}</p>
              </div>
              <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-900">{t("receptionist", "expectedArrivals")}</p>
                <p className="text-2xl font-bold text-blue-700 mt-0.5">{branchBookings.filter((b) => b.status === "confirmed").length}</p>
              </div>
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shadow"><LogIn className="h-5 w-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-900">{t("receptionist", "checkOuts")}</p>
                <p className="text-2xl font-bold text-orange-700 mt-0.5">{branchGuests.filter((g) => g.status === "checked_out").length}</p>
              </div>
              <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center shadow"><LogOut className="h-5 w-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-900">{t("receptionist", "availableRooms")}</p>
                <p className="text-2xl font-bold text-green-700 mt-0.5">{roomStats.available}</p>
              </div>
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center shadow"><DoorOpen className="h-5 w-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-900">{t("receptionist", "cleaning")}</p>
                <p className="text-2xl font-bold text-yellow-700 mt-0.5">{roomStats.cleaning}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-600 rounded-lg flex items-center justify-center shadow"><Sparkles className="h-5 w-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-900">{t("receptionist", "maintenance")}</p>
                <p className="text-2xl font-bold text-red-700 mt-0.5">{roomStats.maintenance}</p>
              </div>
              <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center shadow"><Wrench className="h-5 w-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald" />
              <span className="text-sm font-semibold text-charcoal">{t("receptionist", "occupancyRate")}</span>
            </div>
            <span className="text-sm font-bold text-emerald">
              {Math.round((roomStats.occupied / roomStats.total) * 100)}%
            </span>
          </div>
          <Progress value={(roomStats.occupied / roomStats.total) * 100} className="h-2.5" />
          <div className="flex justify-between mt-2 text-xs text-text-muted-custom">
            <span>{roomStats.occupied} {isRw ? "byuzuye mu" : "occupied of"} {roomStats.total} {isRw ? "ibyumba" : "rooms"}</span>
            <span>{roomStats.available} {isRw ? "biboneka" : "available"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common", "overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <BedDouble className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common", "rooms")}</span>
          </TabsTrigger>
          <TabsTrigger value="guests">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common", "guests")}</span>
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common", "bookings")}</span>
          </TabsTrigger>
          <TabsTrigger value="services">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common", "services")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald" />
                      {t("receptionist", "liveActivityFeed")}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {liveUpdates ? t("receptionist", "live") : t("receptionist", "paused")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 max-h-[400px] overflow-y-auto">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-pearl/50 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-pearl flex items-center justify-center shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-charcoal truncate">{activity.guest || (isRw ? "Sisitemu" : "System")}</p>
                          {activity.room && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {isRw ? "Icyumba" : "Room"} {activity.room}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-muted-custom mt-0.5">{isRw ? activity.messageRw : activity.message}</p>
                      </div>
                      <span className="text-[10px] text-text-muted-custom whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-gold" />
                    {t("receptionist", "quickActions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={() => setShowRegisterDialog(true)}>
                    <UserPlus className="h-5 w-5 text-emerald" />
                    {t("receptionist", "walkIn")}
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={() => { setActiveTab("bookings"); toast.info(t("receptionist", "viewingBookings")); }}>
                    <LogIn className="h-5 w-5 text-blue-500" />
                    {t("receptionist", "checkIn")}
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={() => { setActiveTab("rooms"); toast.info(t("receptionist", "viewingRooms")); }}>
                    <BedDouble className="h-5 w-5 text-purple-500" />
                    {t("receptionist", "roomMap")}
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={() => { setActiveTab("services"); toast.info(t("receptionist", "viewingServices")); }}>
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    {t("common", "services")}
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={() => toast.info(t("receptionist", "generatingReport"))}>
                    <Printer className="h-5 w-5 text-slate-500" />
                    {t("receptionist", "printReport")}
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={() => toast.info(t("receptionist", "callingHousekeeping"))}>
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    {t("receptionist", "housekeeping")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald" />
                    {t("receptionist", "onDutyStaff")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {branchStaff.filter((s) => s.status === "active").slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-pearl/50 transition-colors">
                      <img src={member.avatar} alt={member.name} className="h-8 w-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">{member.name}</p>
                        <p className="text-[10px] text-text-muted-custom capitalize">{member.role.replace("_", " ")} • {member.shift}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-emerald" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Rooms Tab ─── */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-emerald" />
                  {t("receptionist", "roomStatusBoard")}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex gap-3 items-center text-xs text-text-muted-custom mr-4">
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-status-available" /> {t("common", "available")}</div>
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-status-occupied" /> {isRw ? "Bikoreshwa" : "Occupied"}</div>
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-status-cleaning" /> {t("receptionist", "cleaning")}</div>
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-status-maintenance" /> {t("receptionist", "maintenance")}</div>
                    <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-status-reserved" /> {t("receptionist", "reserved")}</div>
                  </div>
                  <Select value={roomFloorFilter} onValueChange={setRoomFloorFilter}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("receptionist", "allFloors")}</SelectItem>
                      {floors.map((f) => (<SelectItem key={f} value={f.toString()}>{t("receptionist", "floor")} {f}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={roomStatusFilter} onValueChange={setRoomStatusFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("receptionist", "allStatus")}</SelectItem>
                      <SelectItem value="available">{t("common", "available")}</SelectItem>
                      <SelectItem value="occupied">{isRw ? "Bikoreshwa" : "Occupied"}</SelectItem>
                      <SelectItem value="cleaning">{t("receptionist", "cleaning")}</SelectItem>
                      <SelectItem value="maintenance">{t("receptionist", "maintenance")}</SelectItem>
                      <SelectItem value="reserved">{t("receptionist", "reserved")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`border-2 rounded-xl p-3 transition-all hover:shadow-md cursor-pointer ${getRoomStatusBorder(room.status)}`}
                    onClick={() => {
                      if (room.status === "available") {
                        setRegRoom(room.number);
                        setShowRegisterDialog(true);
                      } else {
                        toast.info(`${isRw ? "Icyumba" : "Room"} ${room.number}: ${getRoomStatusLabel(room.status)}${room.currentGuest ? ` — ${room.currentGuest}` : ""}`);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold text-lg text-charcoal">{room.number}</span>
                      <div className={`h-3 w-3 rounded-full ${getRoomStatusColor(room.status)}`} />
                    </div>
                    <p className="text-[10px] text-text-muted-custom capitalize">{getRoomTypeLabel(room.type)}</p>
                    <p className="text-[10px] font-medium text-charcoal mt-0.5">{formatCurrency(room.price)}/{isRw ? "ijoro" : "night"}</p>
                    {room.currentGuest && (<p className="text-[10px] text-blue-600 mt-1 truncate">👤 {room.currentGuest}</p>)}
                    {room.status === "available" && (<p className="text-[10px] text-emerald font-medium mt-1">✓ {t("receptionist", "ready")}</p>)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Guests Tab ─── */}
        <TabsContent value="guests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t("receptionist", "guestRegistry")} ({branchGuests.length})</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                    <Input placeholder={t("receptionist", "searchGuests")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-72" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("receptionist", "allStatus")}</SelectItem>
                      <SelectItem value="checked_in">{t("receptionist", "checkedIn")}</SelectItem>
                      <SelectItem value="checked_out">{t("receptionist", "checkedOut")}</SelectItem>
                      <SelectItem value="reserved">{t("receptionist", "reserved")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{t("receptionist", "fullName")}</TableHead>
                      <TableHead>{isRw ? "Itumanaho" : "Contact"}</TableHead>
                      <TableHead>{t("receptionist", "nationality")}</TableHead>
                      <TableHead>{t("common", "room")}</TableHead>
                      <TableHead>{t("receptionist", "checkInDate")}</TableHead>
                      <TableHead>{t("receptionist", "checkOutDate")}</TableHead>
                      <TableHead>{t("common", "status")}</TableHead>
                      <TableHead className="text-right">{t("common", "actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-mono text-xs">{guest.id}</TableCell>
                        <TableCell className="font-medium">{guest.fullName}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3 text-text-muted-custom" />{guest.email}</div>
                            <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3 text-text-muted-custom" />{guest.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm"><Globe className="h-3 w-3 text-text-muted-custom" />{guest.nationality}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{guest.roomNumber}</Badge></TableCell>
                        <TableCell className="text-sm">{formatDate(guest.checkInDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(guest.checkOutDate)}</TableCell>
                        <TableCell>
                          <Badge className={getGuestStatusColor(guest.status)}>{guest.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleViewGuest(guest)} className="h-7 w-7 p-0">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleGenerateReceipt(guest)} className="h-7 w-7 p-0" title={isRw ? "Inyemezabuguzi" : "Receipt"}>
                              <Download className="h-3.5 w-3.5 text-emerald" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handlePayPalPayment(guest)} className="h-7 w-7 p-0" title="PayPal">
                              <CreditCard className="h-3.5 w-3.5 text-[#0070ba]" />
                            </Button>
                            {guest.status === "checked_in" && (
                              <Button size="sm" variant="outline" onClick={() => handleCheckOut(guest.id, guest.fullName)} className="h-7 text-xs">
                                <LogOut className="mr-1 h-3 w-3" />
                                {t("receptionist", "checkOut")}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredGuests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-text-muted-custom">
                          {t("receptionist", "noGuestRecords")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Bookings Tab ─── */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>{t("receptionist", "todayBookings")} ({todayBookings.length})</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                    <Input placeholder={t("receptionist", "searchGuestsOrRooms")} value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} className="pl-9 w-64" />
                  </div>
                  <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("receptionist", "allStatus")}</SelectItem>
                      <SelectItem value="confirmed">{isRw ? "Byemejwe" : "Confirmed"}</SelectItem>
                      <SelectItem value="checked_in">{t("receptionist", "checkedIn")}</SelectItem>
                      <SelectItem value="checked_out">{t("receptionist", "checkedOut")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("receptionist", "fullName")}</TableHead>
                      <TableHead>{t("common", "room")}</TableHead>
                      <TableHead>{t("receptionist", "checkInDate")}</TableHead>
                      <TableHead>{t("receptionist", "checkOutDate")}</TableHead>
                      <TableHead>{t("common", "status")}</TableHead>
                      <TableHead>{t("common", "amount")}</TableHead>
                      <TableHead className="text-right">{t("common", "actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.guestName}</TableCell>
                        <TableCell>{booking.roomNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm"><Calendar className="h-3 w-3" />{formatDate(booking.checkIn)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm"><Calendar className="h-3 w-3" />{formatDate(booking.checkOut)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={booking.status === "checked_in" ? "default" : booking.status === "confirmed" ? "secondary" : "outline"}>
                            {getBookingStatusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(booking.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          {booking.status === "confirmed" && (
                            <Button size="sm" onClick={() => toast.success(t("receptionist", "guestCheckedIn"))} className="bg-emerald hover:bg-emerald-dark text-white">
                              <LogIn className="mr-1 h-3 w-3" /> {t("receptionist", "checkIn")}
                            </Button>
                          )}
                          {booking.status === "checked_in" && (
                            <Button size="sm" variant="outline" onClick={() => toast.success(`${t("receptionist", "guestCheckedOut")} ${booking.roomNumber}`)}>
                              <LogOut className="mr-1 h-3 w-3" /> {t("receptionist", "checkOut")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredBookings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-text-muted-custom">{t("receptionist", "noBookingsFound")}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Services Tab ─── */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-emerald" />
                  {t("receptionist", "serviceRequests")}
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("receptionist", "allStatus")}</SelectItem>
                      <SelectItem value="pending">{t("common", "pending")}</SelectItem>
                      <SelectItem value="in_progress">{t("common", "inProgress")}</SelectItem>
                      <SelectItem value="completed">{t("common", "completed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common", "guest")}</TableHead>
                      <TableHead>{t("common", "room")}</TableHead>
                      <TableHead>{isRw ? "Icyifuzo" : "Request"}</TableHead>
                      <TableHead>{isRw ? "Uburemere" : "Priority"}</TableHead>
                      <TableHead>{t("common", "status")}</TableHead>
                      <TableHead>{t("common", "time")}</TableHead>
                      <TableHead className="text-right">{t("common", "actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServiceRequests.map((sr) => (
                      <TableRow key={sr.id}>
                        <TableCell className="font-medium">{sr.guest}</TableCell>
                        <TableCell><Badge variant="outline">{sr.room}</Badge></TableCell>
                        <TableCell>{isRw ? sr.typeRw : sr.type}</TableCell>
                        <TableCell><Badge className={getPriorityColor(sr.priority)}>{isRw ? (sr.priority === "low" ? "Hasi" : sr.priority === "medium" ? "Hagati" : sr.priority === "high" ? "Hejuru" : "Byihutirwa") : sr.priority}</Badge></TableCell>
                        <TableCell><Badge className={getServiceStatusColor(sr.status)}>{sr.status.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="text-sm text-text-muted-custom">{sr.time}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {sr.status === "pending" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`${t("receptionist", "assignedService")} ${sr.room}`)}>
                                <ArrowUpRight className="mr-1 h-3 w-3" /> {t("receptionist", "assign")}
                              </Button>
                            )}
                            {sr.status === "in_progress" && (
                              <Button size="sm" className="h-7 text-xs bg-emerald hover:bg-emerald-dark text-white" onClick={() => toast.success(`${isRw ? sr.typeRw : sr.type} ${t("receptionist", "completedService")} ${sr.room}`)}>
                                <CheckCircle2 className="mr-1 h-3 w-3" /> {t("receptionist", "complete")}
                              </Button>
                            )}
                            {sr.status === "completed" && (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> {t("receptionist", "done")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Guest Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald" />
              {t("receptionist", "guestDetails")}
            </DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-4 py-2">
              <div className="bg-emerald/5 rounded-lg p-4">
                <h3 className="font-heading font-bold text-xl text-charcoal mb-1">{selectedGuest.fullName}</h3>
                <Badge className={getGuestStatusColor(selectedGuest.status)}>{selectedGuest.status.replace("_", " ")}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-text-muted-custom">{t("receptionist", "email")}</p><p className="font-medium">{selectedGuest.email}</p></div>
                <div><p className="text-text-muted-custom">{t("receptionist", "phone")}</p><p className="font-medium">{selectedGuest.phone}</p></div>
                <div><p className="text-text-muted-custom">{t("receptionist", "nationality")}</p><p className="font-medium">{selectedGuest.nationality}</p></div>
                <div><p className="text-text-muted-custom">{t("receptionist", "idType")} ({selectedGuest.idType.replace("_", " ")})</p><p className="font-medium">{selectedGuest.idNumber}</p></div>
                <div><p className="text-text-muted-custom">{t("common", "room")}</p><p className="font-medium">{selectedGuest.roomNumber}</p></div>
                <div><p className="text-text-muted-custom">{t("receptionist", "numberOfGuests")}</p><p className="font-medium">{selectedGuest.numberOfGuests}</p></div>
                <div><p className="text-text-muted-custom">{t("receptionist", "checkInDate")}</p><p className="font-medium">{formatDate(selectedGuest.checkInDate)}</p></div>
                <div><p className="text-text-muted-custom">{t("receptionist", "checkOutDate")}</p><p className="font-medium">{formatDate(selectedGuest.checkOutDate)}</p></div>
              </div>
              {selectedGuest.specialRequests && (
                <div className="text-sm">
                  <p className="text-text-muted-custom">{t("receptionist", "specialRequests")}</p>
                  <p className="font-medium mt-1 bg-pearl/50 rounded p-2">{selectedGuest.specialRequests}</p>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => handleGenerateReceipt(selectedGuest)}>
                  <Download className="h-4 w-4" /> {t("receipt", "downloadReceipt")}
                </Button>
                <Button variant="outline" className="gap-2 text-[#0070ba]" onClick={() => handlePayPalPayment(selectedGuest)}>
                  <CreditCard className="h-4 w-4" /> PayPal
                </Button>
                {selectedGuest.status === "checked_in" && (
                  <Button onClick={() => { handleCheckOut(selectedGuest.id, selectedGuest.fullName); setShowViewDialog(false); }} className="flex-1 bg-emerald hover:bg-emerald-dark text-white">
                    <LogOut className="mr-2 h-4 w-4" /> {t("receptionist", "checkOutGuest")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {receiptData && (
        <ReceiptDialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog} data={receiptData} />
      )}

      {/* PayPal Payment Dialog */}
      {payPalGuest && (
        <PayPalPayment
          open={showPayPalDialog}
          onOpenChange={setShowPayPalDialog}
          amount={payPalGuest.amount}
          description={isRw ? "Kwishyura Ihoteli" : "Hotel Payment"}
          guestName={payPalGuest.name}
          onSuccess={(txId) => {
            toast.success(`${t("paypal", "paypalSuccess")} (${txId})`);
          }}
        />
      )}
    </div>
  );
}
