import { create } from "zustand";
import { useAppDataStore } from "./app-data-store";
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
import type { UserRole } from "@/lib/types/enums";

export type { ChatMessage, ServiceRequest, RestaurantTable, Notification, ActivityLogEntry } from "./app-data-store";

const isSuperRole = (role: UserRole) =>
  role === "super_admin" || role === "super_manager";

function tick() {
  return Date.now();
}

interface BranchStore {
  selectedBranchId: string;
  _tick: number;
  setSelectedBranch: (branchId: string) => void;

  getBranches: (userRole: UserRole, userBranchId: string) => Branch[];
  getStaff: (branchId: string, userRole: UserRole) => StaffMember[];
  getBookings: (branchId: string, userRole: UserRole) => Booking[];
  getRooms: (branchId: string, userRole: UserRole) => Room[];
  getOrders: (branchId: string, userRole: UserRole) => RestaurantOrder[];
  getMenuItems: () => MenuItem[];
  getEvents: (branchId: string, userRole: UserRole) => HotelEvent[];
  getServiceRequests: (branchId: string, userRole: UserRole) => import("./app-data-store").ServiceRequest[];
  getTables: (branchId: string, userRole: UserRole) => import("./app-data-store").RestaurantTable[];
  getNotifications: (branchId: string, userRole: UserRole) => import("./app-data-store").Notification[];
  getChatMessages: (branchId: string) => import("./app-data-store").ChatMessage[];
  getGuests: (branchId: string, userRole: UserRole) => Guest[];
  getActivityLog: (branchId: string, userRole: UserRole) => import("./app-data-store").ActivityLogEntry[];

  addChatMessage: (msg: Omit<import("./app-data-store").ChatMessage, "id">) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  updateServiceRequest: (requestId: string, updates: Partial<import("./app-data-store").ServiceRequest>) => void;
  addNotification: (notification: Omit<import("./app-data-store").Notification, "id">) => void;
  markNotificationRead: (notificationId: string) => void;
  addStaffMember: (member: Omit<StaffMember, "id">) => void;
  updateStaffMember: (memberId: string, updates: Partial<StaffMember>) => void;
  removeStaffMember: (memberId: string) => void;
  addBooking: (booking: Omit<Booking, "id">) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  addRoom: (room: Omit<Room, "id">) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;
  addOrder: (order: Omit<RestaurantOrder, "id">) => void;
  pushActivity: (a: Omit<import("./app-data-store").ActivityLogEntry, "id">) => void;
}

export const useBranchStore = create<BranchStore>()((set, get) => {
  const read = () => useAppDataStore.getState();
  const bump = () => set({ _tick: tick() });

  return {
    selectedBranchId: "br-001",
    _tick: 0,
    setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),

    getBranches: (userRole, userBranchId) => {
      const branches = read().branches;
      if (isSuperRole(userRole)) return branches;
      return branches.filter((b) => b.id === userBranchId);
    },

    getStaff: (branchId, userRole) => {
      const staff = read().staff;
      if (isSuperRole(userRole) && branchId === "all") return staff;
      return staff.filter((s) => s.branchId === branchId);
    },

    getBookings: (branchId, userRole) => {
      const bookings = read().bookings;
      if (isSuperRole(userRole) && branchId === "all") return bookings;
      return bookings.filter((b) => b.branchId === branchId);
    },

    getRooms: (branchId, userRole) => {
      const rooms = read().rooms;
      if (isSuperRole(userRole) && branchId === "all") return rooms;
      return rooms.filter((r) => r.branchId === branchId);
    },

    getOrders: (branchId, userRole) => {
      const orders = read().restaurantOrders;
      if (isSuperRole(userRole) && branchId === "all") return orders;
      return orders.filter((o) => o.branchId === branchId);
    },

    getMenuItems: () => read().menuItems,

    getEvents: (branchId, userRole) => {
      const events = read().events;
      if (isSuperRole(userRole) && branchId === "all") return events;
      return events;
    },

    getServiceRequests: (branchId, userRole) => {
      const sr = read().serviceRequests;
      if (isSuperRole(userRole) && branchId === "all") return sr;
      return sr.filter((x) => x.branchId === branchId);
    },

    getTables: (branchId, userRole) => {
      const tables = read().tables;
      if (isSuperRole(userRole) && branchId === "all") return tables;
      return tables.filter((t) => t.branchId === branchId);
    },

    getNotifications: (branchId, userRole) => {
      const notifications = read().notifications;
      if (isSuperRole(userRole) && branchId === "all") return notifications;
      return notifications.filter((n) => n.branchId === branchId);
    },

    getChatMessages: (branchId) =>
      read().chatMessages.filter((m) => m.branchId === branchId),

    getGuests: (branchId, userRole) => {
      const guests = read().guests;
      if (isSuperRole(userRole) && branchId === "all") return guests;
      return guests;
    },

    getActivityLog: (branchId, userRole) => {
      const log = read().activityLog ?? [];
      if (isSuperRole(userRole) && branchId === "all") return log;
      return log.filter((a) => a.branchId === branchId);
    },

    addChatMessage: (msg) => {
      read().addChatMessage(msg);
      bump();
    },

    updateOrderStatus: (orderId, status) => {
      read().updateOrderStatus(orderId, status);
      bump();
    },

    updateServiceRequest: (requestId, updates) => {
      read().updateServiceRequest(requestId, updates);
      bump();
    },

    addNotification: (notification) => {
      read().addNotification(notification);
      bump();
    },

    markNotificationRead: (notificationId) => {
      read().markNotificationRead(notificationId);
      bump();
    },

    addStaffMember: (member) => {
      read().addStaffMember(member);
      bump();
    },

    updateStaffMember: (memberId, updates) => {
      read().updateStaffMember(memberId, updates);
      bump();
    },

    removeStaffMember: (memberId) => {
      read().removeStaffMember(memberId);
      bump();
    },

    addBooking: (booking) => {
      read().addBooking(booking);
      bump();
    },

    updateBooking: (id, updates) => {
      read().updateBooking(id, updates);
      bump();
    },

    addRoom: (room) => {
      read().addRoom(room);
      bump();
    },

    updateRoom: (roomId, updates) => {
      read().updateRoom(roomId, updates);
      bump();
    },

    addMenuItem: (item) => {
      read().addMenuItem(item);
      bump();
    },

    updateMenuItem: (id, updates) => {
      read().updateMenuItem(id, updates);
      bump();
    },

    removeMenuItem: (id) => {
      read().removeMenuItem(id);
      bump();
    },

    addOrder: (order) => {
      read().addOrder(order);
      bump();
    },

    pushActivity: (a) => {
      read().pushActivity(a);
      bump();
    },
  };
});
