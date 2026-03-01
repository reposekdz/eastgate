import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth-store";

export interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  price: number;
  maxOccupancy: number;
  status: string;
  description?: string;
  imageUrl?: string;
  branchId: string;
  branch: {
    id: string;
    name: string;
    location: string;
  };
  amenities: string[];
  isCurrentlyOccupied: boolean;
  currentGuest?: string;
  nextCheckOut?: string;
  totalBookings: number;
}

export interface RoomStats {
  totalAvailable: number;
  totalRooms?: number;
  occupied?: number;
  maintenance?: number;
  cleaning?: number;
  byType: Array<{
    type: string;
    count: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  floors: number[];
}

export interface RoomFilters {
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  minPrice?: string;
  maxPrice?: string;
  floor?: string;
  guests?: number;
}

export function useAvailableRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RoomFilters>({});
  const { user } = useAuthStore();

  const fetchRooms = useCallback(async (newFilters?: RoomFilters) => {
    if (!user?.branchId) {
      setError("No branch assigned to user");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      const currentFilters = { ...filters, ...newFilters };
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString());
        }
      });
      
      console.log('User details:', {
        role: user.role,
        branchId: user.branchId,
        email: user.email
      });
      
      const response = await fetch(`/api/receptionist/available-rooms?${searchParams}`, {
        credentials: "include",
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        setRooms(data.data.rooms || []);
        setStats(data.data.stats || null);
        setFilters(currentFilters);
      } else {
        throw new Error(data.message || "Failed to fetch rooms");
      }
    } catch (err) {
      console.error('Fetch rooms error:', err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user?.branchId]); // Only depend on user.branchId

  const assignRoom = async (assignmentData: {
    guestId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    infants?: number;
    specialRequests?: string;
    paymentMethod: string;
    paymentStatus: "pending" | "paid";
    totalAmount?: number;
  }) => {
    try {
      const response = await fetch("/api/receptionist/available-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(assignmentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign room");
      }
      
      const result = await response.json();
      
      // Refresh rooms list after assignment
      await fetchRooms();
      
      return result.data;
    } catch (err) {
      throw err;
    }
  };

  const updateFilters = useCallback((newFilters: Partial<RoomFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchRooms(newFilters);
  }, [filters, fetchRooms]);

  const clearFilters = useCallback(() => {
    setFilters({});
    fetchRooms({});
  }, [fetchRooms]);

  // Initial load
  useEffect(() => {
    if (user?.branchId) {
      console.log('User loaded, fetching rooms for branch:', user.branchId);
      fetchRooms();
    } else {
      console.log('No user or branchId available:', user);
    }
  }, [user?.branchId]); // Remove fetchRooms dependency

  return {
    rooms,
    stats,
    loading,
    error,
    filters,
    fetchRooms,
    assignRoom,
    updateFilters,
    clearFilters,
    refetch: () => fetchRooms(filters),
  };
}