import { create } from "zustand";
import {
  branches,
  staff,
  bookings,
  rooms,
  restaurantOrders,
  menuItems,
  events,
  revenueData,
  kpiData,
  occupancyData,
} from "@/lib/mock-data";
import type {
  Branch,
  StaffMember,
  Booking,
  Room,
  RestaurantOrder,
  MenuItem,
  HotelEvent,
} from "@/lib/types/schema";
import type { UserRole } from "@/lib/types/enums";

// ─── Chat Messages ────────────────────────────────────────
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

// ─── Service Request ──────────────────────────────────────
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

// ─── Table Map ────────────────────────────────────────────
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

// ─── Notification ─────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "order" | "booking" | "service" | "alert" | "chat";
  read: boolean;
  createdAt: string;
  branchId: string;
}

// ─── Mock Extended Data ───────────────────────────────────
const mockServiceRequests: ServiceRequest[] = [
  { id: "sr-001", guestName: "Sarah Mitchell", roomNumber: "101", type: "room_service", description: "Extra towels and pillows", status: "pending", priority: "medium", createdAt: "2026-02-14T08:30:00", branchId: "br-001" },
  { id: "sr-002", guestName: "James Okafor", roomNumber: "201", type: "maintenance", description: "AC not cooling properly", status: "in_progress", priority: "high", assignedTo: "Claudine Mukamana", createdAt: "2026-02-14T07:15:00", branchId: "br-001" },
  { id: "sr-003", guestName: "Victoria Laurent", roomNumber: "301", type: "concierge", description: "Airport transfer tomorrow at 6 AM", status: "pending", priority: "medium", createdAt: "2026-02-14T09:00:00", branchId: "br-001" },
  { id: "sr-004", guestName: "Amara Chen", roomNumber: "204", type: "laundry", description: "Express dry cleaning for 3 suits", status: "completed", priority: "low", assignedTo: "Sandrine Iradukunda", createdAt: "2026-02-13T16:00:00", branchId: "br-001" },
  { id: "sr-005", guestName: "David Kirabo", roomNumber: "305", type: "wake_up", description: "Wake-up call at 5:30 AM", status: "pending", priority: "low", createdAt: "2026-02-14T21:00:00", branchId: "br-001" },
  { id: "sr-006", guestName: "Lisa Wang", roomNumber: "402", type: "housekeeping", description: "Room deep cleaning requested", status: "in_progress", priority: "medium", assignedTo: "Claudine Mukamana", createdAt: "2026-02-14T10:00:00", branchId: "br-001" },
  // Ngoma
  { id: "sr-007", guestName: "Guest Alpha", roomNumber: "N-101", type: "room_service", description: "Extra blankets", status: "pending", priority: "low", createdAt: "2026-02-14T08:00:00", branchId: "br-002" },
  { id: "sr-008", guestName: "Guest Beta", roomNumber: "N-203", type: "maintenance", description: "Leaking faucet", status: "in_progress", priority: "high", assignedTo: "Louise Mukantwari", createdAt: "2026-02-14T06:45:00", branchId: "br-002" },
  // Kirehe
  { id: "sr-009", guestName: "Guest Gamma", roomNumber: "K-102", type: "concierge", description: "Book safari tour", status: "pending", priority: "medium", createdAt: "2026-02-14T11:00:00", branchId: "br-003" },
  // Gatsibo
  { id: "sr-010", guestName: "Guest Delta", roomNumber: "G-105", type: "laundry", description: "Laundry pickup", status: "completed", priority: "low", createdAt: "2026-02-13T14:00:00", branchId: "br-004" },
];

