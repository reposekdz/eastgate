import { useState, useEffect } from "react";

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: string;
  status: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  branchId: string;
}

export function useRooms(branchId?: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        params.set("status", "available");
        
        const res = await fetch(`/api/public/rooms?${params}`);
        if (!res.ok) throw new Error("Failed to fetch rooms");
        
        const data = await res.json();
        setRooms(data.rooms || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, [branchId]);

  return { rooms, loading, error };
}

export function useRoom(id: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoom() {
      try {
        setLoading(true);
        const res = await fetch(`/api/rooms/${id}`);
        if (!res.ok) throw new Error("Failed to fetch room");
        
        const data = await res.json();
        setRoom(data.room || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRoom();
  }, [id]);

  return { room, loading, error };
}
