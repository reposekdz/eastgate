import type {
  Branch,
  Room,
  Booking,
  Guest,
  StaffMember,
  RestaurantOrder,
  MenuItem,
  HotelEvent,
  RevenueData,
  KpiData,
  OccupancyData,
} from "./types/schema";

// ─── Branches ─────────────────────────────────────────────
export const branches: Branch[] = [
  {
    id: "br-001",
    name: "Kigali Main",
    location: "KG 7 Ave, Kigali City",
    manager: "Jean-Pierre Habimana",
    totalRooms: 120,
    occupancyRate: 78,
  },
  {
    id: "br-002",
    name: "Ngoma Branch",
    location: "Ngoma District, Eastern Province",
    manager: "Diane Uwimana",
    totalRooms: 80,
    occupancyRate: 72,
  },
  {
    id: "br-003",
    name: "Kirehe Branch",
    location: "Kirehe District, Eastern Province",
    manager: "Patrick Niyonsaba",
    totalRooms: 65,
    occupancyRate: 68,
  },
  {
    id: "br-004",
    name: "Gatsibo Branch",
    location: "Gatsibo District, Eastern Province",
    manager: "Emmanuel Mugisha",
    totalRooms: 75,
    occupancyRate: 75,
  },
];

// ─── KPIs ─────────────────────────────────────────────────
export const kpiData: KpiData = {
  totalRevenue: 3702750000,
  revenueChange: 12.5,
  occupancyRate: 78,
  occupancyChange: 3.2,
  adr: 500500,
  adrChange: 8.1,
  revpar: 390000,
  revparChange: 5.7,
};

// ─── Revenue Data ─────────────────────────────────────────
export const revenueData: RevenueData[] = [
  { month: "Jul", rooms: 320000, restaurant: 95000, events: 45000, spa: 28000, services: 12000 },
  { month: "Aug", rooms: 380000, restaurant: 110000, events: 65000, spa: 32000, services: 15000 },
  { month: "Sep", rooms: 350000, restaurant: 105000, events: 55000, spa: 30000, services: 13000 },
  { month: "Oct", rooms: 410000, restaurant: 125000, events: 80000, spa: 35000, services: 18000 },
  { month: "Nov", rooms: 390000, restaurant: 115000, events: 70000, spa: 33000, services: 16000 },
  { month: "Dec", rooms: 450000, restaurant: 140000, events: 95000, spa: 42000, services: 22000 },
  { month: "Jan", rooms: 420000, restaurant: 130000, events: 85000, spa: 38000, services: 20000 },
];

// ─── Occupancy Data ───────────────────────────────────────
export const occupancyData: OccupancyData[] = [
  { name: "Occupied", value: 78, color: "#0B6E4F" },
  { name: "Reserved", value: 8, color: "#8B5CF6" },
  { name: "Available", value: 10, color: "#10B981" },
  { name: "Maintenance", value: 4, color: "#EF4444" },
];

// ─── Rooms ────────────────────────────────────────────────
export const rooms: Room[] = [
  { id: "rm-101", number: "101", floor: 1, type: "deluxe", status: "occupied", price: 250, currentGuest: "Sarah Mitchell", branchId: "br-001" },
  { id: "rm-102", number: "102", floor: 1, type: "deluxe", status: "available", price: 250, branchId: "br-001" },
  { id: "rm-103", number: "103", floor: 1, type: "standard", status: "cleaning", price: 180, branchId: "br-001" },
  { id: "rm-104", number: "104", floor: 1, type: "standard", status: "available", price: 180, branchId: "br-001" },
  { id: "rm-105", number: "105", floor: 1, type: "family", status: "reserved", price: 320, branchId: "br-001" },
  { id: "rm-201", number: "201", floor: 2, type: "executive_suite", status: "occupied", price: 450, currentGuest: "James Okafor", branchId: "br-001" },
  { id: "rm-202", number: "202", floor: 2, type: "executive_suite", status: "available", price: 450, branchId: "br-001" },
  { id: "rm-203", number: "203", floor: 2, type: "deluxe", status: "maintenance", price: 250, branchId: "br-001" },
  { id: "rm-204", number: "204", floor: 2, type: "deluxe", status: "occupied", price: 250, currentGuest: "Amara Chen", branchId: "br-001" },
  { id: "rm-205", number: "205", floor: 2, type: "family", status: "available", price: 320, branchId: "br-001" },
  { id: "rm-301", number: "301", floor: 3, type: "presidential_suite", status: "occupied", price: 850, currentGuest: "Victoria Laurent", branchId: "br-001" },
  { id: "rm-302", number: "302", floor: 3, type: "presidential_suite", status: "reserved", price: 850, branchId: "br-001" },
  { id: "rm-303", number: "303", floor: 3, type: "executive_suite", status: "cleaning", price: 450, branchId: "br-001" },
  { id: "rm-304", number: "304", floor: 3, type: "deluxe", status: "available", price: 250, branchId: "br-001" },
  { id: "rm-305", number: "305", floor: 3, type: "standard", status: "occupied", price: 180, currentGuest: "David Kirabo", branchId: "br-001" },
  { id: "rm-401", number: "401", floor: 4, type: "executive_suite", status: "available", price: 450, branchId: "br-001" },
  { id: "rm-402", number: "402", floor: 4, type: "deluxe", status: "occupied", price: 250, currentGuest: "Lisa Wang", branchId: "br-001" },
  { id: "rm-403", number: "403", floor: 4, type: "standard", status: "available", price: 180, branchId: "br-001" },
];

