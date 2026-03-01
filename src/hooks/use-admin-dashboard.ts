import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";

export interface DashboardData {
  kpi: {
    totalRevenue: number;
    revenueChange: number;
    occupancyRate: number;
    occupancyChange: number;
    adr: number;
    adrChange: number;
    revpar: number;
    revparChange: number;
  };
  revenueData: Array<{
    month: string;
    rooms: number;
    restaurant: number;
    events: number;
    spa: number;
    services: number;
  }>;
  occupancyData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentBookings: Array<any>;
  todaySummary: {
    checkInsToday: number;
    checkOutsToday: number;
    activeOrders: number;
    upcomingEvents: number;
  };
}

// Mock data for development
const mockData: DashboardData = {
  kpi: {
    totalRevenue: 2450000,
    revenueChange: 12.5,
    occupancyRate: 78.5,
    occupancyChange: 5.2,
    adr: 85000,
    adrChange: 8.1,
    revpar: 66750,
    revparChange: 14.3,
  },
  revenueData: [
    { month: "Jan", rooms: 450000, restaurant: 120000, events: 80000, spa: 45000, services: 25000 },
    { month: "Feb", rooms: 520000, restaurant: 135000, events: 95000, spa: 52000, services: 28000 },
    { month: "Mar", rooms: 480000, restaurant: 128000, events: 88000, spa: 48000, services: 26000 },
    { month: "Apr", rooms: 610000, restaurant: 145000, events: 110000, spa: 58000, services: 32000 },
    { month: "May", rooms: 580000, restaurant: 142000, events: 105000, spa: 55000, services: 30000 },
    { month: "Jun", rooms: 650000, restaurant: 158000, events: 125000, spa: 62000, services: 35000 },
  ],
  occupancyData: [
    { name: "Occupied", value: 78, color: "#10b981" },
    { name: "Available", value: 22, color: "#e5e7eb" },
  ],
  recentBookings: [],
  todaySummary: {
    checkInsToday: 12,
    checkOutsToday: 8,
    activeOrders: 15,
    upcomingEvents: 3,
  },
};

export function useAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { selectedBranchId } = useBranchStore();

  useEffect(() => {
    // Use mock data for now to avoid API issues
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedBranchId]);

  return { data, loading, error, refetch: () => setLoading(true) };
}
