import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isManager } from "@/lib/auth";

// GET - Advanced search across all data
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
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const type = searchParams.get("type") || "all"; // all, rooms, guests, bookings, staff, orders, menu
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        message: "Query must be at least 2 characters"
      });
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
    };

    const branchFilter = isSuperAdmin(userRole) ? "" : `AND branch_id = '${userBranchId}'`;

    // Search Rooms
    if (type === "all" || type === "rooms") {
      try {
        const rooms = await prisma.$queryRawUnsafe(`
          SELECT id, number as name, room_type as type, status, price, floor, description
          FROM rooms 
          WHERE (number LIKE ? OR description LIKE ?) ${branchFilter}
          ORDER BY number ASC
          LIMIT ?
        `, searchTerm, searchTerm, limit) as any[];
        results.rooms = rooms.map(r => ({ ...r, category: 'Room', url: `/admin/rooms` }));
      } catch (e) { console.error("Room search error:", e); }
    }

    // Search Guests
    if (type === "all" || type === "guests") {
      try {
        const guests = await prisma.$queryRawUnsafe(`
          SELECT id, name, email, phone, nationality, loyalty_tier
          FROM guests 
          WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?) ${branchFilter}
          ORDER BY name ASC
          LIMIT ?
        `, searchTerm, searchTerm, searchTerm, limit) as any[];
        results.guests = guests.map(g => ({ ...g, category: 'Guest', url: `/admin/guests` }));
      } catch (e) { console.error("Guest search error:", e); }
    }

    // Search Bookings
    if (type === "all" || type === "bookings") {
      try {
        const bookings = await prisma.$queryRawUnsafe(`
          SELECT id, guest_name as guestName, guest_email as guestEmail, room_number as roomNumber, 
                 status, check_in as checkIn, check_out as checkOut, total_amount as totalAmount
          FROM bookings 
          WHERE (guest_name LIKE ? OR guest_email LIKE ? OR room_number LIKE ?) ${branchFilter}
          ORDER BY created_at DESC
          LIMIT ?
        `, searchTerm, searchTerm, searchTerm, limit) as any[];
        results.bookings = bookings.map(b => ({ ...b, category: 'Booking', url: `/admin/bookings` }));
      } catch (e) { console.error("Booking search error:", e); }
    }

    // Search Staff
    if (type === "all" || type === "staff") {
      try {
        const staff = await prisma.$queryRawUnsafe(`
          SELECT id, name, email, phone, role, department, status
          FROM staff 
          WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ? OR department LIKE ?) ${branchFilter}
          ORDER BY name ASC
          LIMIT ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, limit) as any[];
        results.staff = staff.map(s => ({ ...s, category: 'Staff', url: `/admin/staff` }));
      } catch (e) { console.error("Staff search error:", e); }
    }

    // Search Orders
    if (type === "all" || type === "orders") {
      try {
        const orders = await prisma.$queryRawUnsafe(`
          SELECT id, table_number as tableNumber, guest_name as guestName, status, total, created_at as createdAt
          FROM orders 
          WHERE (guest_name LIKE ? OR CAST(table_number AS TEXT) LIKE ?) ${branchFilter}
          ORDER BY created_at DESC
          LIMIT ?
        `, searchTerm, searchTerm, limit) as any[];
        results.orders = orders.map(o => ({ ...o, category: 'Order', url: `/admin/restaurant` }));
      } catch (e) { console.error("Order search error:", e); }
    }

    // Search Menu Items
    if (type === "all" || type === "menu") {
      try {
        const menuItems = await prisma.$queryRawUnsafe(`
          SELECT id, name, category, price, description, available
          FROM menu_items 
          WHERE (name LIKE ? OR category LIKE ? OR description LIKE ?) ${branchFilter}
          ORDER BY name ASC
          LIMIT ?
        `, searchTerm, searchTerm, searchTerm, limit) as any[];
        results.menuItems = menuItems.map(m => ({ ...m, category: 'Menu Item', url: `/admin/restaurant` }));
      } catch (e) { console.error("Menu search error:", e); }
    }

    // Search Contacts
    if (type === "all" || type === "contacts") {
      try {
        const contacts = await prisma.$queryRawUnsafe(`
          SELECT id, name, email, phone, subject, status, created_at as createdAt
          FROM contacts 
          WHERE (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?) ${branchFilter}
          ORDER BY created_at DESC
          LIMIT ?
        `, searchTerm, searchTerm, searchTerm, searchTerm, limit) as any[];
        results.contacts = contacts.map(c => ({ ...c, category: 'Contact', url: `/admin/contacts` }));
      } catch (e) { console.error("Contact search error:", e); }
    }

    // Search Events
    if (type === "all" || type === "events") {
      try {
        const events = await prisma.$queryRawUnsafe(`
          SELECT id, name, type, date, hall, organizer, status
          FROM events 
          WHERE (name LIKE ? OR organizer LIKE ? OR hall LIKE ?) ${branchFilter}
          ORDER BY date DESC
          LIMIT ?
        `, searchTerm, searchTerm, searchTerm, limit) as any[];
        results.events = events.map(e => ({ ...e, category: 'Event', url: `/admin/events` }));
      } catch (e) { console.error("Event search error:", e); }
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
      results.events.length;

    return NextResponse.json({
      success: true,
      query,
      total: totalResults,
      results,
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
