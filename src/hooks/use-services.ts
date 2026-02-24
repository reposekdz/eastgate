import { useState, useEffect } from "react";

export interface Service {
  id: string;
  name: string;
  type: string;
  price: number;
  duration: number;
  description: string | null;
  imageUrl: string | null;
  available: boolean;
}

export function useServices(branchId?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        params.set("available", "true");
        
        const res = await fetch(`/api/public/services?${params}`);
        if (!res.ok) throw new Error("Failed to fetch services");
        
        const data = await res.json();
        setServices(data.services || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [branchId]);

  return { services, loading, error };
}
