"use client";

import { useState } from "react";
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
import { bookings, staff, branches, rooms } from "@/lib/mock-data";
import { formatCurrency, formatDate, getBookingStatusLabel } from "@/lib/format";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  useGuestStore,
  type GuestStatus,
  type IdType,
} from "@/stores/guest-store";
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
  Edit,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

const nationalities = [
  "Rwanda", "Burundi", "DR Congo", "Uganda", "Kenya", "Tanzania",
  "United States", "United Kingdom", "France", "Germany", "China",
  "India", "Japan", "South Africa", "Nigeria", "Ghana", "Ethiopia",
  "Canada", "Australia", "Brazil", "Other",
];

export default function ReceptionistDashboard() {
  const { user } = useAuthStore();
  const userBranchId = user?.branchId || "br-001";
  const userBranchName = user?.branchName || "Kigali Main";

  // Guest store
  const {
    registerGuest,
    updateGuestStatus,
    getGuestsByBranch,
    getActiveGuests,
    searchGuests,
  } = useGuestStore();

  // Local form state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("guests");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<ReturnType<typeof getGuestsByBranch>[0] | null>(null);

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
  const branchBookings = bookings.filter((b) => b.branchId === userBranchId);
  const branchStaff = staff.filter((s) => s.branchId === userBranchId);
  const branchInfo = branches.find((b) => b.id === userBranchId);
  const availableRooms = rooms.filter(
    (r) => r.branchId === userBranchId && r.status === "available"
  );

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

  const handleRegister = () => {
    if (!regName || !regEmail || !regPhone || !regIdNumber || !regRoom || !regCheckOut) {
      toast.error("Please fill all required fields");
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

    toast.success(`Guest ${regName} registered successfully! ID: ${id}`);
    resetRegForm();
    setShowRegisterDialog(false);
  };

  const resetRegForm = () => {
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegNationality("");
    setRegIdType("passport");
    setRegIdNumber("");
    setRegRoom("");
    setRegCheckIn(new Date().toISOString().split("T")[0]);
    setRegCheckOut("");
    setRegGuests("1");
    setRegRequests("");
  };

  const handleCheckOut = (guestId: string, name: string) => {
    updateGuestStatus(guestId, "checked_out");
    toast.success(`${name} checked out successfully`);
  };

  const handleViewGuest = (guest: ReturnType<typeof getGuestsByBranch>[0]) => {
    setSelectedGuest(guest);
    setShowViewDialog(true);
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
                  Reception Desk • {branchInfo?.location}
                </p>
              </div>
            </div>
          </div>
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald hover:bg-emerald-dark text-white shadow-lg">
                <UserPlus className="mr-2 h-4 w-4" />
                Register New Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald/10 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-emerald" />
                  </div>
                  Register New Hotel Guest
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Personal Information */}
                <div>
                  <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name *</Label>
                      <Input
                        placeholder="John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email *</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone *</Label>
                      <Input
                        type="tel"
                        placeholder="+250 788 000 000"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nationality</Label>
                      <Select value={regNationality} onValueChange={setRegNationality}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {nationalities.map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Identification */}
                <div>
                  <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald" />
                    Identification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">ID Type *</Label>
                      <Select value={regIdType} onValueChange={(v) => setRegIdType(v as IdType)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="national_id">National ID</SelectItem>
                          <SelectItem value="driving_license">Driving License</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">ID Number *</Label>
                      <Input
                        placeholder="Document number"
                        value={regIdNumber}
                        onChange={(e) => setRegIdNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stay Details */}
                <div>
                  <h3 className="font-heading font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-emerald" />
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Room Number *</Label>
                      <Select value={regRoom} onValueChange={setRegRoom}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRooms.length > 0 ? (
                            availableRooms.map((r) => (
                              <SelectItem key={r.id} value={r.number}>
                                Room {r.number} • {r.type.replace("_", " ")} • {formatCurrency(r.price)}/night
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="manual" disabled>No available rooms</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Number of Guests</Label>
                      <Select value={regGuests} onValueChange={setRegGuests}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} {n === 1 ? "Guest" : "Guests"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Check-in Date *</Label>
                      <Input
                        type="date"
                        value={regCheckIn}
                        onChange={(e) => setRegCheckIn(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Check-out Date *</Label>
                      <Input
                        type="date"
                        value={regCheckOut}
                        onChange={(e) => setRegCheckOut(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Special Requests */}
                <div>
                  <Label className="text-sm font-medium">Special Requests</Label>
                  <Textarea
                    placeholder="Any special requirements or preferences..."
                    value={regRequests}
                    onChange={(e) => setRegRequests(e.target.value)}
                    className="mt-1 min-h-20"
                  />
                </div>

                <Button
                  onClick={handleRegister}
                  className="w-full bg-emerald hover:bg-emerald-dark text-white h-12"
                >
                  <UserCheck className="mr-2 h-5 w-5" />
                  Register & Check In Guest
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-900">Active Guests</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {activeGuests.length}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Currently in hotel</p>
                </div>
                <div className="h-12 w-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Expected Check-ins</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {branchBookings.filter((b) => b.status === "confirmed").length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Today</p>
                </div>
                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LogIn className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Check-outs</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">
                    {branchGuests.filter((g) => g.status === "checked_out").length}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Completed</p>
                </div>
                <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <LogOut className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">Total Registered</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {branchGuests.length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">All time</p>
                </div>
                <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">Available Rooms</p>
                  <p className="text-2xl font-bold text-gold-dark mt-1">
                    {availableRooms.length}
                  </p>
                  <p className="text-xs text-text-muted-custom mt-1">Ready to assign</p>
                </div>
                <div className="h-12 w-12 bg-gold rounded-xl flex items-center justify-center shadow-lg">
                  <BedDouble className="h-6 w-6 text-charcoal" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guests">
              <Users className="mr-2 h-4 w-4" />
              Guest Records ({branchGuests.length})
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="mr-2 h-4 w-4" />
              Bookings ({todayBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Guest Records Tab */}
          <TabsContent value="guests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle>Guest Registry</CardTitle>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                      <Input
                        placeholder="Search by name, email, ID, room..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-72"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="checked_in">Checked In</SelectItem>
                        <SelectItem value="checked_out">Checked Out</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
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
                        <TableHead>Guest Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGuests.map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell className="font-mono text-xs">{guest.id}</TableCell>
                          <TableCell className="font-medium">{guest.fullName}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3 text-text-muted-custom" />
                                {guest.email}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3 text-text-muted-custom" />
                                {guest.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3 text-text-muted-custom" />
                              {guest.nationality}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{guest.roomNumber}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(guest.checkInDate)}</TableCell>
                          <TableCell className="text-sm">{formatDate(guest.checkOutDate)}</TableCell>
                          <TableCell>
                            <Badge className={getGuestStatusColor(guest.status)}>
                              {guest.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewGuest(guest)}
                                className="h-7 w-7 p-0"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {guest.status === "checked_in" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCheckOut(guest.id, guest.fullName)}
                                  className="h-7 text-xs"
                                >
                                  <LogOut className="mr-1 h-3 w-3" />
                                  Check Out
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredGuests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-text-muted-custom">
                            No guest records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle>Today&apos;s Bookings</CardTitle>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                      <Input
                        placeholder="Search guests or rooms..."
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="checked_in">Checked In</SelectItem>
                        <SelectItem value="checked_out">Checked Out</SelectItem>
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
                        <TableHead>Guest Name</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.guestName}</TableCell>
                          <TableCell>{booking.roomNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              {formatDate(booking.checkIn)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              {formatDate(booking.checkOut)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === "checked_in"
                                  ? "default"
                                  : booking.status === "confirmed"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {getBookingStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(booking.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                onClick={() => toast.success(`Guest ${booking.guestName} checked in!`)}
                                className="bg-emerald hover:bg-emerald-dark text-white"
                              >
                                <LogIn className="mr-1 h-3 w-3" />
                                Check In
                              </Button>
                            )}
                            {booking.status === "checked_in" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.success(`Guest checked out from Room ${booking.roomNumber}`)}
                              >
                                <LogOut className="mr-1 h-3 w-3" />
                                Check Out
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredBookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-text-muted-custom">
                            No bookings found
                          </TableCell>
                        </TableRow>
                      )}
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
                Guest Details
              </DialogTitle>
            </DialogHeader>
            {selectedGuest && (
              <div className="space-y-4 py-2">
                <div className="bg-emerald/5 rounded-lg p-4">
                  <h3 className="font-heading font-bold text-xl text-charcoal mb-1">
                    {selectedGuest.fullName}
                  </h3>
                  <Badge className={getGuestStatusColor(selectedGuest.status)}>
                    {selectedGuest.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-muted-custom">Email</p>
                    <p className="font-medium">{selectedGuest.email}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">Phone</p>
                    <p className="font-medium">{selectedGuest.phone}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">Nationality</p>
                    <p className="font-medium">{selectedGuest.nationality}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">ID ({selectedGuest.idType.replace("_", " ")})</p>
                    <p className="font-medium">{selectedGuest.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">Room</p>
                    <p className="font-medium">{selectedGuest.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">Guests</p>
                    <p className="font-medium">{selectedGuest.numberOfGuests}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">Check-in</p>
                    <p className="font-medium">{formatDate(selectedGuest.checkInDate)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted-custom">Check-out</p>
                    <p className="font-medium">{formatDate(selectedGuest.checkOutDate)}</p>
                  </div>
                </div>

                {selectedGuest.specialRequests && (
                  <div className="text-sm">
                    <p className="text-text-muted-custom">Special Requests</p>
                    <p className="font-medium mt-1 bg-pearl/50 rounded p-2">
                      {selectedGuest.specialRequests}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  {selectedGuest.status === "checked_in" && (
                    <Button
                      onClick={() => {
                        handleCheckOut(selectedGuest.id, selectedGuest.fullName);
                        setShowViewDialog(false);
                      }}
                      className="flex-1 bg-emerald hover:bg-emerald-dark text-white"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Check Out Guest
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowViewDialog(false)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}
