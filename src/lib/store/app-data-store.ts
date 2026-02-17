"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  branches as seedBranches,
  staff as seedStaff,
  bookings as seedBookings,
  rooms as seedRooms,
  restaurantOrders as seedOrders,
  menuItems as seedMenuItems,
  events as seedEvents,
  guests as seedGuests,
} from "@/lib/mock-data";
import type {
  Branch,
  StaffMember,
  Booking,
  Room,
  RestaurantOrder,
  MenuItem,
  HotelEvent,
  Guest,
} from "@/lib/types/schema";

export interface ChatMessage {
  id: string;
  sender: "guest" | "staff";
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  branchId: string;
  read: boolean;
}

export interface ServiceRequest {
  id: string;
  guestName: string;
  roomNumber: string;
  type: "room_service" | "housekeeping" | "maintenance" | "concierge" | "wake_up" | "laundry";
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  createdAt: string;
  branchId: string;
}

export interface RestaurantTable {
  id: string;
  number: number;
  seats: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  currentOrder?: string;
  waiter?: string;
  guestName?: string;
  branchId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "order" | "booking" | "service" | "alert" | "chat";
  read: boolean;
  createdAt: string;
  branchId: string;
}

/** Real actions/operations by staff for branch & super manager visibility */
export interface ActivityLogEntry {
  id: string;
  type: "booking_created" | "booking_confirmed" | "check_in" | "check_out" | "order_placed" | "order_status" | "service_request" | "guest_registered" | "room_updated" | "menu_updated";
  actorRole: string;
  actorName: string;
  branchId: string;
  branchName: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

const seedServiceRequests: ServiceRequest[] = [
  { id: "sr-001", guestName: "Sarah Mitchell", roomNumber: "101", type: "room_service", description: "Extra towels and pillows", status: "pending", priority: "medium", createdAt: "2026-02-14T08:30:00", branchId: "br-001" },
  { id: "sr-002", guestName: "James Okafor", roomNumber: "201", type: "maintenance", description: "AC not cooling properly", status: "in_progress", priority: "high", assignedTo: "Claudine Mukamana", createdAt: "2026-02-14T07:15:00", branchId: "br-001" },
  { id: "sr-003", guestName: "Victoria Laurent", roomNumber: "301", type: "concierge", description: "Airport transfer tomorrow at 6 AM", status: "pending", priority: "medium", createdAt: "2026-02-14T09:00:00", branchId: "br-001" },
  { id: "sr-004", guestName: "Amara Chen", roomNumber: "204", type: "laundry", description: "Express dry cleaning for 3 suits", status: "completed", priority: "low", assignedTo: "Sandrine Iradukunda", createdAt: "2026-02-13T16:00:00", branchId: "br-001" },
  { id: "sr-005", guestName: "David Kirabo", roomNumber: "305", type: "wake_up", description: "Wake-up call at 5:30 AM", status: "pending", priority: "low", createdAt: "2026-02-14T21:00:00", branchId: "br-001" },
  { id: "sr-006", guestName: "Lisa Wang", roomNumber: "402", type: "housekeeping", description: "Room deep cleaning requested", status: "in_progress", priority: "medium", assignedTo: "Claudine Mukamana", createdAt: "2026-02-14T10:00:00", branchId: "br-001" },
  { id: "sr-007", guestName: "Guest Alpha", roomNumber: "N-101", type: "room_service", description: "Extra blankets", status: "pending", priority: "low", createdAt: "2026-02-14T08:00:00", branchId: "br-002" },
  { id: "sr-008", guestName: "Guest Beta", roomNumber: "N-203", type: "maintenance", description: "Leaking faucet", status: "in_progress", priority: "high", assignedTo: "Louise Mukantwari", createdAt: "2026-02-14T06:45:00", branchId: "br-002" },
  { id: "sr-009", guestName: "Guest Gamma", roomNumber: "K-102", type: "concierge", description: "Book safari tour", status: "pending", priority: "medium", createdAt: "2026-02-14T11:00:00", branchId: "br-003" },
  { id: "sr-010", guestName: "Guest Delta", roomNumber: "G-105", type: "laundry", description: "Laundry pickup", status: "completed", priority: "low", createdAt: "2026-02-13T14:00:00", branchId: "br-004" },
];

const seedTables: RestaurantTable[] = [
  { id: "t-01", number: 1, seats: 2, status: "occupied", currentOrder: "ORD-004", waiter: "Patrick Bizimana", guestName: "Victoria Laurent", branchId: "br-001" },
  { id: "t-02", number: 2, seats: 4, status: "available", branchId: "br-001" },
  { id: "t-03", number: 3, seats: 4, status: "occupied", currentOrder: "ORD-002", waiter: "Fabrice Nkurunziza", guestName: "Walk-in Guest", branchId: "br-001" },
  { id: "t-04", number: 4, seats: 6, status: "reserved", guestName: "Kwame Asante", branchId: "br-001" },
  { id: "t-05", number: 5, seats: 2, status: "occupied", currentOrder: "ORD-001", waiter: "Patrick Bizimana", guestName: "Sarah Mitchell", branchId: "br-001" },
  { id: "t-06", number: 6, seats: 4, status: "available", branchId: "br-001" },
  { id: "t-07", number: 7, seats: 8, status: "available", branchId: "br-001" },
  { id: "t-08", number: 8, seats: 6, status: "occupied", currentOrder: "ORD-003", waiter: "Jeanne Mukamana", guestName: "James Okafor", branchId: "br-001" },
  { id: "t-09", number: 9, seats: 2, status: "cleaning", branchId: "br-001" },
  { id: "t-10", number: 10, seats: 4, status: "available", branchId: "br-001" },
  { id: "t-11", number: 11, seats: 2, status: "reserved", guestName: "Elena Petrova", branchId: "br-001" },
  { id: "t-12", number: 12, seats: 4, status: "occupied", currentOrder: "ORD-005", waiter: "Fabrice Nkurunziza", branchId: "br-001" },
  { id: "t-n01", number: 1, seats: 4, status: "available", branchId: "br-002" },
  { id: "t-n02", number: 2, seats: 4, status: "occupied", waiter: "Joseph Habiyaremye", guestName: "Guest A", branchId: "br-002" },
  { id: "t-n03", number: 3, seats: 6, status: "available", branchId: "br-002" },
  { id: "t-n04", number: 4, seats: 2, status: "reserved", branchId: "br-002" },
  { id: "t-k01", number: 1, seats: 4, status: "available", branchId: "br-003" },
  { id: "t-k02", number: 2, seats: 4, status: "occupied", waiter: "Angelique Uwera", branchId: "br-003" },
  { id: "t-g01", number: 1, seats: 4, status: "available", branchId: "br-004" },
  { id: "t-g02", number: 2, seats: 6, status: "occupied", waiter: "Chantal Uwase", branchId: "br-004" },
];

const seedNotifications: Notification[] = [
  { id: "n-001", title: "New Order", message: "Table 8 placed a new order - Brochette Platter x3", type: "order", read: false, createdAt: "2026-02-14T12:45:00", branchId: "br-001" },
  { id: "n-002", title: "Booking Confirmed", message: "Mohammed Al-Rashid confirmed booking BK-2024005", type: "booking", read: false, createdAt: "2026-02-14T11:30:00", branchId: "br-001" },
  { id: "n-003", title: "Service Request", message: "Room 201 - AC maintenance request (High Priority)", type: "service", read: true, createdAt: "2026-02-14T07:15:00", branchId: "br-001" },
  { id: "n-004", title: "Order Ready", message: "Order ORD-002 is ready for serving - Table 3", type: "order", read: false, createdAt: "2026-02-14T12:40:00", branchId: "br-001" },
  { id: "n-005", title: "New Chat Message", message: "Guest inquiry about spa availability", type: "chat", read: false, createdAt: "2026-02-14T10:20:00", branchId: "br-001" },
  { id: "n-006", title: "Low Occupancy Alert", message: "Occupancy below 60% threshold this week", type: "alert", read: true, createdAt: "2026-02-13T09:00:00", branchId: "br-002" },
  { id: "n-007", title: "New Booking", message: "New walk-in booking for Room K-102", type: "booking", read: false, createdAt: "2026-02-14T08:00:00", branchId: "br-003" },
];

const seedChatMessages: ChatMessage[] = [
  { id: "cm-001", sender: "guest", senderName: "Visitor", senderAvatar: "https://i.pravatar.cc/40?u=visitor1", message: "Hello! I'd like to inquire about room availability for next weekend.", timestamp: "2026-02-14T10:00:00", branchId: "br-001", read: true },
  { id: "cm-002", sender: "staff", senderName: "Grace Uwase", senderAvatar: "https://i.pravatar.cc/40?u=grace-uwase", message: "Welcome to EastGate Hotel! We have several rooms available for next weekend. What type of room are you looking for?", timestamp: "2026-02-14T10:02:00", branchId: "br-001", read: true },
  { id: "cm-003", sender: "guest", senderName: "Visitor", senderAvatar: "https://i.pravatar.cc/40?u=visitor1", message: "I'm looking for a deluxe room for 2 nights. Do you have any with a view?", timestamp: "2026-02-14T10:05:00", branchId: "br-001", read: true },
  { id: "cm-004", sender: "staff", senderName: "Grace Uwase", senderAvatar: "https://i.pravatar.cc/40?u=grace-uwase", message: "Yes! We have deluxe rooms with garden and city views available. The rate is RWF 325,000 per night. Shall I make a reservation?", timestamp: "2026-02-14T10:07:00", branchId: "br-001", read: true },
  { id: "cm-005", sender: "guest", senderName: "Marie", senderAvatar: "https://i.pravatar.cc/40?u=marie-visitor", message: "Hi, can I book a table for dinner tonight? 4 people at 7 PM?", timestamp: "2026-02-14T14:30:00", branchId: "br-001", read: false },
];

export interface AppDataState {
  branches: Branch[];
  rooms: Room[];
  bookings: Booking[];
  staff: StaffMember[];
  guests: Guest[];
  menuItems: MenuItem[];
  restaurantOrders: RestaurantOrder[];
  events: HotelEvent[];
  serviceRequests: ServiceRequest[];
  tables: RestaurantTable[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  activityLog: ActivityLogEntry[];
  addBooking: (b: Omit<Booking, "id">) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  addGuest: (g: Omit<Guest, "id">) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  updateServiceRequest: (requestId: string, updates: Partial<ServiceRequest>) => void;
  addNotification: (n: Omit<Notification, "id">) => void;
  markNotificationRead: (id: string) => void;
  addChatMessage: (m: Omit<ChatMessage, "id">) => void;
  addStaffMember: (m: Omit<StaffMember, "id">) => void;
  updateStaffMember: (memberId: string, updates: Partial<StaffMember>) => void;
  removeStaffMember: (memberId: string) => void;
  addRoom: (r: Omit<Room, "id">) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  addMenuItem: (m: Omit<MenuItem, "id">) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;
  addOrder: (o: Omit<RestaurantOrder, "id">) => void;
  pushActivity: (a: Omit<ActivityLogEntry, "id">) => void;
}

export const useAppDataStore = create<AppDataState>()(
  persist(
    (set, get) => ({
      branches: JSON.parse(JSON.stringify(seedBranches)),
      rooms: JSON.parse(JSON.stringify(seedRooms)),
      bookings: JSON.parse(JSON.stringify(seedBookings)),
      staff: JSON.parse(JSON.stringify(seedStaff)),
      guests: JSON.parse(JSON.stringify(seedGuests)),
      menuItems: JSON.parse(JSON.stringify(seedMenuItems)),
      restaurantOrders: JSON.parse(JSON.stringify(seedOrders)),
      events: JSON.parse(JSON.stringify(seedEvents)),
      serviceRequests: JSON.parse(JSON.stringify(seedServiceRequests)),
      tables: JSON.parse(JSON.stringify(seedTables)),
      notifications: JSON.parse(JSON.stringify(seedNotifications)),
      chatMessages: JSON.parse(JSON.stringify(seedChatMessages)),
      activityLog: [],

      addBooking: (b) =>
        set((s) => {
          const branch = s.branches.find((x) => x.id === b.branchId);
          const id = `BK-${Date.now().toString().slice(-8)}`;
          return {
            bookings: [
              ...s.bookings,
              {
                ...b,
                id,
                guestAvatar: b.guestAvatar || (b.guestEmail ? `https://i.pravatar.cc/40?u=${b.guestEmail}` : ""),
              } as Booking,
            ],
            activityLog: [
              {
                id: `act-${Date.now()}`,
                type: "booking_created" as const,
                actorRole: "receptionist",
                actorName: "Receptionist",
                branchId: b.branchId,
                branchName: branch?.name ?? b.branchId,
                entityType: "booking",
                entityId: id,
                description: `Booking created for ${b.guestName} · Room ${b.roomNumber}`,
                createdAt: new Date().toISOString(),
              } as ActivityLogEntry,
              ...(s.activityLog ?? []),
            ].slice(0, 500),
          };
        }),

      updateBooking: (id, updates) =>
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
          activityLog: updates.status
            ? [
                {
                  id: `act-${Date.now()}`,
                  type: (updates.status === "checked_in" ? "check_in" : updates.status === "checked_out" ? "check_out" : "booking_confirmed") as ActivityLogEntry["type"],
                  actorRole: "receptionist",
                  actorName: "Receptionist",
                  branchId: s.bookings.find((b) => b.id === id)?.branchId ?? "",
                  branchName: s.branches.find((x) => x.id === s.bookings.find((b) => b.id === id)?.branchId)?.name ?? "",
                  entityType: "booking",
                  entityId: id,
                  description: `Booking ${id} → ${updates.status}`,
                  createdAt: new Date().toISOString(),
                } as ActivityLogEntry,
                ...(s.activityLog ?? []),
              ].slice(0, 500)
            : (s.activityLog ?? []),
        })),

      updateOrderStatus: (orderId, status) =>
        set((s) => {
          const order = s.restaurantOrders.find((o) => o.id === orderId);
          const branch = order ? s.branches.find((x) => x.id === order.branchId) : null;
          return {
            restaurantOrders: s.restaurantOrders.map((o) =>
              o.id === orderId ? { ...o, status: status as RestaurantOrder["status"] } : o
            ),
            activityLog: [
              {
                id: `act-${Date.now()}`,
                type: "order_status" as const,
                actorRole: "kitchen_staff",
                actorName: order?.performedBy ?? "Kitchen",
                branchId: order?.branchId ?? "",
                branchName: branch?.name ?? "",
                entityType: "order",
                entityId: orderId,
                description: `Order ${orderId} → ${status}`,
                createdAt: new Date().toISOString(),
              } as ActivityLogEntry,
              ...(s.activityLog ?? []),
            ].slice(0, 500),
          };
        }),

      updateServiceRequest: (requestId, updates) =>
        set((s) => ({
          serviceRequests: s.serviceRequests.map((sr) =>
            sr.id === requestId ? { ...sr, ...updates } : sr
          ),
        })),

      addNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: `n-${Date.now()}` }, ...s.notifications],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      addChatMessage: (m) =>
        set((s) => ({
          chatMessages: [...s.chatMessages, { ...m, id: `cm-${Date.now()}` }],
        })),

