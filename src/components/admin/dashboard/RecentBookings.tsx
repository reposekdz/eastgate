"use client";

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bookings } from "@/lib/mock-data";
import { formatCurrency, formatDate, getBookingStatusLabel, getRoomTypeLabel } from "@/lib/format";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import BookingStatusBadge from "@/components/admin/shared/BookingStatusBadge";

export default function RecentBookings() {
  const recentBookings = bookings.slice(0, 5);

  return (
    <Card className="py-4 shadow-xs border-transparent">
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-sm font-semibold text-charcoal">Recent Bookings</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-xs text-emerald hover:text-emerald-dark" asChild>
            <Link href="/admin/bookings">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-5 pt-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-pearl">
              <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Guest</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Room</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Check-in</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden sm:table-cell">Amount</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBookings.map((booking) => (
              <TableRow key={booking.id} className="hover:bg-pearl/30 border-b-pearl/50">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={booking.guestAvatar} alt={booking.guestName} />
                      <AvatarFallback className="text-[10px] bg-emerald/10 text-emerald">
                        {booking.guestName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-charcoal leading-tight">{booking.guestName}</p>
                      <p className="text-[11px] text-text-muted-custom">{booking.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-charcoal">{booking.roomNumber}</p>
                  <p className="text-[11px] text-text-muted-custom">{getRoomTypeLabel(booking.roomType)}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-slate-custom">{formatDate(booking.checkIn)}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm font-medium text-charcoal">{formatCurrency(booking.totalAmount)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