const mockTables: RestaurantTable[] = [
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
  // Other branches tables
  { id: "t-n01", number: 1, seats: 4, status: "available", branchId: "br-002" },
  { id: "t-n02", number: 2, seats: 4, status: "occupied", waiter: "Joseph Habiyaremye", guestName: "Guest A", branchId: "br-002" },
  { id: "t-n03", number: 3, seats: 6, status: "available", branchId: "br-002" },
  { id: "t-n04", number: 4, seats: 2, status: "reserved", branchId: "br-002" },
  { id: "t-k01", number: 1, seats: 4, status: "available", branchId: "br-003" },
  { id: "t-k02", number: 2, seats: 4, status: "occupied", waiter: "Angelique Uwera", branchId: "br-003" },
  { id: "t-g01", number: 1, seats: 4, status: "available", branchId: "br-004" },
  { id: "t-g02", number: 2, seats: 6, status: "occupied", waiter: "Chantal Uwase", branchId: "br-004" },
];

const mockNotifications: Notification[] = [
  { id: "n-001", title: "New Order", message: "Table 8 placed a new order - Brochette Platter x3", type: "order", read: false, createdAt: "2026-02-14T12:45:00", branchId: "br-001" },
  { id: "n-002", title: "Booking Confirmed", message: "Mohammed Al-Rashid confirmed booking BK-2024005", type: "booking", read: false, createdAt: "2026-02-14T11:30:00", branchId: "br-001" },
  { id: "n-003", title: "Service Request", message: "Room 201 - AC maintenance request (High Priority)", type: "service", read: true, createdAt: "2026-02-14T07:15:00", branchId: "br-001" },
  { id: "n-004", title: "Order Ready", message: "Order ORD-002 is ready for serving - Table 3", type: "order", read: false, createdAt: "2026-02-14T12:40:00", branchId: "br-001" },
  { id: "n-005", title: "New Chat Message", message: "Guest inquiry about spa availability", type: "chat", read: false, createdAt: "2026-02-14T10:20:00", branchId: "br-001" },
  { id: "n-006", title: "Low Occupancy Alert", message: "Occupancy below 60% threshold this week", type: "alert", read: true, createdAt: "2026-02-13T09:00:00", branchId: "br-002" },
  { id: "n-007", title: "New Booking", message: "New walk-in booking for Room K-102", type: "booking", read: false, createdAt: "2026-02-14T08:00:00", branchId: "br-003" },
];

const mockChatMessages: ChatMessage[] = [
  { id: "cm-001", sender: "guest", senderName: "Visitor", senderAvatar: "https://i.pravatar.cc/40?u=visitor1", message: "Hello! I'd like to inquire about room availability for next weekend.", timestamp: "2026-02-14T10:00:00", branchId: "br-001", read: true },
  { id: "cm-002", sender: "staff", senderName: "Grace Uwase", senderAvatar: "https://i.pravatar.cc/40?u=grace-uwase", message: "Welcome to EastGate Hotel! We have several rooms available for next weekend. What type of room are you looking for?", timestamp: "2026-02-14T10:02:00", branchId: "br-001", read: true },
  { id: "cm-003", sender: "guest", senderName: "Visitor", senderAvatar: "https://i.pravatar.cc/40?u=visitor1", message: "I'm looking for a deluxe room for 2 nights. Do you have any with a view?", timestamp: "2026-02-14T10:05:00", branchId: "br-001", read: true },
  { id: "cm-004", sender: "staff", senderName: "Grace Uwase", senderAvatar: "https://i.pravatar.cc/40?u=grace-uwase", message: "Yes! We have deluxe rooms with garden and city views available. The rate is RWF 325,000 per night. Shall I make a reservation?", timestamp: "2026-02-14T10:07:00", branchId: "br-001", read: true },
  { id: "cm-005", sender: "guest", senderName: "Marie", senderAvatar: "https://i.pravatar.cc/40?u=marie-visitor", message: "Hi, can I book a table for dinner tonight? 4 people at 7 PM?", timestamp: "2026-02-14T14:30:00", branchId: "br-001", read: false },
];

// ─── Branch Store ─────────────────────────────────────────
interface BranchStore {
  selectedBranchId: string;
  setSelectedBranch: (branchId: string) => void;

