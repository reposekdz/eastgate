// ═══════════════════════════════════════════════════════════════
// Manager Notification System for EastGate Hotel
// ═══════════════════════════════════════════════════════════════

export type NotificationType =
  | "welcome"
  | "promotion"
  | "event"
  | "announcement"
  | "wish"
  | "advertisement"
  | "alert"
  | "seasonal";

export interface HotelNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  branchName: string;
  branchId: string;
  managerName: string;
  createdAt: string;
  expiresAt: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  priority: "low" | "medium" | "high";
  active: boolean;
  icon?: string;
}

// Notification type styling
export const notificationStyles: Record<
  NotificationType,
  { gradient: string; icon: string; badge: string }
> = {
  welcome: {
    gradient: "from-emerald-500 to-teal-600",
    icon: "🎉",
    badge: "bg-emerald-100 text-emerald-800",
  },
  promotion: {
    gradient: "from-amber-500 to-orange-600",
    icon: "🔥",
    badge: "bg-amber-100 text-amber-800",
  },
  event: {
    gradient: "from-purple-500 to-indigo-600",
    icon: "🎪",
    badge: "bg-purple-100 text-purple-800",
  },
  announcement: {
    gradient: "from-blue-500 to-cyan-600",
    icon: "📢",
    badge: "bg-blue-100 text-blue-800",
  },
  wish: {
    gradient: "from-pink-500 to-rose-600",
    icon: "💝",
    badge: "bg-pink-100 text-pink-800",
  },
  advertisement: {
    gradient: "from-indigo-500 to-violet-600",
    icon: "✨",
    badge: "bg-indigo-100 text-indigo-800",
  },
  alert: {
    gradient: "from-red-500 to-rose-600",
    icon: "⚠️",
    badge: "bg-red-100 text-red-800",
  },
  seasonal: {
    gradient: "from-green-500 to-lime-600",
    icon: "🌿",
    badge: "bg-green-100 text-green-800",
  },
};

// Mock active notifications from managers
export const mockNotifications: HotelNotification[] = [
  {
    id: "notif-001",
    type: "welcome",
    title: "Welcome to EastGate Hotel! 🌟",
    message:
      "We're delighted to have you. Enjoy 20% off your first spa treatment this week. Use code WELCOME20 at the spa reception.",
    branchName: "EastGate Kigali Main",
    branchId: "br-001",
    managerName: "Jean-Paul Mugisha",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ctaText: "Book Spa Now",
    ctaLink: "/spa",
    priority: "high",
    active: true,
  },
  {
    id: "notif-002",
    type: "promotion",
    title: "Valentine's Special Dinner 🕯️",
    message:
      "Celebrate love with our exclusive 5-course candlelight dinner. Reserve your table for a romantic evening with live jazz music and champagne.",
    branchName: "EastGate Kigali Main",
    branchId: "br-001",
    managerName: "Jean-Paul Mugisha",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=600",
    ctaText: "Reserve Table",
    ctaLink: "/dining",
    priority: "high",
    active: true,
  },
  {
    id: "notif-003",
    type: "event",
    title: "Live Music Night — This Saturday 🎵",
    message:
      "Join us for an unforgettable evening of live Afrobeats and traditional Rwandan music. Free entry for all hotel guests. Starts at 7 PM.",
    branchName: "EastGate Musanze",
    branchId: "br-002",
    managerName: "Alice Uwimana",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    ctaText: "View Events",
    ctaLink: "/events",
    priority: "medium",
    active: true,
  },
  {
    id: "notif-004",
    type: "wish",
    title: "Happy Weekend! 🌅",
    message:
      "Wishing all our valued guests a wonderful weekend. Don't miss our special brunch buffet every Sunday from 9 AM to 1 PM with over 50 dishes!",
    branchName: "EastGate Kigali Main",
    branchId: "br-001",
    managerName: "Jean-Paul Mugisha",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    ctaText: "See Menu",
    ctaLink: "/menu",
    priority: "low",
    active: true,
  },
  {
    id: "notif-005",
    type: "advertisement",
    title: "New Luxury Wing Now Open! 🏨",
    message:
      "Experience our brand-new Presidential wing with 20 premium suites. Each room features a private jacuzzi, panoramic mountain views, and 24/7 butler service.",
    branchName: "EastGate Rubavu",
    branchId: "br-003",
    managerName: "Patrick Habimana",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      "https://images.pexels.com/photos/5883728/pexels-photo-5883728.jpeg?auto=compress&cs=tinysrgb&w=600",
    ctaText: "Explore Suites",
    ctaLink: "/rooms",
    priority: "medium",
    active: true,
  },
];
