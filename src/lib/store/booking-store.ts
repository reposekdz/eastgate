import { create } from "zustand";
import type { RoomType } from "../types/enums";

export interface BookingFormData {
  branchId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomType: RoomType | "";
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
}

interface BookingState {
  currentBooking: Partial<BookingFormData>;
  setBookingData: (data: Partial<BookingFormData>) => void;
  resetBooking: () => void;
}

const initialBooking: Partial<BookingFormData> = {
  branchId: "br-001",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  roomType: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  specialRequests: "",
};

export const useBookingStore = create<BookingState>((set) => ({
  currentBooking: initialBooking,

  setBookingData: (data) =>
    set((state) => ({
      currentBooking: { ...state.currentBooking, ...data },
    })),

  resetBooking: () => set({ currentBooking: initialBooking }),
}));