// ─── Bookings ─────────────────────────────────────────────
export const bookings: Booking[] = [
  { id: "BK-2024001", guestName: "Sarah Mitchell", guestEmail: "sarah@email.com", guestAvatar: "https://i.pravatar.cc/40?u=sarah-m", roomNumber: "101", roomType: "deluxe", checkIn: "2026-02-10", checkOut: "2026-02-14", status: "checked_in", totalAmount: 1000, paymentMethod: "visa", addOns: ["Airport Pickup", "Breakfast"], branchId: "br-001" },
  { id: "BK-2024002", guestName: "James Okafor", guestEmail: "james@email.com", guestAvatar: "https://i.pravatar.cc/40?u=james-o", roomNumber: "201", roomType: "executive_suite", checkIn: "2026-02-11", checkOut: "2026-02-15", status: "checked_in", totalAmount: 1800, paymentMethod: "mastercard", addOns: ["Spa Package", "Extra Bed"], branchId: "br-001" },
  { id: "BK-2024003", guestName: "Amara Chen", guestEmail: "amara@email.com", guestAvatar: "https://i.pravatar.cc/40?u=amara-c", roomNumber: "204", roomType: "deluxe", checkIn: "2026-02-09", checkOut: "2026-02-13", status: "checked_in", totalAmount: 1000, paymentMethod: "stripe", addOns: ["Tour Package"], branchId: "br-001" },
  { id: "BK-2024004", guestName: "Victoria Laurent", guestEmail: "victoria@email.com", guestAvatar: "https://i.pravatar.cc/40?u=victoria-l", roomNumber: "301", roomType: "presidential_suite", checkIn: "2026-02-10", checkOut: "2026-02-17", status: "checked_in", totalAmount: 5950, paymentMethod: "visa", addOns: ["Airport Pickup", "Honeymoon Decoration", "Spa Package"], branchId: "br-001" },
  { id: "BK-2024005", guestName: "Mohammed Al-Rashid", guestEmail: "mohammed@email.com", guestAvatar: "https://i.pravatar.cc/40?u=mohammed-r", roomNumber: "105", roomType: "family", checkIn: "2026-02-14", checkOut: "2026-02-18", status: "confirmed", totalAmount: 1280, paymentMethod: "mtn_mobile", addOns: ["Breakfast", "Extra Bed"], branchId: "br-001" },
  { id: "BK-2024006", guestName: "Elena Petrova", guestEmail: "elena@email.com", guestAvatar: "https://i.pravatar.cc/40?u=elena-p", roomNumber: "302", roomType: "presidential_suite", checkIn: "2026-02-15", checkOut: "2026-02-20", status: "confirmed", totalAmount: 4250, paymentMethod: "stripe", addOns: ["Airport Pickup", "Tour Package"], branchId: "br-001" },
  { id: "BK-2024007", guestName: "Kwame Asante", guestEmail: "kwame@email.com", guestAvatar: "https://i.pravatar.cc/40?u=kwame-a", roomNumber: "202", roomType: "executive_suite", checkIn: "2026-02-16", checkOut: "2026-02-19", status: "pending", totalAmount: 1350, paymentMethod: "airtel_money", addOns: [], branchId: "br-001" },
  { id: "BK-2024008", guestName: "Ingrid Johansson", guestEmail: "ingrid@email.com", guestAvatar: "https://i.pravatar.cc/40?u=ingrid-j", roomNumber: "304", roomType: "deluxe", checkIn: "2026-02-12", checkOut: "2026-02-14", status: "checked_out", totalAmount: 500, paymentMethod: "visa", addOns: ["Breakfast"], branchId: "br-001" },
  { id: "BK-2024009", guestName: "Carlos Mendoza", guestEmail: "carlos@email.com", guestAvatar: "https://i.pravatar.cc/40?u=carlos-m", roomNumber: "403", roomType: "standard", checkIn: "2026-02-08", checkOut: "2026-02-10", status: "checked_out", totalAmount: 360, paymentMethod: "cash", addOns: [], branchId: "br-001" },
  { id: "BK-2024010", guestName: "Fatima Hassan", guestEmail: "fatima@email.com", guestAvatar: "https://i.pravatar.cc/40?u=fatima-h", roomNumber: "103", roomType: "standard", checkIn: "2026-02-05", checkOut: "2026-02-07", status: "cancelled", totalAmount: 360, paymentMethod: "mtn_mobile", addOns: ["Breakfast"], branchId: "br-001" },
];

