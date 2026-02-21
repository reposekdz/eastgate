import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isManager } from "@/lib/auth";

// GET - Advanced search across all data with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Check permissions
    if (!isSuperAdmin(userRole) && !isManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    // Main search query
    const query = searchParams.get("q") || searchParams.get("query") || "";
    // Filter by type
    const type = searchParams.get("type") || "all";
    // Filter by status
    const status = searchParams.get("status") || "";
    // Filter by date range
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    // Sort
    const sortBy = searchParams.get("sortBy") || "relevance";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!query || query.length < 1) {
      // If no query, return recent items
      return getRecentItems(userRole, userBranchId, type, limit);
    }

    const searchTerm = `%${query}%`;
    const results: any = {
      rooms: [],
      guests: [],
      bookings: [],
      staff: [],
      orders: [],
      menuItems: [],
      contacts: [],
      events: [],
      payments: [],
      services: [],
    };

    const isSuper = isSuperAdmin(userRole);
    const branchFilter = isSuper ? "" : `AND branch_id = '${userBranchId}'`;
    const statusFilter = status ? `AND status = '${status}'` : "";
    const dateFilter = buildDateFilter(dateFrom, dateTo);

    // Search Rooms
    if (type === "all" || type === "rooms") {
      try {
        const rooms = await prisma.$queryRawUnsafe(`
          SELECT id, number as name, room_type as type, status, price, floor, description, branch_id as branchId
          FROM rooms 
          WHERE (number LIKE ? OR description LIKE ? OR CAST(price AS CHAR) LIKE ?) ${branchFilter} ${statusFilter}
          ORDER BY ${sortBy === "relevance" ? "number" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.rooms = rooms.map(r => ({
          ...r,
          category: 'Room',
          typeLabel: getRoomTypeLabel(r.type),
          statusColor: getStatusColor(r.status),
          url: `/admin/rooms`
        }));
      } catch (e) { console.error("Room search error:", e); }
    }

    // Search Guests
    if (type === "all" || type === "guests") {
      try {
        const guests = await prisma.$queryRawUnsafe(`
          SELECT id, name, email, phone, nationality, loyalty_tier as loyaltyTier, total_spent as totalSpent, branch_id as branchId
          FROM guests 
          WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ? OR nationality LIKE ?) ${branchFilter}
          ORDER BY ${sortBy === "relevance" ? "name" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.guests = guests.map(g => ({
          ...g,
          category: 'Guest',
          loyaltyColor: getLoyaltyColor(g.loyaltyTier),
          url: `/admin/guests`
        }));
      } catch (e) { console.error("Guest search error:", e); }
    }

    // Search Bookings
    if (type === "all" || type === "bookings") {
      try {
        const bookings = await prisma.$queryRawUnsafe(`
          SELECT id, guest_name as guestName, guest_email as guestEmail, guest_phone as guestPhone,
                 room_number as roomNumber, room_type as roomType,
                 status, check_in as checkIn, check_out as checkOut, 
                 total_amount as totalAmount, payment_method as paymentMethod,
                 adults, children, branch_id as branchId, created_at as createdAt
          FROM bookings 
          WHERE (guest_name LIKE ? OR guest_email LIKE ? OR guest_phone LIKE ? OR room_number LIKE ?) 
          ${branchFilter} ${statusFilter} ${dateFilter}
          ORDER BY ${sortBy === "relevance" ? "created_at" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.bookings = bookings.map(b => ({
          ...b,
          category: 'Booking',
          statusColor: getStatusColor(b.status),
          paymentStatus: getPaymentStatus(b.totalAmount, b.paymentMethod),
          url: `/admin/bookings`
        }));
      } catch (e) { console.error("Booking search error:", e); }
    }

    // Search Staff
    if (type === "all" || type === "staff") {
      try {
        const staff = await prisma.$queryRawUnsafe(`
          SELECT id, name, email, phone, role, department, status, branch_id as branchId, created_at as createdAt
          FROM staff 
          WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ? OR department LIKE ? OR role LIKE ?) ${branchFilter} ${statusFilter}
          ORDER BY ${sortBy === "relevance" ? "name" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.staff = staff.map(s => ({
          ...s,
          category: 'Staff',
          roleColor: getRoleColor(s.role),
          statusColor: getStatusColor(s.status),
          url: `/admin/staff`
        }));
      } catch (e) { console.error("Staff search error:", e); }
    }

    // Search Orders
    if (type === "all" || type === "orders") {
      try {
        const orders = await prisma.$queryRawUnsafe(`
          SELECT id, table_number as tableNumber, guest_name as guestName, guest_phone as guestPhone,
                 status, total, notes, room_charge as roomCharge, branch_id as branchId,
                 created_at as createdAt
          FROM orders 
          WHERE (guest_name LIKE ? OR CAST(table_number AS CHAR) LIKE ? OR notes LIKE ?) 
          ${branchFilter} ${statusFilter} ${dateFilter}
          ORDER BY ${sortBy === "relevance" ? "created_at" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.orders = orders.map(o => ({
          ...o,
          category: 'Order',
          statusColor: getStatusColor(o.status),
          url: `/admin/restaurant`
        }));
      } catch (e) { console.error("Order search error:", e); }
    }

    // Search Menu Items
    if (type === "all" || type === "menu") {
      try {
        const menuItems = await prisma.$queryRawUnsafe(`
          SELECT id, name, category, price, description, available, popular, vegetarian, spicy,
                 image_url as imageUrl, branch_id as branchId
          FROM menu_items 
          WHERE (name LIKE ? OR category LIKE ? OR description LIKE ?) ${branchFilter}
          ORDER BY ${sortBy === "relevance" ? "name" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.menuItems = menuItems.map(m => ({
          ...m,
          category: 'Menu Item',
          availableColor: m.available ? "text-emerald-600" : "text-red-500",
          url: `/admin/restaurant`
        }));
      } catch (e) { console.error("Menu search error:", e); }
    }

    // Search Contacts
    if (type === "all" || type === "contacts") {
      try {
        const contacts = await prisma.$queryRawUnsafe(`
          SELECT id, name, email, phone, subject, message, status, type, branch_id as branchId, created_at as createdAt
          FROM contacts 
          WHERE (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?) ${branchFilter} ${statusFilter} ${dateFilter}
          ORDER BY ${sortBy === "relevance" ? "created_at" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.contacts = contacts.map(c => ({
          ...c,
          category: 'Contact',
          statusColor: getStatusColor(c.status),
          typeIcon: getContactTypeIcon(c.type),
          url: `/admin/contacts`
        }));
      } catch (e) { console.error("Contact search error:", e); }
    }
    // Search Events
    if (type === "all" || type === "events") {
      try {
        const events = await prisma.$queryRawUnsafe(`
          SELECT id, name, type, date, start_time as startTime, end_time as endTime,
                 hall, capacity, attendees, status, total_amount as totalAmount,
                 organizer, description, branch_id as branchId, created_at as createdAt
          FROM events 
          WHERE (name LIKE ? OR organizer LIKE ? OR hall LIKE ? OR description LIKE ?) 
          ${branchFilter} ${statusFilter} ${dateFilter}
          ORDER BY ${sortBy === "relevance" ? "date" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.events = events.map(e => ({
          ...e,
          category: 'Event',
          statusColor: getStatusColor(e.status),
          typeIcon: getEventTypeIcon(e.type),
          url: `/admin/events`
        }));
      } catch (e) { console.error("Event search error:", e); }
    }

    // Search Payments
    if (type === "all" || type === "payments") {
      try {
        const payments = await prisma.$queryRawUnsafe(`
          SELECT id, booking_id as bookingId, order_id as orderId, amount, status,
                 payment_method as paymentMethod, transaction_id as transactionId,
                 branch_id as branchId, created_at as createdAt
          FROM payments 
          WHERE (transaction_id LIKE ? OR CAST(amount AS CHAR) LIKE ?) ${branchFilter} ${statusFilter} ${dateFilter}
          ORDER BY ${sortBy === "relevance" ? "created_at" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, limit, offset) as any[];
        results.payments = payments.map(p => ({
          ...p,
          category: 'Payment',
          statusColor: getStatusColor(p.status),
          methodIcon: getPaymentMethodIcon(p.paymentMethod),
          url: `/admin/payments`
        }));
      } catch (e) { console.error("Payment search error:", e); }
    }

    // Search Services
    if (type === "all" || type === "services") {
      try {
        const services = await prisma.$queryRawUnsafe(`
          SELECT id, name, type, price, duration, description, available, branch_id as branchId
          FROM services 
          WHERE (name LIKE ? OR type LIKE ? OR description LIKE ?) ${branchFilter}
          ORDER BY ${sortBy === "relevance" ? "name" : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `, searchTerm, searchTerm, searchTerm, limit, offset) as any[];
        results.services = services.map(s => ({
          ...s,
          category: 'Service',
          availableColor: s.available ? "text-emerald-600" : "text-red-500",
          url: `/admin/spa`
        }));
      } catch (e) { console.error("Service search error:", e); }
    }

    // Calculate totals
    const totalResults =
      results.rooms.length +
      results.guests.length +
      results.bookings.length +
      results.staff.length +
      results.orders.length +
      results.menuItems.length +
      results.contacts.length +
      results.events.length +
      results.payments.length +
      results.services.length;

    // Get available filters based on data
    const filters = await getAvailableFilters(userRole, userBranchId, query);

    return NextResponse.json({
      success: true,
      query,
      type,
      total: totalResults,
      page,
      limit,
      results,
      filters,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({
      success: false,
      error: "Search failed",
      message: process.env.NODE_ENV === "development" ? (error as Error).message : "Database error"
    }, { status: 500 });
  }
}

// Helper function to get recent items
async function getRecentItems(userRole: string, userBranchId: string, type: string, limit: number) {
  const isSuper = isSuperAdmin(userRole);
  const branchFilter = isSuper ? "" : `AND branch_id = '${userBranchId}'`;

  const results: any = { rooms: [], guests: [], bookings: [], staff: [], orders: [] };

  try {
    if (type === "all" || type === "rooms") {
      results.rooms = await prisma.$queryRawUnsafe(`
        SELECT id, number as name, room_type as type, status, price 
        FROM rooms ${branchFilter} ORDER BY updated_at DESC LIMIT ?
      `, limit) as any[];
    }

    if (type === "all" || type === "bookings") {
      results.bookings = await prisma.$queryRawUnsafe(`
        SELECT id, guest_name as guestName, room_number as roomNumber, status, total_amount as totalAmount
        FROM bookings ${branchFilter} ORDER BY created_at DESC LIMIT ?
      `, limit) as any[];
    }

    if (type === "all" || type === "orders") {
      results.orders = await prisma.$queryRawUnsafe(`
        SELECT id, table_number as tableNumber, guest_name as guestName, status, total
        FROM orders ${branchFilter} ORDER BY created_at DESC LIMIT ?
      `, limit) as any[];
    }
  } catch (e) {
    console.error("Recent items error:", e);
  }

  return NextResponse.json({
    success: true,
    results,
    type: "recent",
    message: "Recent items"
  });
}

// Helper to build date filter
function buildDateFilter(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return "";

  let filter = "AND (";
  const conditions: string[] = [];

  if (dateFrom) {
    conditions.push(`created_at >= '${dateFrom}'`);
  }
  if (dateTo) {
    conditions.push(`created_at <= '${dateTo}'`);
  }

  return filter + conditions.join(" AND ") + ")";
}

// Helper functions for status/label mapping
function getRoomTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    standard: "Standard",
    deluxe: "Deluxe",
    suite: "Suite",
    executive_suite: "Executive Suite",
    presidential_suite: "Presidential Suite",
    family: "Family Room",
  };
  return labels[type] || type;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    occupied: "bg-blue-100 text-blue-700",
    reserved: "bg-purple-100 text-purple-700",
    maintenance: "bg-amber-100 text-amber-700",
    cleaning: "bg-cyan-100 text-cyan-700",
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

function getLoyaltyColor(tier: string): string {
  const colors: Record<string, string> = {
    platinum: "text-purple-600",
    gold: "text-amber-600",
    silver: "text-gray-500",
    bronze: "text-orange-600",
  };
  return colors[tier] || "text-gray-600";
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-700",
    SUPER_MANAGER: "bg-purple-100 text-purple-700",
    BRANCH_MANAGER: "bg-blue-100 text-blue-700",
    RECEPTIONIST: "bg-emerald-100 text-emerald-700",
    WAITER: "bg-amber-100 text-amber-700",
    KITCHEN: "bg-orange-100 text-orange-700",
    ACCOUNTANT: "bg-cyan-100 text-cyan-700",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
}

function getPaymentStatus(amount: number, method: string): string {
  if (!method) return "unpaid";
  return "paid";
}

function getContactTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    inquiry: "question",
    complaint: "alert",
    feedback: "message",
    reservation: "calendar",
  };
  return icons[type] || "message";
}

function getEventTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    wedding: "heart",
    conference: "users",
    party: "celebration",
    meeting: "briefcase",
  };
  return icons[type] || "calendar";
}

function getPaymentMethodIcon(method: string): string {
  const icons: Record<string, string> = {
    card: "credit-card",
    cash: "banknote",
    mobile: "smartphone",
    transfer: "wallet",
  };
  return icons[method] || "credit-card";
}

// Get available filters
async function getAvailableFilters(userRole: string, userBranchId: string, query: string) {
  const isSuper = isSuperAdmin(userRole);
  const branchFilter = isSuper ? "" : `AND branch_id = '${userBranchId}'`;

  try {
    const [statuses, types] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT status FROM rooms ${branchFilter} UNION
        SELECT status FROM bookings ${branchFilter} UNION
        SELECT status FROM orders ${branchFilter} UNION
        SELECT status FROM staff ${branchFilter}
      `) as Promise<{ status: string }[]>,
      prisma.$queryRawUnsafe(`
        SELECT type FROM menu_items ${branchFilter} UNION
        SELECT type FROM events ${branchFilter} UNION
        SELECT type FROM services ${branchFilter}
      `) as Promise<{ type: string }[]>
    ]);

    return {
      statuses: [...new Set(statuses.map(s => s.status))],
      types: [...new Set(types.map(t => t.type))],
    };
  } catch (e) {
    return { statuses: [], types: [] };
  }
}
