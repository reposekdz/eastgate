import { useState, useEffect, useCallback } from "react";

export interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  description?: string;
  imageUrl?: string;
  maxOccupancy?: number;
  size?: number;
  status: string;
  branch: {
    id: string;
    name: string;
    location?: string;
  };
  roomAmenities?: Array<{ amenity: string }>;
}

interface UseRoomsOptions {
  branchId?: string;
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export function useRooms(options: UseRoomsOptions = {}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.branchId) params.append("branchId", options.branchId);
      if (options.type) params.append("type", options.type);
      if (options.status) params.append("status", options.status);
      if (options.minPrice) params.append("minPrice", options.minPrice.toString());
      if (options.maxPrice) params.append("maxPrice", options.maxPrice.toString());
      if (options.search) params.append("search", options.search);
      if (options.page) params.append("page", options.page.toString());
      if (options.limit) params.append("limit", options.limit.toString());

      const response = await fetch(`/api/public/rooms?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRooms(data.rooms);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setError(data.error || "Failed to fetch rooms");
      }
    } catch (err) {
      setError("Network error");
      console.error("Fetch rooms error:", err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchRooms();
    }
  }, [fetchRooms, options.autoFetch]);

  const checkAvailability = async (checkIn: string, checkOut: string, guests?: number) => {
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          branchId: options.branchId,
          roomType: options.type,
          guests,
        }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Availability check error:", err);
      return { success: false, error: "Failed to check availability" };
    }
  };

  return {
    rooms,
    loading,
    error,
    pagination,
    fetchRooms,
    checkAvailability,
  };
}
