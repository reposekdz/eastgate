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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatDate } from "@/lib/format";
import LoyaltyBadge from "@/components/admin/shared/LoyaltyBadge";
import type { Guest } from "@/lib/types/schema";
import {
  Search,
  Users,
  Award,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  BedDouble,
} from "lucide-react";

export default function GuestsPage() {
  const { user } = useAuthStore();
  const getGuests = useBranchStore((s) => s.getGuests);
  const [tierFilter, setTierFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const branchId = user?.role === "super_admin" || user?.role === "super_manager" ? "all" : (user?.branchId ?? "br-001");
  const role = user?.role ?? "guest";
  const guests = getGuests(branchId, role);

  const filtered = guests.filter((g) => {
    if (tierFilter !== "all") {
      if (tierFilter === "member" && g.loyaltyTier !== null) return false;
      if (tierFilter !== "member" && g.loyaltyTier !== tierFilter) return false;
    }
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalGuests = guests.length;
  const platCount = guests.filter((g) => g.loyaltyTier === "platinum").length;
  const avgSpend = guests.length ? Math.round(guests.reduce((s, g) => s + g.totalSpent, 0) / guests.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-md text-charcoal">Guests & CRM</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Manage guest profiles, loyalty tiers, and engagement
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <Users className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{totalGuests}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total Guests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-loyalty-platinum/10 shrink-0">
              <Award className="h-4 w-4 text-loyalty-platinum" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{platCount}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Platinum Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-gold/10 shrink-0">
              <TrendingUp className="h-4 w-4 text-gold-dark" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{formatCurrency(avgSpend)}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Avg. Spend</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="py-4 shadow-xs border-transparent">
        <CardContent className="px-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px] h-8 text-sm">
                <SelectValue placeholder="Loyalty Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-pearl">
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Guest</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Tier</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden sm:table-cell">Total Stays</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden lg:table-cell">Total Spent</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Points</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold text-right">Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guest) => (
                <TableRow
                  key={guest.id}
                  className="hover:bg-pearl/30 border-b-pearl/50 cursor-pointer"
                  onClick={() => setSelectedGuest(guest)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={guest.avatar} alt={guest.name} />
                        <AvatarFallback className="text-[10px] bg-emerald/10 text-emerald">
                          {guest.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{guest.name}</p>
                        <p className="text-[11px] text-text-muted-custom">{guest.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><LoyaltyBadge tier={guest.loyaltyTier} /></TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-charcoal font-medium">{guest.totalStays}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-charcoal font-medium">{formatCurrency(guest.totalSpent)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-gold-dark font-medium">{guest.loyaltyPoints.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm text-slate-custom">{formatDate(guest.lastVisit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Guest Profile Sheet */}
      <Sheet open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Guest Profile</SheetTitle>
            <SheetDescription>Detailed guest information and history</SheetDescription>
          </SheetHeader>
          {selectedGuest && (
            <div className="space-y-5 mt-4 px-1">
              {/* Profile */}
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedGuest.avatar} alt={selectedGuest.name} />
                  <AvatarFallback className="bg-emerald/10 text-emerald text-lg">
                    {selectedGuest.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-charcoal">{selectedGuest.name}</p>
                  <LoyaltyBadge tier={selectedGuest.loyaltyTier} />
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-slate-custom">{selectedGuest.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-slate-custom">{selectedGuest.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-text-muted-custom shrink-0" />
                  <span className="text-slate-custom">{selectedGuest.nationality}</span>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BedDouble className="h-3 w-3 text-text-muted-custom" />
                    <span className="text-[10px] uppercase tracking-wider text-text-muted-custom">Total Stays</span>
                  </div>
                  <p className="text-lg font-bold text-charcoal">{selectedGuest.totalStays}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="h-3 w-3 text-text-muted-custom" />
                    <span className="text-[10px] uppercase tracking-wider text-text-muted-custom">Total Spent</span>
                  </div>
                  <p className="text-lg font-bold text-charcoal">{formatCurrency(selectedGuest.totalSpent)}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Award className="h-3 w-3 text-text-muted-custom" />
                    <span className="text-[10px] uppercase tracking-wider text-text-muted-custom">Points</span>
                  </div>
                  <p className="text-lg font-bold text-gold-dark">{selectedGuest.loyaltyPoints.toLocaleString()}</p>
                </div>
                <div className="bg-pearl/50 rounded-[8px] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3 w-3 text-text-muted-custom" />
                    <span className="text-[10px] uppercase tracking-wider text-text-muted-custom">Last Visit</span>
                  </div>
                  <p className="text-sm font-bold text-charcoal">{formatDate(selectedGuest.lastVisit)}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
