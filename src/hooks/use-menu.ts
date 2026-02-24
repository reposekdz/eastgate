import { useState, useEffect } from "react";

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  available: boolean;
  popular?: boolean;
  vegetarian?: boolean;
  spicy?: boolean;
}

export function useMenu(branchId?: string) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        params.set("available", "true");
        
        const res = await fetch(`/api/public/menu?${params}`);
        if (!res.ok) throw new Error("Failed to fetch menu");
        
        const data = await res.json();
        setMenuItems(data.menuItems || []);
        setCategories(data.categories || []);
        setPopularItems(data.popularItems || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, [branchId]);

  return { menuItems, categories, popularItems, loading, error };
}