// ─── Guests ───────────────────────────────────────────────
export const guests: Guest[] = [
  { id: "g-001", name: "Sarah Mitchell", email: "sarah@email.com", phone: "+1 555-0101", loyaltyTier: "platinum", loyaltyPoints: 15200, totalStays: 12, totalSpent: 28500, lastVisit: "2026-02-10", avatar: "https://i.pravatar.cc/40?u=sarah-mitchell", nationality: "United States" },
  { id: "g-002", name: "James Okafor", email: "james@email.com", phone: "+234 802-0202", loyaltyTier: "gold", loyaltyPoints: 8400, totalStays: 7, totalSpent: 14200, lastVisit: "2026-02-11", avatar: "https://i.pravatar.cc/40?u=james-okafor", nationality: "Nigeria" },
  { id: "g-003", name: "Amara Chen", email: "amara@email.com", phone: "+86 139-0303", loyaltyTier: "gold", loyaltyPoints: 6800, totalStays: 5, totalSpent: 11500, lastVisit: "2026-02-09", avatar: "https://i.pravatar.cc/40?u=amara-chen", nationality: "China" },
  { id: "g-004", name: "Victoria Laurent", email: "victoria@email.com", phone: "+33 6-0404", loyaltyTier: "platinum", loyaltyPoints: 22100, totalStays: 18, totalSpent: 52000, lastVisit: "2026-02-10", avatar: "https://i.pravatar.cc/40?u=victoria-laurent", nationality: "France" },
  { id: "g-005", name: "Mohammed Al-Rashid", email: "mohammed@email.com", phone: "+971 50-0505", loyaltyTier: "silver", loyaltyPoints: 3200, totalStays: 3, totalSpent: 5800, lastVisit: "2026-01-20", avatar: "https://i.pravatar.cc/40?u=mohammed-rashid", nationality: "UAE" },
  { id: "g-006", name: "Elena Petrova", email: "elena@email.com", phone: "+7 926-0606", loyaltyTier: "silver", loyaltyPoints: 2100, totalStays: 2, totalSpent: 4200, lastVisit: "2026-01-05", avatar: "https://i.pravatar.cc/40?u=elena-petrova", nationality: "Russia" },
  { id: "g-007", name: "Kwame Asante", email: "kwame@email.com", phone: "+233 24-0707", loyaltyTier: null, loyaltyPoints: 850, totalStays: 1, totalSpent: 1350, lastVisit: "2025-12-15", avatar: "https://i.pravatar.cc/40?u=kwame-asante", nationality: "Ghana" },
  { id: "g-008", name: "Ingrid Johansson", email: "ingrid@email.com", phone: "+46 70-0808", loyaltyTier: "gold", loyaltyPoints: 7600, totalStays: 6, totalSpent: 12800, lastVisit: "2026-02-12", avatar: "https://i.pravatar.cc/40?u=ingrid-johansson", nationality: "Sweden" },
];