      addStaffMember: (m) =>
        set((s) => ({
          staff: [...s.staff, { ...m, id: `s-${Date.now()}` }],
        })),

      updateStaffMember: (memberId, updates) =>
        set((s) => ({
          staff: s.staff.map((x) => (x.id === memberId ? { ...x, ...updates } : x)),
        })),

      removeStaffMember: (memberId) =>
        set((s) => ({ staff: s.staff.filter((x) => x.id !== memberId) })),

      addGuest: (g) =>
        set((s) => ({
          guests: [...s.guests, { ...g, id: `g-${Date.now()}` }],
        })),

      updateGuest: (id, updates) =>
        set((s) => ({
          guests: s.guests.map((x) => (x.id === id ? { ...x, ...updates } : x)),
        })),

      addRoom: (r) =>
        set((s) => ({
          rooms: [...s.rooms, { ...r, id: `rm-${Date.now()}` }],
        })),

      updateRoom: (roomId, updates) =>
        set((s) => ({
          rooms: s.rooms.map((x) => (x.id === roomId ? { ...x, ...updates } : x)),
        })),

      addMenuItem: (m) =>
        set((s) => ({
          menuItems: [...s.menuItems, { ...m, id: `mi-${Date.now()}` }],
        })),

      updateMenuItem: (id, updates) =>
        set((s) => ({
          menuItems: s.menuItems.map((x) => (x.id === id ? { ...x, ...updates } : x)),
        })),

