"use client";

import { useI18nStore, languages } from "./index";
import { translations } from "./translations";
import type { Locale } from "./translations";

// Get nested translation value
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

// Main translation hook
export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);

  const t = (key: string, fallback?: string): string => {
    // Try to get translation for current locale
    const value = getNestedValue(translations, key);
    
    if (value && typeof value === "object") {
      // If it's an object, try to get the locale-specific value
      const localeValue = (value as any)[locale as string];
      if (localeValue) return localeValue;
      
      // Fallback to English
      const enValue = (value as any).en;
      if (enValue) return enValue;
      
      // If no English, use the first available value
      const firstValue = Object.values(value as any)[0];
      if (typeof firstValue === "string") return firstValue;
    }
    
    // Return fallback or key
    return fallback || key;
  };

  return { t, locale, languages };
}

// Hook for getting a specific translation
export function useTranslationForKey(key: string) {
  const { t, locale, languages } = useTranslation();
  return {
    value: t(key),
    locale,
    languages,
  };
}

// Translation component
"use client";
import { createContext, useContext, ReactNode } from "react";

interface TranslationContextType {
  t: (key: string, fallback?: string) => string;
  locale: Locale;
  languages: typeof languages;
  changeLocale: (locale: Locale) => void;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { t, locale, languages } = useTranslation();
  const changeLocale = useI18nStore((state) => state.setLocale);