// ─── Staff ────────────────────────────────────────────────
export const staff: StaffMember[] = [
  { id: "s-001", name: "Jean-Pierre Habimana", role: "branch_manager", department: "management", email: "jp@eastgate.rw", phone: "+250 788-001", shift: "Day", status: "active", avatar: "https://i.pravatar.cc/40?u=jp-habimana", branchId: "br-001", joinDate: "2022-03-15" },
  { id: "s-002", name: "Grace Uwase", role: "receptionist", department: "front_desk", email: "grace@eastgate.rw", phone: "+250 788-002", shift: "Morning", status: "active", avatar: "https://i.pravatar.cc/40?u=grace-uwase", branchId: "br-001", joinDate: "2023-01-10" },
  { id: "s-003", name: "Emmanuel Ndayisaba", role: "receptionist", department: "front_desk", email: "emmanuel@eastgate.rw", phone: "+250 788-003", shift: "Evening", status: "active", avatar: "https://i.pravatar.cc/40?u=emmanuel-n", branchId: "br-001", joinDate: "2023-06-01" },
  { id: "s-004", name: "Claudine Mukamana", role: "housekeeping", department: "housekeeping", email: "claudine@eastgate.rw", phone: "+250 788-004", shift: "Morning", status: "active", avatar: "https://i.pravatar.cc/40?u=claudine-m", branchId: "br-001", joinDate: "2022-08-20" },
  { id: "s-005", name: "Patrick Bizimana", role: "restaurant_staff", department: "restaurant", email: "patrick@eastgate.rw", phone: "+250 788-005", shift: "Split", status: "active", avatar: "https://i.pravatar.cc/40?u=patrick-b", branchId: "br-001", joinDate: "2023-02-15" },
  { id: "s-006", name: "Aimée Kamikazi", role: "accountant", department: "finance", email: "aimee@eastgate.rw", phone: "+250 788-006", shift: "Day", status: "active", avatar: "https://i.pravatar.cc/40?u=aimee-k", branchId: "br-001", joinDate: "2022-05-01" },
  { id: "s-007", name: "Thierry Mugabo", role: "event_manager", department: "events", email: "thierry@eastgate.rw", phone: "+250 788-007", shift: "Day", status: "on_leave", avatar: "https://i.pravatar.cc/40?u=thierry-m", branchId: "br-001", joinDate: "2023-09-01" },
  { id: "s-008", name: "Sandrine Iradukunda", role: "housekeeping", department: "spa", email: "sandrine@eastgate.rw", phone: "+250 788-008", shift: "Morning", status: "active", avatar: "https://i.pravatar.cc/40?u=sandrine-i", branchId: "br-001", joinDate: "2024-01-15" },
];

// ─── Restaurant Orders ───────────────────────────────────
export const restaurantOrders: RestaurantOrder[] = [
  { id: "ORD-001", tableNumber: 5, items: [{ name: "Grilled Tilapia", quantity: 2, price: 18 }, { name: "Rwandan Coffee", quantity: 2, price: 5 }], status: "preparing", total: 46, guestName: "Sarah Mitchell", roomCharge: true, createdAt: "2026-02-12T12:30:00" },
  { id: "ORD-002", tableNumber: 3, items: [{ name: "Isombe & Plantain", quantity: 1, price: 14 }, { name: "Fresh Juice", quantity: 1, price: 6 }], status: "ready", total: 20, guestName: "Walk-in Guest", roomCharge: false, createdAt: "2026-02-12T12:15:00" },
  { id: "ORD-003", tableNumber: 8, items: [{ name: "Brochette Platter", quantity: 3, price: 22 }, { name: "Banana Wine", quantity: 3, price: 8 }], status: "pending", total: 90, guestName: "James Okafor", roomCharge: true, createdAt: "2026-02-12T12:45:00" },
  { id: "ORD-004", tableNumber: 1, items: [{ name: "Continental Breakfast", quantity: 2, price: 15 }, { name: "Orange Juice", quantity: 2, price: 5 }], status: "served", total: 40, guestName: "Victoria Laurent", roomCharge: true, createdAt: "2026-02-12T08:00:00" },
  { id: "ORD-005", tableNumber: 12, items: [{ name: "Nyama Choma", quantity: 1, price: 25 }, { name: "Fanta Citron", quantity: 1, price: 3 }], status: "preparing", total: 28, roomCharge: false, createdAt: "2026-02-12T13:00:00" },
];

