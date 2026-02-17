import type {
  UserRole,
  RoomStatus,
  BookingStatus,
  RoomType,
  PaymentMethod,
  OrderStatus,
  EventType,
  LoyaltyTier,
  Department,
} from "./enums";

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  totalRooms: number;
  occupancyRate: number;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  price: number;
  currentGuest?: string;
  branchId: string;
  /** Data URL from device upload — persisted in store */
  imageUrl?: string;
}

export interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestAvatar: string;
  roomNumber: string;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  addOns: string[];
  branchId: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: LoyaltyTier | null;
  loyaltyPoints: number;
  totalStays: number;
  totalSpent: number;
  lastVisit: string;
  avatar: string;
  nationality: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  department: Department;
  email: string;
  phone: string;
  shift: string;
  status: "active" | "on_leave" | "off_duty";
  avatar: string;
  branchId: string;
  joinDate: string;
  mustChangePassword?: boolean;
}

export interface RestaurantOrder {
  id: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
  status: OrderStatus;
  total: number;
  guestName?: string;
  roomCharge: boolean;
  createdAt: string;
  branchId: string;
  performedBy?: string; // staff name who placed the order
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  /** Data URL from device upload — persisted in store */
  imageUrl?: string;
  popular?: boolean;
  vegetarian?: boolean;
  spicy?: boolean;
}

export interface HotelEvent {
  id: string;
  name: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  hall: string;
  capacity: number;
  attendees: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  totalAmount: number;
  organizer: string;
}

export interface RevenueData {
  month: string;
  rooms: number;
  restaurant: number;
  events: number;
  spa: number;
  services: number;
}

export interface KpiData {
  totalRevenue: number;
  revenueChange: number;
  occupancyRate: number;
  occupancyChange: number;
  adr: number;
  adrChange: number;
  revpar: number;
  revparChange: number;
}

export interface OccupancyData {
  name: string;
  value: number;
  color: string;
}
