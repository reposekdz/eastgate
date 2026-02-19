"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatDate, getRoomTypeLabel } from "@/lib/format";
import BookingStatusBadge from "@/components/admin/shared/BookingStatusBadge";
import type { BookingStatus } from "@/lib/types/enums";
import type { Booking } from "@/lib/types/schema";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  XCircle,
  Download,
  CalendarCheck,
  LogIn,
  LogOut,
  Clock,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Mail,
  Phone,
  Trash2,
  RefreshCw,
  UserPlus,
} from "lucide-react";

const statusFilters: { label: string; value: string; color: string }[] = [
  { label: "All", value: "all", color: "bg-slate-100" },
  { label: "Pending", value: "pending", color: "bg-orange-100" },
  { label: "Confirmed", value: "confirmed", color: "bg-blue-100" },
  { label: "Checked In", value: "checked_in", color: "bg-emerald-100" },
  { label: "Checked Out", value: "checked_out", color: "bg-slate-200" },
  { label: "Cancelled", value: "cancelled", color: "bg-red-100" },
];

export default function BookingsPage() {
  const { user } = useAuthStore();
  const getBookings = useBranchStore((s) => s.getBookings);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [showFilters, setShowFilters] = useState(false);

  const branchId = user?.role === "super_admin" || user?.role === "super_manager" ? "all" : (user?.branchId ?? "br-001");
  const role = user?.role ?? "guest";
  const bookings = getBookings(branchId, role);

  // Filter and sort bookings
  const filtered = useMemo(() => {
    let result = bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (search && 
          !b.guestName.toLowerCase().includes(search.toLowerCase()) && 
          !b.id.toLowerCase().includes(search.toLowerCase()) &&
          !b.guestEmail?.toLowerCase().includes(search.toLowerCase())) 
        return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
      }
      return b.totalAmount - a.totalAmount;
    });

    return result;
  }, [bookings, statusFilter, search, sortBy]);

  const countByStatus = (s: BookingStatus) => bookings.filter((b) => b.status === s).length;

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedBookings.length === filtered.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filtered.map(b => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedBookings(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on bookings:`, selectedBookings);
    setSelectedBookings([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Bookings Management</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage reservations, check-ins & guest bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-[6px] gap-2 text-sm">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm">
            <Plus className="h-4 w-4" /> New Booking
          </Button>
        </div>
      </div>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        {statusFilters.map((sf) => (
          <Card 
            key={sf.value} 
            className={`py-3 shadow-xs border-transparent cursor-pointer transition-all ${
              statusFilter === sf.value ? "ring-2 ring-emerald" : ""
            }`}
            onClick={() => setStatusFilter(sf.value)}
          >
            <CardContent className="px-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${sf.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-charcoal">
                  {sf.value === "all" ? bookings.length : countByStatus(sf.value as BookingStatus)}
                </p>
                <p className="text-[10px] text-text-muted-custom truncate">{sf.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="py-3 shadow-xs border-transparent">
        <CardContent className="px-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
              <Input
                placeholder="Search by guest, ID, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-8 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <XCircle className="h-4 w-4 text-text-muted-custom" />
                </button>
              )}
            </div>

            {/* Sort */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setSortBy(sortBy === "date" ? "amount" : "date")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortBy === "date" ? "Sort by Date" : "Sort by Amount"}
            </Button>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 ${showFilters ? "bg-pearl" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </Button>

            {/* Bulk Actions */}
            {selectedBookings.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-muted-custom">
                  {selectedBookings.length} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleBulkAction("confirm")}>
                      <CalendarCheck className="h-3.5 w-3.5 mr-2" /> Confirm Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("email")}>
                      <Mail className="h-3.5 w-3.5 mr-2" /> Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("export")}>
                      <Download className="h-3.5 w-3.5 mr-2" /> Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction("cancel")} className="text-red-600">
                      <XCircle className="h-3.5 w-3.5 mr-2" /> Cancel Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBookings([])}
                  className="h-8"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-pearl">
            <div className="flex items-center gap-2 text-xs text-text-muted-custom">
              <Clock className="h-3.5 w-3.5" />
              <span>Pending: {countByStatus("pending")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted-custom">
              <LogIn className="h-3.5 w-3.5" />
              <span>Checked In: {countByStatus("checked_in")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted-custom">
              <span>Total Revenue: {formatCurrency(bookings.reduce((sum, b) => sum + b.totalAmount, 0))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="py-0 shadow-xs border-transparent overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-pearl bg-pearl/30">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedBookings.length === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Guest</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Room</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Check-in</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Check-out</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden sm:table-cell">Amount</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow
                  key={booking.id}
                  className={cn(
                    "hover:bg-pearl/30 border-b-pearl/50 cursor-pointer",
                    selectedBookings.includes(booking.id) && "bg-emerald/5"
                  )}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedBookings.includes(booking.id)}
                      onCheckedChange={() => toggleSelect(booking.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={booking.guestAvatar} alt={booking.guestName} />
                        <AvatarFallback className="text-[10px] bg-emerald/10 text-emerald">
                          {booking.guestName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{booking.guestName}</p>
                        <p className="text-[11px] text-text-muted-custom">{booking.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-charcoal">{booking.roomNumber}</p>
                    <p className="text-[11px] text-text-muted-custom">{getRoomTypeLabel(booking.roomType)}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-custom">{formatDate(booking.checkIn)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-custom">{formatDate(booking.checkOut)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm font-medium text-charcoal">{formatCurrency(booking.totalAmount)}</TableCell>
                  <TableCell><BookingStatusBadge status={booking.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="text-text-muted-custom">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                          <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-3.5 w-3.5 mr-2" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-3.5 w-3.5 mr-2" /> Call Guest
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {booking.status === "pending" && (
                          <DropdownMenuItem>
                            <CalendarCheck className="h-3.5 w-3.5 mr-2" /> Confirm
                          </DropdownMenuItem>
                        )}
                        {booking.status === "confirmed" && (
                          <DropdownMenuItem>
                            <LogIn className="h-3.5 w-3.5 mr-2" /> Check In
                          </DropdownMenuItem>
                        )}
                        {booking.status === "checked_in" && (
                          <DropdownMenuItem>
                            <LogOut className="h-3.5 w-3.5 mr-2" /> Check Out
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="h-3.5 w-3.5 mr-2" /> Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <CalendarCheck className="h-12 w-12 text-text-muted-custom/30 mx-auto mb-3" />
            <p className="text-sm text-text-muted-custom">No bookings match your filters</p>
          </div>
        )}
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Booking {selectedBooking?.id}
              {selectedBooking && <BookingStatusBadge status={selectedBooking.status} />}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-5 mt-2">
              {/* Guest Info */}
              <div className="flex items-center gap-3 p-3 bg-pearl/50 rounded-[8px]">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedBooking.guestAvatar} alt={selectedBooking.guestName} />
                  <AvatarFallback className="bg-emerald/10 text-emerald">
                    {selectedBooking.guestName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-charcoal">{selectedBooking.guestName}</p>
                  <p className="text-xs text-text-muted-custom">{selectedBooking.guestEmail}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pearl/30 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Room</p>
                  <p className="text-sm font-semibold text-charcoal">{selectedBooking.roomNumber} · {getRoomTypeLabel(selectedBooking.roomType)}</p>
                </div>
                <div className="bg-pearl/30 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Total Amount</p>
                  <p className="text-sm font-semibold text-charcoal">{formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
                <div className="bg-pearl/30 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Check-in</p>
                  <p className="text-sm font-semibold text-charcoal">{formatDate(selectedBooking.checkIn)}</p>
                </div>
                <div className="bg-pearl/30 rounded-[8px] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Check-out</p>
                  <p className="text-sm font-semibold text-charcoal">{formatDate(selectedBooking.checkOut)}</p>
                </div>
              </div>

              {/* Add-ons */}
              {selectedBooking.addOns.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold mb-2">Add-ons</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBooking.addOns.map((addon) => (
                      <Badge key={addon} variant="outline" className="text-xs rounded-[4px] bg-gold/5 text-gold-dark border-gold/20">
                        {addon}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedBooking.status === "pending" && (
                  <Button className="flex-1 bg-emerald hover:bg-emerald-dark text-white rounded-[6px] text-sm">Confirm</Button>
                )}
                {selectedBooking.status === "confirmed" && (
                  <Button className="flex-1 bg-status-occupied hover:bg-status-occupied/90 text-white rounded-[6px] text-sm">Check In</Button>
                )}
                {selectedBooking.status === "checked_in" && (
                  <Button className="flex-1 bg-slate-custom hover:bg-charcoal text-white rounded-[6px] text-sm">Check Out</Button>
                )}
                <Button variant="outline" className="rounded-[6px] text-sm">Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for cn
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