// ─── Menu Items ──────────────────────────────────────────
export const menuItems: MenuItem[] = [
  { id: "mi-001", name: "Continental Breakfast", category: "Breakfast", price: 15, description: "Eggs, toast, fresh fruit, pastries, juice", available: true },
  { id: "mi-002", name: "Rwandan Breakfast", category: "Breakfast", price: 12, description: "Sweet potatoes, beans, banana, fresh milk", available: true },
  { id: "mi-003", name: "Grilled Tilapia", category: "Main Course", price: 18, description: "Lake Kivu tilapia with vegetables and rice", available: true },
  { id: "mi-004", name: "Brochette Platter", category: "Main Course", price: 22, description: "Grilled meat skewers with fries and salad", available: true },
  { id: "mi-005", name: "Isombe & Plantain", category: "Main Course", price: 14, description: "Traditional cassava leaves with plantain", available: true },
  { id: "mi-006", name: "Nyama Choma", category: "Main Course", price: 25, description: "Flame-grilled beef with ugali", available: true },
  { id: "mi-007", name: "Rwandan Coffee", category: "Beverages", price: 5, description: "Premium single-origin Rwandan coffee", available: true },
  { id: "mi-008", name: "Fresh Juice", category: "Beverages", price: 6, description: "Passion fruit, mango, or mixed fruit", available: true },
  { id: "mi-009", name: "Banana Wine", category: "Beverages", price: 8, description: "Traditional Rwandan banana wine", available: true },
  { id: "mi-010", name: "Chocolate Lava Cake", category: "Desserts", price: 10, description: "Warm chocolate cake with vanilla ice cream", available: true },
];

// ─── Events ──────────────────────────────────────────────
export const events: HotelEvent[] = [
  { id: "ev-001", name: "Kigali Tech Summit", type: "conference", date: "2026-02-20", startTime: "09:00", endTime: "17:00", hall: "Grand Ballroom", capacity: 500, attendees: 380, status: "upcoming", totalAmount: 45000, organizer: "TechRwanda Ltd" },
  { id: "ev-002", name: "Uwimana Wedding", type: "wedding", date: "2026-02-22", startTime: "14:00", endTime: "23:00", hall: "Garden Terrace", capacity: 200, attendees: 180, status: "upcoming", totalAmount: 28000, organizer: "Uwimana Family" },
  { id: "ev-003", name: "AfriBank Annual Gala", type: "gala", date: "2026-03-01", startTime: "19:00", endTime: "00:00", hall: "Grand Ballroom", capacity: 500, attendees: 450, status: "upcoming", totalAmount: 62000, organizer: "AfriBank Group" },
  { id: "ev-004", name: "Regional HR Workshop", type: "corporate", date: "2026-02-15", startTime: "08:00", endTime: "16:00", hall: "Conference Room A", capacity: 80, attendees: 65, status: "ongoing", totalAmount: 8500, organizer: "EAC Consulting" },
  { id: "ev-005", name: "Private Wine Tasting", type: "private_dining", date: "2026-02-14", startTime: "18:00", endTime: "21:00", hall: "VIP Dining Room", capacity: 30, attendees: 24, status: "completed", totalAmount: 3200, organizer: "Laurent Estate" },
];

// ─── Financial Data ──────────────────────────────────────
export const expenseData = [
  { category: "Staff Salaries", amount: 185000, percentage: 38 },
  { category: "Utilities", amount: 42000, percentage: 9 },
  { category: "Food & Beverage", amount: 78000, percentage: 16 },
  { category: "Maintenance", amount: 35000, percentage: 7 },
  { category: "Marketing", amount: 28000, percentage: 6 },
  { category: "Insurance", amount: 22000, percentage: 5 },
  { category: "Technology", amount: 18000, percentage: 4 },
  { category: "Other", amount: 72000, percentage: 15 },
];

export const branchComparison = [
  { branch: "Kigali Main", revenue: 1650000, occupancy: 78, adr: 385000 },
  { branch: "Ngoma Branch", revenue: 980000, occupancy: 72, adr: 320000 },
  { branch: "Kirehe Branch", revenue: 720000, occupancy: 68, adr: 295000 },
  { branch: "Gatsibo Branch", revenue: 850000, occupancy: 75, adr: 310000 },
];
