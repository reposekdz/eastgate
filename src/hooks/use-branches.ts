import { useState, useEffect } from "react";

export interface Branch {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  roomCount?: number;
  staffCount?: number;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBranches() {
      try {
        setLoading(true);
        const res = await fetch("/api/public/branches");
        if (!res.ok) throw new Error("Failed to fetch branches");
        const data = await res.json();
        setBranches(data.branches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  return { branches, loading, error };
}
