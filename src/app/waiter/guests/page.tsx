"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Phone, Mail, User } from "lucide-react";
import { toast } from "sonner";

export default function WaiterGuestsPage() {
  const { user } = useAuthStore();
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGuests();
  }, [user?.branchId]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guests?branchId=${user?.branchId}`);
      const data = await res.json();
      if (data.success) {
        setGuests(data.data.guests || []);
      }
    } catch (error) {
      toast.error("Failed to fetch guests");
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter((g) =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.phone?.includes(searchTerm) ||
    g.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Guest Directory</h1>
          <p className="text-muted-foreground">View branch guests for service</p>
        </div>
        <Button onClick={fetchGuests} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guests by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGuests.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">
              {searchTerm ? "No guests found" : "No guests registered"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No guests match your search for "${searchTerm}".`
                : "No guests have been registered yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="p-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{guest.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {guest.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {guest.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {guest.idNumber}
                  </span>
                  <span className="text-sm text-gray-600">
                    {guest.nationality}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge variant={guest.loyaltyTier === 'gold' ? 'default' : 'secondary'}>
                    {guest.loyaltyTier} Member
                  </Badge>
                  {guest._count?.bookings > 0 && (
                    <Badge variant="outline">
                      {guest._count.bookings} Bookings
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}