  return (
    <TranslationContext.Provider value={{ t, locale, languages, changeLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslationContext must be used within TranslationProvider");
  }
  return context;
}

// Helper function for server components
export function getTranslation(key: string, locale: Locale = "en"): string {
  const value = getNestedValue(translations, key);
  
  if (value && typeof value === "object") {
    const localeValue = (value as any)[locale as string];
    if (localeValue) return localeValue;
    
    const enValue = (value as any).en;
    if (enValue) return enValue;
    
    const firstValue = Object.values(value as any)[0];
    if (typeof firstValue === "string") return firstValue;
  }
  
  return key;
}

// Export all available translation keys for documentation
export const translationKeys = {
  // Common
  common: [
    "common.appName",
    "common.brandTagline",
    "common.search",
    "common.filter",
    "common.sort",
    "common.all",
    "common.save",
    "common.cancel",
    "common.confirm",
    "common.delete",
    "common.edit",
    "common.view",
    "common.close",
    "common.back",
    "common.next",
    "common.continue",
    "common.submit",
    "common.loading",
    "common.noResults",
    "common.perNight",
    "common.nights",
    "common.night",
    "common.guests",
    "common.guest",
    "common.total",
    "common.welcome",
    "common.dashboard",
    "common.settings",
    "common.logout",
    "common.language",
    "common.yes",
    "common.no",
    "common.name",
    "common.email",
    "common.phone",
    "common.address",
    "common.room",
    "common.rooms",
    "common.bookings",
    "common.menu",
    "common.orders",
    "common.price",
    "common.available",
    "common.unavailable",
    "common.popular",
    "common.new",
    "common.today",
    "common.status",
    "common.date",
    "common.time",
    "common.pending",
    "common.completed",
    "common.active",
    "common.inactive",
    "common.items",
    "common.more",
    "common.branch",
    "common.branches",
    "common.services",
    "common.overview",
    "common.actions",
    "common.amount",
    "common.inProgress",
  ],
  
  // Navigation
  nav: [
    "nav.home",
    "nav.about",
    "nav.rooms",
    "nav.dining",
    "nav.spa",
    "nav.events",
    "nav.gallery",
    "nav.contact",
    "nav.bookRoom",
    "nav.viewMenu",
    "nav.preOrder",
    "nav.orderFood",
    "nav.order",
    "nav.login",
    "nav.register",
  ],
  
  // Authentication
  auth: [
    "auth.loginTitle",
    "auth.loginSubtitle",
    "auth.email",
    "auth.password",
    "auth.rememberMe",
    "auth.forgotPassword",
    "auth.signIn",
    "auth.invalidCredentials",
    "auth.accountLocked",
  ],
  
  // Admin
  admin: [
    "admin.dashboard",
    "admin.totalRooms",
    "admin.availableRooms",
    "admin.occupiedRooms",
    "admin.totalBookings",
    "admin.pendingBookings",
    "admin.confirmedBookings",
    "admin.totalRevenue",
    "admin.todayRevenue",
    "admin.staff",
    "admin.addStaff",
    "admin.manageStaff",
    "admin.role",
    "admin.department",
    "admin.shift",
    "admin.manager",
    "admin.receptionist",
    "admin.waiter",
    "admin.chef",
    "admin.kitchenStaff",
    "admin.superAdmin",
    "admin.superManager",
    "admin.branchManager",
  ],
  
  // Rooms
  rooms: [
    "rooms.standardRoom",
    "rooms.deluxeRoom",
    "rooms.suite",
    "rooms.singleRoom",
    "rooms.doubleRoom",
    "rooms.checkIn",
    "rooms.checkOut",
    "rooms.roomNumber",
    "rooms.floor",
    "rooms.roomType",
    "rooms.roomStatus",
    "rooms.roomPrice",
    "rooms.roomDescription",
    "rooms.amenities",
    "rooms.wifi",
    "rooms.breakfast",
    "rooms.airConditioning",
    "rooms.tv",
    "rooms.minibar",
  ],
  
  // Booking
  booking: [
    "booking.bookNow",
    "booking.selectDates",
    "booking.selectGuests",
    "booking.adults",
    "booking.children",
    "booking.checkInDate",
    "booking.checkOutDate",
    "booking.specialRequests",
    "booking.bookingConfirmed",
    "booking.bookingPending",
    "booking.bookingCancelled",
    "booking.reservation",
    "booking.confirmBooking",
    "booking.cancelBooking",
    "booking.viewBooking",
  ],
  
  // Restaurant
  restaurant: [
    "restaurant.restaurant",
    "restaurant.breakfast",
    "restaurant.lunch",
    "restaurant.dinner",
    "restaurant.drinks",
    "restaurant.desserts",
    "restaurant.vegetarian",
    "restaurant.spicy",
    "restaurant.addToCart",
    "restaurant.removeFromCart",
    "restaurant.yourOrder",
    "restaurant.placeOrder",
    "restaurant.orderPlaced",
    "restaurant.preparing",
    "restaurant.ready",
    "restaurant.served",
    "restaurant.tableNumber",
    "restaurant.table",
  ],
  
  // Payment
  payment: [
    "payment.payment",
    "payment.paymentMethod",
    "payment.creditCard",
    "payment.debitCard",
    "payment.cash",
    "payment.bankTransfer",
    "payment.mobileMoney",
    "payment.payNow",
    "payment.paymentSuccessful",
    "payment.paymentFailed",
    "payment.totalAmount",
    "payment.tax",
    "payment.subtotal",
  ],
  
  // Events
  events: [
    "events.upcoming",
    "events.past",
    "events.eventName",
    "events.eventDate",
    "events.eventLocation",
    "events.eventType",
    "events.capacity",
    "events.attendees",
    "events.bookEvent",
    "events.conference",
    "events.wedding",
    "events.birthday",
  ],
  
  // Spa
  spa: [
    "spa.spaServices",
    "spa.massage",
    "spa.facial",
    "spa.bodyTreatment",
    "spa.sauna",
    "spa.steamRoom",
    "spa.bookAppointment",
    "spa.duration",
    "spa.minutes",
    "spa.hours",
  ],
  
  // Messages
  messages: [
    "messages.messages",
    "messages.inbox",
    "messages.sent",
    "messages.compose",
    "messages.reply",
    "messages.forward",
    "messages.deleteMessage",
    "messages.unread",
    "messages.read",
    "messages.starred",
    "messages.archived",
  ],
  
  // Guest
  guest: [
    "guest.guestDetails",
    "guest.guestName",
    "guest.guestEmail",
    "guest.guestPhone",
    "guest.nationality",
    "guest.passportNumber",
    "guest.loyaltyPoints",
    "guest.membership",
  ],
};

export default translationKeys;
