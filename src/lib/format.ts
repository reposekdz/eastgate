import type {
  RoomStatus,
  BookingStatus,
  RoomType,
  OrderStatus,
  LoyaltyTier,
  Department,
  UserRole,
} from "./types/enums";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${period}`;
}

export function getRoomStatusLabel(status: RoomStatus): string {
  const labels: Record<RoomStatus, string> = {
    available: "Available",
    occupied: "Occupied",
    cleaning: "Cleaning",
    maintenance: "Maintenance",
    reserved: "Reserved",
  };
  return labels[status];
}

export function getBookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked In",
    checked_out: "Checked Out",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return labels[status];
}

export function getRoomTypeLabel(type: RoomType): string {
  const labels: Record<RoomType, string> = {
    deluxe: "Deluxe",
    executive_suite: "Executive Suite",
    presidential_suite: "Presidential Suite",
    standard: "Standard",
    family: "Family",
  };
  return labels[type];
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function getLoyaltyTierLabel(tier: LoyaltyTier | null): string {
  if (!tier) return "Member";
  const labels: Record<LoyaltyTier, string> = {
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
  };
  return labels[tier];
}

export function getDepartmentLabel(dept: Department): string {
  const labels: Record<Department, string> = {
    front_desk: "Front Desk",
    housekeeping: "Housekeeping",
    restaurant: "Restaurant",
    management: "Management",
    spa: "Spa & Wellness",
    events: "Events",
    finance: "Finance",
  };
  return labels[dept];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    branch_manager: "Branch Manager",
    receptionist: "Receptionist",
    housekeeping: "Housekeeping",
    restaurant_staff: "Restaurant Staff",
    accountant: "Accountant",
    event_manager: "Event Manager",
  };
  return labels[role];
}
