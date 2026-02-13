"use client";

import { useState } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bookings } from "@/lib/mock-data";
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
} from "lucide-react";

const statusFilters: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked In", value: "checked_in" },
  { label: "Checked Out", value: "checked_out" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search && !b.guestName.toLowerCase().includes(search.toLowerCase()) && !b.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countByStatus = (s: BookingStatus) => bookings.filter((b) => b.status === s).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Bookings</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage all reservations and guest check-ins
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <CalendarCheck className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{bookings.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-status-occupied/10 shrink-0">
              <LogIn className="h-4 w-4 text-status-occupied" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{countByStatus("checked_in")}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-order-pending/10 shrink-0">
              <Clock className="h-4 w-4 text-order-pending" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{countByStatus("pending")}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-100 shrink-0">
              <LogOut className="h-4 w-4 text-slate-custom" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{countByStatus("checked_out")}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Checked Out</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card className="py-4 shadow-xs border-transparent">
        <CardContent className="px-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
              <Input
                placeholder="Search by guest name or booking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {statusFilters.map((sf) => (
                <Button
                  key={sf.value}
                  variant={statusFilter === sf.value ? "default" : "outline"}
                  size="sm"
                  className={`text-xs rounded-[6px] h-8 ${
                    statusFilter === sf.value
                      ? "bg-emerald hover:bg-emerald-dark text-white"
                      : ""
                  }`}
                  onClick={() => setStatusFilter(sf.value)}
                >
                  {sf.label}
                  {sf.value !== "all" && (
                    <span className="ml-1 text-[10px] opacity-70">
                      {countByStatus(sf.value as BookingStatus)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-pearl">
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
                    className="hover:bg-pearl/30 border-b-pearl/50 cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Booking {selectedBooking?.id}
              {selectedBooking && <BookingStatusBadge status={selectedBooking.status} />}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking && `${selectedBooking.guestName} · ${getRoomTypeLabel(selectedBooking.roomType)}`}
            </DialogDescription>
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