      removeMenuItem: (id) =>
        set((s) => ({
          menuItems: s.menuItems.filter((x) => x.id !== id),
        })),

      addOrder: (o) =>
        set((s) => {
          const id = `ORD-${Date.now().toString().slice(-6)}`;
          const branch = s.branches.find((x) => x.id === o.branchId);
          return {
            restaurantOrders: [...s.restaurantOrders, { ...o, id } as RestaurantOrder],
            activityLog: [
              {
                id: `act-${Date.now()}`,
                type: "order_placed" as const,
                actorRole: "waiter",
                actorName: o.performedBy ?? "Waiter",
                branchId: o.branchId,
                branchName: branch?.name ?? o.branchId,
                entityType: "order",
                entityId: id,
                description: `Order ${id} · Table ${o.tableNumber} · RWF ${o.total.toLocaleString()}`,
                createdAt: new Date().toISOString(),
              } as ActivityLogEntry,
              ...(s.activityLog ?? []),
            ].slice(0, 500),
          };
        }),

      pushActivity: (a) =>
        set((s) => ({
          activityLog: [{ ...a, id: `act-${Date.now()}` } as ActivityLogEntry, ...(s.activityLog ?? [])].slice(0, 500),
        })),
    }),
    {
      name: "eastgate-app-data",
      version: 1,
      partialize: (s) => ({
        branches: s.branches,
        rooms: s.rooms,
        bookings: s.bookings,
        staff: s.staff,
        guests: s.guests,
        menuItems: s.menuItems,
        restaurantOrders: s.restaurantOrders,
        events: s.events,
        serviceRequests: s.serviceRequests,
        tables: s.tables,
        notifications: s.notifications,
        chatMessages: s.chatMessages,
        activityLog: Array.isArray(s.activityLog) ? s.activityLog : [],
      }),
    }
  )
);
