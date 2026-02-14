"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import {
  useGuestStore,
  type GuestStatus,
} from "@/stores/guest-store";
import { bookings } from "@/lib/mock-data";
import { formatCurrency, formatDate, getRoomTypeLabel } from "@/lib/format";
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Calendar,
  Globe,
  BedDouble,
  Eye,
  Filter,
  Download,
  Mail,
  Phone,
  Clock,
  Star,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Plane,
  CalendarCheck,
  FileText,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function ManagerGuestsPage() {
  const { user } = useAuthStore();
  const { getBookings } = useBranchStore();
  const {
    getGuestsByBranch,
    getActiveGuests,
    searchGuests,
    updateGuestStatus,
  } = useGuestStore();

  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "branch_manager";
  const isSuperRole = userRole === "super_manager" || userRole === "super_admin";

  // State
  const [activeTab, setActiveTab] = useState("today");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<ReturnType<typeof getGuestsByBranch>[0] | null>(null);

  // Data
  const allGuests = getGuestsByBranch(branchId);
  const activeGuests = getActiveGuests(branchId);
  const allBookings = getBookings(branchId, userRole);
  const todayStr = new Date().toISOString().split("T")[0];

  // Today's activity
  const todayCheckIns = allBookings.filter((b) => b.checkIn === todayStr);
  const todayCheckOuts = allBookings.filter((b) => b.checkOut === todayStr);
  const expectedArrivals = allBookings.filter(
    (b) => b.checkIn === todayStr && (b.status === "confirmed" || b.status === "pending")
  );
  const checkedInToday = allGuests.filter(
    (g) => g.checkInDate === todayStr && g.status === "checked_in"
  );

  // Unique nationalities for filter
  const nationalities = useMemo(() => {
    const set = new Set(allGuests.map((g) => g.nationality));
    return Array.from(set).sort();
  }, [allGuests]);

  // Filter guests
  const filteredGuests = useMemo(() => {
    let guests = searchTerm
      ? searchGuests(searchTerm, branchId)
      : allGuests;

    if (statusFilter !== "all") {
      guests = guests.filter((g) => g.status === statusFilter);
    }
    if (nationalityFilter !== "all") {
      guests = guests.filter((g) => g.nationality === nationalityFilter);
    }
    if (dateFilter) {
      guests = guests.filter(
        (g) => g.checkInDate === dateFilter || g.checkOutDate === dateFilter
      );
    }

    return guests;
  }, [searchTerm, statusFilter, nationalityFilter, dateFilter, allGuests, branchId, searchGuests]);

  // Today's guests (checked in today or currently staying)
  const todayGuests = useMemo(() => {
    return allGuests.filter(
      (g) =>
        g.status === "checked_in" ||
        g.checkInDate === todayStr ||
        g.checkOutDate === todayStr
    );
  }, [allGuests, todayStr]);

  const getStatusColor = (status: GuestStatus) => {
    const colors: Record<GuestStatus, string> = {
      checked_in: "bg-emerald-100 text-emerald-700",
      checked_out: "bg-gray-100 text-gray-700",
      reserved: "bg-purple-100 text-purple-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const handleViewGuest = (guest: ReturnType<typeof getGuestsByBranch>[0]) => {
    setSelectedGuest(guest);
    setShowGuestDialog(true);
  };

  const handleCheckOut = (guestId: string, name: string) => {
    updateGuestStatus(guestId, "checked_out");
    toast.success(`${name} checked out successfully`);
  };

  // Stats
  const totalRevenue = allBookings
    .filter((b) => b.status === "checked_in" || b.status === "checked_out")
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const avgStay = activeGuests.length > 0
    ? activeGuests.reduce((sum, g) => {
        const ci = new Date(g.checkInDate);
        const co = new Date(g.checkOutDate);
        return sum + Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / activeGuests.length
    : 0;

  const GuestsTable = ({ guests }: { guests: ReturnType<typeof getGuestsByBranch> }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Nationality</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => (
            <TableRow key={guest.id} className="hover:bg-pearl/30">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald text-white text-xs">
                      {guest.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-charcoal text-sm">{guest.fullName}</p>
                    <p className="text-[11px] text-text-muted-custom font-mono">{guest.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-xs text-text-muted-custom">
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[140px]">{guest.email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted-custom">
                    <Phone className="h-3 w-3" />
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
                <Badge variant="outline" className="font-mono">{guest.roomNumber}</Badge>
              </TableCell>
              <TableCell className="text-sm">{formatDate(guest.checkInDate)}</TableCell>
              <TableCell className="text-sm">{formatDate(guest.checkOutDate)}</TableCell>
              <TableCell className="text-sm text-center">{guest.numberOfGuests}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(guest.status)}>
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
          {guests.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-text-muted-custom">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="font-medium">No guests found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-emerald rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="heading-md text-charcoal">Guest Management</h1>
              <p className="text-xs text-text-muted-custom">
                {isSuperRole ? "All Branches" : user?.branchName} • Today: {formatDate(todayStr)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Guest report exported!")}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{activeGuests.length}</p>
                <p className="text-xs text-emerald-900 font-medium">Active Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <LogIn className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{todayCheckIns.length}</p>
                <p className="text-xs text-blue-900 font-medium">Today Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <LogOut className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{todayCheckOuts.length}</p>
                <p className="text-xs text-orange-900 font-medium">Today Check-outs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{expectedArrivals.length}</p>
                <p className="text-xs text-purple-900 font-medium">Expected Arrivals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{avgStay.toFixed(1)}</p>
                <p className="text-xs text-yellow-900 font-medium">Avg Stay (nights)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gold rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-charcoal" />
              </div>
              <div>
                <p className="text-lg font-bold text-gold-dark">{allGuests.length}</p>
                <p className="text-xs text-charcoal font-medium">Total Registered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Today / All Guests / Expected */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="gap-1.5">
            <CalendarCheck className="h-4 w-4" />
            Today ({todayGuests.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <Users className="h-4 w-4" />
            All Guests ({allGuests.length})
          </TabsTrigger>
          <TabsTrigger value="expected" className="gap-1.5">
            <Plane className="h-4 w-4" />
            Expected ({expectedArrivals.length})
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-4">
          {/* Today alerts */}
          {expectedArrivals.length > 0 && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-blue-900 mb-1">
                  {expectedArrivals.length} Guest{expectedArrivals.length > 1 ? "s" : ""} Expected Today
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expectedArrivals.map((b) => (
                    <Badge key={b.id} variant="outline" className="text-xs border-blue-300 text-blue-700">
                      {b.guestName} • Room {b.roomNumber}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today&apos;s Guest Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <GuestsTable guests={todayGuests} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Guests Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">Guest Registry</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                    <Input
                      placeholder="Search name, email, room, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {nationalities.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                    placeholder="Filter by date"
                  />
                  {(statusFilter !== "all" || nationalityFilter !== "all" || dateFilter || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setNationalityFilter("all");
                        setDateFilter("");
                        setSearchTerm("");
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted-custom mb-3">
                Showing {filteredGuests.length} of {allGuests.length} guests
              </p>
              <GuestsTable guests={filteredGuests} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expected Arrivals Tab */}
        <TabsContent value="expected" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Expected Arrivals & Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allBookings
                  .filter((b) => b.status === "confirmed" || b.status === "pending")
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:border-emerald/30 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={booking.guestAvatar} alt={booking.guestName} />
                        <AvatarFallback>
                          {booking.guestName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-charcoal">{booking.guestName}</p>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {booking.id}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-muted-custom">
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" />
                            Room {booking.roomNumber} • {getRoomTypeLabel(booking.roomType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                          </span>
                        </div>
                        {booking.addOns.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {booking.addOns.map((addon) => (
                              <Badge key={addon} variant="outline" className="text-[10px] px-1.5 py-0">
                                {addon}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-charcoal mb-1">
                          {formatCurrency(booking.totalAmount)}
                        </p>
                        <Badge
                          className={
                            booking.status === "confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {allBookings.filter((b) => b.status === "confirmed" || b.status === "pending").length === 0 && (
                  <div className="text-center py-12 text-text-muted-custom">
                    <Plane className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No upcoming arrivals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guest Detail Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
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
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-emerald text-white">
                      {selectedGuest.fullName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-charcoal">
                      {selectedGuest.fullName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(selectedGuest.status)}>
                        {selectedGuest.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-text-muted-custom font-mono">{selectedGuest.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-muted-custom text-xs">Email</p>
                  <p className="font-medium">{selectedGuest.email}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Phone</p>
                  <p className="font-medium">{selectedGuest.phone}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Nationality</p>
                  <p className="font-medium flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {selectedGuest.nationality}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">
                    ID ({selectedGuest.idType.replace("_", " ")})
                  </p>
                  <p className="font-medium font-mono text-xs">{selectedGuest.idNumber}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Room</p>
                  <p className="font-medium flex items-center gap-1">
                    <BedDouble className="h-3 w-3" /> {selectedGuest.roomNumber}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Guests</p>
                  <p className="font-medium">{selectedGuest.numberOfGuests}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Check-in</p>
                  <p className="font-medium">{formatDate(selectedGuest.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Check-out</p>
                  <p className="font-medium">{formatDate(selectedGuest.checkOutDate)}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Registered</p>
                  <p className="font-medium text-xs">{new Date(selectedGuest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-muted-custom text-xs">Stay Duration</p>
                  <p className="font-medium">
                    {Math.ceil(
                      (new Date(selectedGuest.checkOutDate).getTime() - new Date(selectedGuest.checkInDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    nights
                  </p>
                </div>
              </div>

              {selectedGuest.specialRequests && (
                <div className="text-sm">
                  <p className="text-text-muted-custom text-xs">Special Requests</p>
                  <p className="font-medium mt-1 bg-pearl/50 rounded p-2 text-sm">
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
                      setShowGuestDialog(false);
                    }}
                    className="flex-1 bg-emerald hover:bg-emerald-dark text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Check Out Guest
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowGuestDialog(false)}
                  className="flex-1"
                >
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
