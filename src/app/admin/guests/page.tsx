"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency, formatDate } from "@/lib/format";
import LoyaltyBadge from "@/components/admin/shared/LoyaltyBadge";
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
  Download,
  Star,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const tierFilters = [
  { label: "All", value: "all" },
  { label: "Platinum", value: "platinum", color: "bg-purple-100" },
  { label: "Gold", value: "gold", color: "bg-yellow-100" },
  { label: "Silver", value: "silver", color: "bg-slate-100" },
  { label: "Bronze", value: "bronze", color: "bg-emerald-100" },
];

export default function GuestsPage() {
  const { user } = useAuthStore();
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "spent" | "stays" | "lastVisit">("spent");

  const isSuperUser = user?.role === "SUPER_ADMIN" || user?.role === "SUPER_MANAGER";
  const branchId = isSuperUser ? undefined : user?.branchId;

  // Fetch guests from API
  useEffect(() => {
    async function fetchGuests() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (branchId) params.append("branchId", branchId);
        params.append("includeBookings", "true");
        
        const res = await fetch(`/api/guests?${params}`);
        const data = await res.json();
        
        if (data.success) {
          setGuests(data.guests || []);
        }
      } catch (error) {
        console.error("Failed to fetch guests:", error);
        toast.error("Failed to load guests");
      } finally {
        setLoading(false);
      }
    }
    
    fetchGuests();
  }, [branchId]);

  // Filter and sort guests
  const filtered = useMemo(() => {
    let result = guests.filter((g) => {
      if (tierFilter !== "all") {
        if (tierFilter === "member" && g.loyaltyTier !== null) return false;
        if (tierFilter !== "member" && g.loyaltyTier !== tierFilter) return false;
      }
      if (search && 
          !g.name.toLowerCase().includes(search.toLowerCase()) && 
          !g.email.toLowerCase().includes(search.toLowerCase()) &&
          !g.phone?.includes(search)) 
        return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "spent":
          return b.totalSpent - a.totalSpent;
        case "stays":
          return b.totalStays - a.totalStays;
        case "lastVisit":
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [guests, tierFilter, search, sortBy]);

  const totalGuests = guests.length;
  const platCount = guests.filter((g) => g.loyaltyTier === "platinum").length;
  const goldCount = guests.filter((g) => g.loyaltyTier === "gold").length;
  const avgSpend = guests.length ? Math.round(guests.reduce((s, g) => s + g.totalSpent, 0) / guests.length) : 0;

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedGuests.length === filtered.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filtered.map(g => g.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedGuests(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on guests:`, selectedGuests);
    setSelectedGuests([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Guests & CRM</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage guest profiles, loyalty tiers, and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="bg-emerald hover:bg-emerald-dark text-white gap-2 text-sm">
            <Users className="h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {tierFilters.map((tf) => (
          <Card 
            key={tf.value} 
            className={`py-3 shadow-xs border-transparent cursor-pointer transition-all ${
              tierFilter === tf.value ? "ring-2 ring-emerald" : ""
            }`}
            onClick={() => setTierFilter(tf.value)}
          >
            <CardContent className="px-3 flex items-center gap-2">
              {tf.value !== "all" && <div className={`w-2 h-2 rounded-full ${tf.color}`} />}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-charcoal">
                  {tf.value === "all" 
                    ? guests.length 
                    : tf.value === "member" 
                      ? guests.filter((g) => g.loyaltyTier !== null && !["platinum", "gold", "silver"].includes(g.loyaltyTier)).length
                      : guests.filter((g) => g.loyaltyTier === tf.value).length
                  }
                </p>
                <p className="text-[10px] text-text-muted-custom truncate">{tf.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-loyalty-platinum/10 shrink-0">
              <Award className="h-4 w-4 text-loyalty-platinum" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{platCount}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Platinum</p>
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
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <Star className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{guests.reduce((s, g) => s + g.loyaltyPoints, 0).toLocaleString()}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total Points</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="py-4 shadow-xs border-transparent">
        <CardContent className="px-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted-custom" />
              <Input
                placeholder="Search by name, email, phone..."
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
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="spent">Total Spent</SelectItem>
                <SelectItem value="stays">Total Stays</SelectItem>
                <SelectItem value="lastVisit">Last Visit</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedGuests.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-muted-custom">
                  {selectedGuests.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("email")}
                  className="h-8 gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("export")}
                  className="h-8 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGuests([])}
                  className="h-8"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-pearl bg-pearl/30">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedGuests.length === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold">Guest</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Tier</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden sm:table-cell">Stays</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden lg:table-cell">Spent</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold hidden md:table-cell">Points</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-text-muted-custom font-semibold text-right">Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((guest) => (
                <TableRow
                  key={guest.id}
                  className={`hover:bg-pearl/30 border-b-pearl/50 cursor-pointer ${
                    selectedGuests.includes(guest.id) ? "bg-emerald/5" : ""
                  }`}
                  onClick={() => setSelectedGuest(guest)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedGuests.includes(guest.id)}
                      onCheckedChange={() => toggleSelect(guest.id)}
                    />
                  </TableCell>
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

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-text-muted-custom/30 mx-auto mb-3" />
              <p className="text-sm text-text-muted-custom">No guests found</p>
            </div>
          )}
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

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-emerald hover:bg-emerald-dark text-white" size="sm">
                  <Mail className="h-4 w-4 mr-2" /> Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
