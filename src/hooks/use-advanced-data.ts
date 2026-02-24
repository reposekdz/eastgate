import { useState, useEffect, useCallback } from "react";

export function useAdvancedData<T>(endpoint: string, options: Record<string, any> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err) {
      setError("Network error");
      console.error(`Fetch error (${endpoint}):`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(options)]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options.autoFetch]);

  const mutate = async (method: string, body?: any) => {
    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchData();
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      setError("Mutation error");
      return { success: false, error: "Mutation failed" };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create: (body: any) => mutate("POST", body),
    update: (body: any) => mutate("PUT", body),
    remove: (id: string) => mutate("DELETE", { id }),
  };
}

export function useDashboard(branchId?: string) {
  return useAdvancedData("/api/analytics/dashboard", { branchId });
}

export function useGuests(options: any = {}) {
  return useAdvancedData("/api/guests", options);
}

export function usePromotions(branchId?: string) {
  return useAdvancedData("/api/promotions", { branchId, isActive: true });
}

export function useRoomAnalytics(branchId?: string) {
  return useAdvancedData("/api/analytics/rooms", { branchId });
}
