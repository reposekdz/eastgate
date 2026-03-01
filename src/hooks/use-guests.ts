import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store";

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  nationality: string;
  dateOfBirth: string;
  address: string;
  loyaltyTier: string;
  totalSpent: number;
  lastVisit: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    location: string;
  };
  _count: {
    bookings: number;
  };
}

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchGuests = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      if (search) searchParams.append("search", search);
      
      const response = await fetch(`/api/guests?${searchParams}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch guests");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGuests(data.data.guests);
        return data.data.guests;
      } else {
        throw new Error(data.message || "Failed to fetch guests");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchGuests = useCallback(async (query: string): Promise<Guest[]> => {
    if (!query || query.length < 2) return [];
    return await fetchGuests(query);
  }, [fetchGuests]);

  const createGuest = async (guestData: {
    name: string;
    email: string;
    phone: string;
    idNumber: string;
    nationality: string;
    dateOfBirth: string;
    address: string;
  }) => {
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(guestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create guest");
      }
      
      const result = await response.json();
      return result.data;
    } catch (err) {
      throw err;
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchGuests();
    }
  }, [user, fetchGuests]);

  return {
    guests,
    loading,
    error,
    fetchGuests,
    searchGuests,
    createGuest,
    refetch: () => fetchGuests(),
  };
}