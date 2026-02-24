"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

// Empty initial data - will be fetched from database
const emptyBranches: Branch[] = [];
const emptyRooms: Room[] = [];
const emptyBookings: Booking[] = [];
const emptyStaff: StaffMember[] = [];
const emptyGuests: Guest[] = [];
const emptyMenuItems: MenuItem[] = [];
const emptyOrders: RestaurantOrder[] = [];
const emptyEvents: HotelEvent[] = [];

const emptyServiceRequests: ServiceRequest[] = [];
const emptyTables: RestaurantTable[] = [];
const emptyNotifications: Notification[] = [];
const emptyChatMessages: ChatMessage[] = [];

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
      branches: JSON.parse(JSON.stringify(emptyBranches)),
      rooms: JSON.parse(JSON.stringify(emptyRooms)),
      bookings: JSON.parse(JSON.stringify(emptyBookings)),
      staff: JSON.parse(JSON.stringify(emptyStaff)),
      guests: JSON.parse(JSON.stringify(emptyGuests)),
      menuItems: JSON.parse(JSON.stringify(emptyMenuItems)),
      restaurantOrders: JSON.parse(JSON.stringify(emptyOrders)),
      events: JSON.parse(JSON.stringify(emptyEvents)),
      serviceRequests: JSON.parse(JSON.stringify(emptyServiceRequests)),
      tables: JSON.parse(JSON.stringify(emptyTables)),
      notifications: JSON.parse(JSON.stringify(emptyNotifications)),
      chatMessages: JSON.parse(JSON.stringify(emptyChatMessages)),
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
