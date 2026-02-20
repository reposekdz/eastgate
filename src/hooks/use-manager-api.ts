import { useState, useCallback } from "react";

interface UseManagerApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useManagerApi<T = any>(endpoint: string, options?: UseManagerApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (method: string = "GET", body?: any, queryParams?: Record<string, string>) => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`/api/manager/${endpoint}`, window.location.origin);
        if (queryParams) {
          Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
          });
        }

        const response = await fetch(url.toString(), {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          ...(body && { body: JSON.stringify(body) }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Request failed");
        }

        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "An error occurred";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, options]
  );

  const get = useCallback(
    (queryParams?: Record<string, string>) => execute("GET", undefined, queryParams),
    [execute]
  );

  const post = useCallback((body: any) => execute("POST", body), [execute]);

  const patch = useCallback((body: any) => execute("PATCH", body), [execute]);

  const del = useCallback(
    (queryParams?: Record<string, string>) => execute("DELETE", undefined, queryParams),
    [execute]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    get,
    post,
    patch,
    delete: del,
    reset,
  };
}

// Specific hooks for each endpoint
export function useDashboard(branchId: string, period: string = "today") {
  return useManagerApi("dashboard", {
    onSuccess: (data) => console.log("Dashboard loaded:", data),
  });
}

export function useBookings(branchId: string) {
  return useManagerApi("bookings");
}

export function useStaff(branchId: string) {
  return useManagerApi("staff");
}

export function useOrders(branchId: string) {
  return useManagerApi("orders");
}

export function useServices(branchId: string) {
  return useManagerApi("services");
}

export function useAnalytics(branchId: string, period: string = "month") {
  return useManagerApi("analytics");
}

export function useReports(branchId: string) {
  return useManagerApi("reports");
}
