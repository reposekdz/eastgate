import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";

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

export function useAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const branchId = user?.branchId || "all";
        const res = await fetch(`/api/admin/dashboard?branchId=${branchId}`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.branchId]);

  return { data, loading, error, refetch: () => setLoading(true) };
}
