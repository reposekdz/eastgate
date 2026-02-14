// Guest Registration Store - Zustand with persist
// Records new hotel clients at reception; data persists across sessions.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GuestStatus = "checked_in" | "checked_out" | "reserved" | "cancelled";
export type IdType = "passport" | "national_id" | "driving_license" | "other";

export interface RegisteredGuest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  idType: IdType;
  idNumber: string;
  roomNumber: string;
  branchId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
  status: GuestStatus;
  createdAt: string;
  updatedAt: string;
}

interface GuestStore {
  guests: RegisteredGuest[];
  registerGuest: (guest: Omit<RegisteredGuest, "id" | "createdAt" | "updatedAt">) => string;
  updateGuestStatus: (guestId: string, status: GuestStatus) => void;
  updateGuest: (guestId: string, data: Partial<RegisteredGuest>) => void;
  getGuestsByBranch: (branchId: string) => RegisteredGuest[];
  getActiveGuests: (branchId: string) => RegisteredGuest[];
  searchGuests: (query: string, branchId: string) => RegisteredGuest[];
  removeGuest: (guestId: string) => void;
}

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      guests: [
        // Seed demo guests
        {
          id: "GR-001",
          fullName: "Sarah Mitchell",
          email: "sarah@email.com",
          phone: "+1 555-0101",
          nationality: "United States",
          idType: "passport" as IdType,
          idNumber: "US-9283746",
          roomNumber: "101",
          branchId: "br-001",
          checkInDate: "2026-02-10",
          checkOutDate: "2026-02-14",
          numberOfGuests: 2,
          specialRequests: "Airport pickup, late check-out",
          status: "checked_in" as GuestStatus,
          createdAt: "2026-02-10T09:30:00",
          updatedAt: "2026-02-10T09:30:00",
        },
        {
          id: "GR-002",
          fullName: "James Okafor",
          email: "james@email.com",
          phone: "+234 802-0202",
          nationality: "Nigeria",
          idType: "passport" as IdType,
          idNumber: "NG-5827461",
          roomNumber: "201",
          branchId: "br-001",
          checkInDate: "2026-02-11",
          checkOutDate: "2026-02-15",
          numberOfGuests: 1,
          status: "checked_in" as GuestStatus,
          createdAt: "2026-02-11T14:00:00",
          updatedAt: "2026-02-11T14:00:00",
        },
        {
          id: "GR-003",
          fullName: "Victoria Laurent",
          email: "victoria@email.com",
          phone: "+33 6-0404",
          nationality: "France",
          idType: "passport" as IdType,
          idNumber: "FR-1948273",
          roomNumber: "301",
          branchId: "br-001",
          checkInDate: "2026-02-10",
          checkOutDate: "2026-02-17",
          numberOfGuests: 2,
          specialRequests: "Honeymoon decoration, champagne on arrival",
          status: "checked_in" as GuestStatus,
          createdAt: "2026-02-10T11:00:00",
          updatedAt: "2026-02-10T11:00:00",
        },
        {
          id: "GR-004",
          fullName: "Amara Chen",
          email: "amara@email.com",
          phone: "+86 139-0303",
          nationality: "China",
          idType: "passport" as IdType,
          idNumber: "CN-3847291",
          roomNumber: "204",
          branchId: "br-001",
          checkInDate: "2026-02-09",
          checkOutDate: "2026-02-13",
          numberOfGuests: 1,
          status: "checked_in" as GuestStatus,
          createdAt: "2026-02-09T16:30:00",
          updatedAt: "2026-02-09T16:30:00",
        },
        {
          id: "GR-005",
          fullName: "Eric Ndikumana",
          email: "eric.n@email.com",
          phone: "+250 788-111",
          nationality: "Rwanda",
          idType: "national_id" as IdType,
          idNumber: "1199880012345678",
          roomNumber: "102",
          branchId: "br-002",
          checkInDate: "2026-02-12",
          checkOutDate: "2026-02-14",
          numberOfGuests: 3,
          status: "checked_in" as GuestStatus,
          createdAt: "2026-02-12T10:00:00",
          updatedAt: "2026-02-12T10:00:00",
        },
      ],

      registerGuest: (guestData) => {
        const id = `GR-${String(get().guests.length + 1).padStart(3, "0")}`;
        const now = new Date().toISOString();
        const newGuest: RegisteredGuest = {
          ...guestData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ guests: [newGuest, ...state.guests] }));
        return id;
      },

      updateGuestStatus: (guestId, status) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === guestId
              ? { ...g, status, updatedAt: new Date().toISOString() }
              : g
          ),
        }));
      },

      updateGuest: (guestId, data) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === guestId
              ? { ...g, ...data, updatedAt: new Date().toISOString() }
              : g
          ),
        }));
      },

      getGuestsByBranch: (branchId) => {
        return get().guests.filter((g) => g.branchId === branchId);
      },

      getActiveGuests: (branchId) => {
        return get().guests.filter(
          (g) => g.branchId === branchId && g.status === "checked_in"
        );
      },

      searchGuests: (query, branchId) => {
        const q = query.toLowerCase();
        return get().guests.filter(
          (g) =>
            g.branchId === branchId &&
            (g.fullName.toLowerCase().includes(q) ||
              g.email.toLowerCase().includes(q) ||
              g.phone.includes(q) ||
              g.idNumber.toLowerCase().includes(q) ||
              g.roomNumber.includes(q))
        );
      },

      removeGuest: (guestId) => {
        set((state) => ({
          guests: state.guests.filter((g) => g.id !== guestId),
        }));
      },
    }),
    {
      name: "eastgate-guest-storage",
    }
  )
);