  // Getters with branch filtering
  getBranches: (userRole: UserRole, userBranchId: string) => Branch[];
  getStaff: (branchId: string, userRole: UserRole) => StaffMember[];
  getBookings: (branchId: string, userRole: UserRole) => Booking[];
  getRooms: (branchId: string, userRole: UserRole) => Room[];
  getOrders: (branchId: string, userRole: UserRole) => RestaurantOrder[];
  getMenuItems: () => MenuItem[];
  getEvents: (branchId: string, userRole: UserRole) => HotelEvent[];
  getServiceRequests: (branchId: string, userRole: UserRole) => ServiceRequest[];
  getTables: (branchId: string, userRole: UserRole) => RestaurantTable[];
  getNotifications: (branchId: string, userRole: UserRole) => Notification[];
  getChatMessages: (branchId: string) => ChatMessage[];

  // Actions
  addChatMessage: (msg: Omit<ChatMessage, "id">) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  updateServiceRequest: (requestId: string, updates: Partial<ServiceRequest>) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  markNotificationRead: (notificationId: string) => void;
  addStaffMember: (member: Omit<StaffMember, "id">) => void;
  updateStaffMember: (memberId: string, updates: Partial<StaffMember>) => void;
  removeStaffMember: (memberId: string) => void;
}

const isSuperRole = (role: UserRole) =>
  role === "super_admin" || role === "super_manager";

export const useBranchStore = create<BranchStore>()((set, get) => ({
  selectedBranchId: "br-001",

  setSelectedBranch: (branchId: string) => set({ selectedBranchId: branchId }),

  getBranches: (userRole, userBranchId) => {
    if (isSuperRole(userRole)) return branches;
    return branches.filter((b) => b.id === userBranchId);
  },

  getStaff: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return staff;
    return staff.filter((s) => s.branchId === branchId);
  },

  getBookings: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return bookings;
    return bookings.filter((b) => b.branchId === branchId);
  },

  getRooms: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return rooms;
    return rooms.filter((r) => r.branchId === branchId);
  },

  getOrders: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return restaurantOrders;
    return restaurantOrders;
  },

  getMenuItems: () => menuItems,

  getEvents: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return events;
    return events;
  },

  getServiceRequests: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return mockServiceRequests;
    return mockServiceRequests.filter((sr) => sr.branchId === branchId);
  },

  getTables: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return mockTables;
    return mockTables.filter((t) => t.branchId === branchId);
  },

  getNotifications: (branchId, userRole) => {
    if (isSuperRole(userRole) && branchId === "all") return mockNotifications;
    return mockNotifications.filter((n) => n.branchId === branchId);
  },

  getChatMessages: (branchId) => {
    return mockChatMessages.filter((m) => m.branchId === branchId);
  },

  addChatMessage: (msg) => {
    const newMsg: ChatMessage = { ...msg, id: `cm-${Date.now()}` };
    mockChatMessages.push(newMsg);
    set({});
  },

  updateOrderStatus: (orderId, status) => {
    const order = restaurantOrders.find((o) => o.id === orderId);
    if (order) {
      (order as Record<string, unknown>).status = status;
      set({});
    }
  },

  updateServiceRequest: (requestId, updates) => {
    const idx = mockServiceRequests.findIndex((sr) => sr.id === requestId);
    if (idx !== -1) {
      mockServiceRequests[idx] = { ...mockServiceRequests[idx], ...updates };
      set({});
    }
  },

  addNotification: (notification) => {
    mockNotifications.unshift({ ...notification, id: `n-${Date.now()}` });
    set({});
  },

  markNotificationRead: (notificationId) => {
    const n = mockNotifications.find((notif) => notif.id === notificationId);
    if (n) {
      n.read = true;
      set({});
    }
  },

  addStaffMember: (member) => {
    staff.push({ ...member, id: `s-${Date.now()}` });
    set({});
  },

  updateStaffMember: (memberId, updates) => {
    const idx = staff.findIndex((s) => s.id === memberId);
    if (idx !== -1) {
      staff[idx] = { ...staff[idx], ...updates };
      set({});
    }
  },

  removeStaffMember: (memberId) => {
    const idx = staff.findIndex((s) => s.id === memberId);
    if (idx !== -1) {
      staff.splice(idx, 1);
      set({});
    }
  },
}));
