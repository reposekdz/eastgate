export type UserRole =
  | "super_admin"
  | "super_manager"
  | "branch_manager"
  | "receptionist"
  | "waiter"
  | "housekeeping"
  | "restaurant_staff"
  | "accountant"
  | "event_manager"
  | "guest";

export type RoomStatus =
  | "available"
  | "occupied"
  | "cleaning"
  | "maintenance"
  | "reserved";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "refunded";

export type RoomType =
  | "deluxe"
  | "executive_suite"
  | "presidential_suite"
  | "standard"
  | "family";

export type PaymentMethod =
  | "stripe"
  | "visa"
  | "mastercard"
  | "mtn_mobile"
  | "airtel_money"
  | "bank_transfer"
  | "paypal"
  | "cash"
  | "split";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type EventType =
  | "wedding"
  | "corporate"
  | "conference"
  | "private_dining"
  | "gala";

export type LoyaltyTier = "silver" | "gold" | "platinum";

export type Department =
  | "front_desk"
  | "housekeeping"
  | "restaurant"
  | "management"
  | "spa"
  | "events"
  | "finance";
