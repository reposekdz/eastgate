"use client";

import { useState, useEffect, useCallback } from "react";

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Fetch wrapper with error handling
async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Request failed" };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("API Error:", error);
    return { success: false, error: error.message || "Network error" };
  }
}

// Hook for fetching rooms from database
export function useRooms(branchId?: string) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = branchId 
      ? `/api/rooms?branchId=${branchId}`
      : "/api/rooms";

    const result = await fetchApi<any[]>(url);

    if (result.success && result.data) {
      setRooms(result.data.rooms || []);
    } else {
      setError(result.error || "Failed to fetch rooms");
    }

    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, refetch: fetchRooms };
}

// Hook for fetching menu items from database
export function useMenu(branchId?: string) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = branchId 
      ? `/api/menu?branchId=${branchId}`
      : "/api/menu";

    const result = await fetchApi<any[]>(url);

    if (result.success && result.data) {
      setMenuItems(result.data.menuItems || []);
    } else {
      setError(result.error || "Failed to fetch menu");
    }

    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { menuItems, loading, error, refetch: fetchMenu };
}

// Hook for fetching services from database
export function useServices(branchId?: string) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = branchId 
      ? `/api/services?branchId=${branchId}`
      : "/api/services";

    const result = await fetchApi<any[]>(url);

    if (result.success && result.data) {
      setServices(result.data.services || []);
    } else {
      setError(result.error || "Failed to fetch services");
    }

    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}

// Hook for fetching branches from database
export function useBranches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchApi<any[]>("/api/admin/dashboard", { method: "POST" });

    if (result.success && result.data) {
      setBranches(result.data.branches || []);
    } else {
      setError(result.error || "Failed to fetch branches");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return { branches, loading, error, refetch: fetchBranches };
}

// Hook for fetching revenue data
export function useRevenue(branchId?: string, dateFrom?: string, dateTo?: string) {
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    const result = await fetchApi<any>(`/api/revenue?${params.toString()}`);

    if (result.success && result.data) {
      setRevenue(result.data);
    } else {
      setError(result.error || "Failed to fetch revenue");
    }

    setLoading(false);
  }, [branchId, dateFrom, dateTo]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return { revenue, loading, error, refetch: fetchRevenue };
}

// Hook for fetching bookings
export function useBookings(branchId?: string, status?: string) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (status) params.append("status", status);

    const result = await fetchApi<any[]>(`/api/bookings?${params.toString()}`);

    if (result.success && result.data) {
      setBookings(result.data.bookings || []);
    } else {
      setError(result.error || "Failed to fetch bookings");
    }

    setLoading(false);
  }, [branchId, status]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, error, refetch: fetchBookings };
}

// Hook for fetching orders
export function useOrders(branchId?: string, status?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (status) params.append("status", status);

    const result = await fetchApi<any[]>(`/api/orders?${params.toString()}`);

    if (result.success && result.data) {
      setOrders(result.data.orders || []);
    } else {
      setError(result.error || "Failed to fetch orders");
    }

    setLoading(false);
  }, [branchId, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

// Hook for fetching guests
export function useGuests(branchId?: string) {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = branchId 
      ? `/api/guests?branchId=${branchId}`
      : "/api/guests";

    const result = await fetchApi<any[]>(url);

    if (result.success && result.data) {
      setGuests(result.data.guests || []);
    } else {
      setError(result.error || "Failed to fetch guests");
    }

    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  return { guests, loading, error, refetch: fetchGuests };
}

// Hook for fetching dashboard stats
export function useDashboard(branchId?: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = branchId 
      ? `/api/admin/dashboard?branchId=${branchId}`
      : "/api/admin/dashboard";

    const result = await fetchApi<any>(url);

    if (result.success && result.data) {
      setStats(result.data);
    } else {
      setError(result.error || "Failed to fetch dashboard");
    }

    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook for processing payments
export function usePayment() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (paymentData: {
    amount: number;
    paymentMethod: string;
    customerEmail: string;
    customerName?: string;
    description?: string;
    bookingId?: string;
    orderId?: string;
    branchId?: string;
  }) => {
    setProcessing(true);
    setError(null);

    const result = await fetchApi<any>("/api/payments/process", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });

    setProcessing(false);

    if (!result.success) {
      setError(result.error || "Payment failed");
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  };

  return { processPayment, processing, error };
}

// Hook for creating bookings
export function useBooking() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (bookingData: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    roomId: string;
    roomNumber?: string;
    roomType?: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    totalAmount: number;
    paymentMethod?: string;
    specialRequests?: string;
    branchId?: string;
  }) => {
    setCreating(true);
    setError(null);

    const result = await fetchApi<any>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });

    setCreating(false);

    if (!result.success) {
      setError(result.error || "Booking failed");
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  };

  return { createBooking, creating, error };
}

// Hook for creating orders
export function useOrder() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: {
    tableNumber: number;
    guestName?: string;
    items: any[];
    total: number;
    roomCharge?: boolean;
    notes?: string;
    roomId?: string;
    branchId?: string;
  }) => {
    setCreating(true);
    setError(null);

    const result = await fetchApi<any>("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });

    setCreating(false);

    if (!result.success) {
      setError(result.error || "Order creation failed");
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  };

  return { createOrder, creating, error };
}
