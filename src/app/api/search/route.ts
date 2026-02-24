import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// GET - Global search across all entities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query");
    const type = searchParams.get("type"); // all, rooms, bookings, orders, guests, menu, staff
    const branchId = searchParams.get("branchId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const searchTerm = `%${query}%`;
    const branchFilter = branchId ? { branchId } : {};

    const results: any = {
      rooms: [],
      bookings: [],
      orders: [],
      guests: [],
      menuItems: [],
      staff: [],
      services: [],
      events: [],
    };

    // Search Rooms
    if (!type || type === "all" || type === "rooms") {
      const rooms = await prisma.room.findMany({
        where: {
          ...branchFilter,
          OR: [
            { number: { contains: query } },
            { type: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { number: "asc" },
      });
      results.rooms = rooms.map(r => ({
        id: r.id,
        title: `Room ${r.number}`,
        subtitle: r.type,
        description: r.description,
        price: r.price,
        status: r.status,
        imageUrl: r.imageUrl,
        type: "room",
      }));
    }

    // Search Bookings
    if (!type || type === "all" || type === "bookings") {
      const bookings = await prisma.booking.findMany({
        where: {
          ...branchFilter,
          OR: [
            { guestName: { contains: query } },
            { guestEmail: { contains: query } },
            { guestPhone: { contains: query } },
            { roomNumber: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          room: { select: { number: true, type: true } },
        },
      });
      results.bookings = bookings.map(b => ({
        id: b.id,
        title: b.guestName,
        subtitle: `Room ${b.roomNumber} - ${b.roomType}`,
        description: `Check-in: ${new Date(b.checkIn).toLocaleDateString()}`,
        status: b.status,
        amount: b.totalAmount,
        email: b.guestEmail,
        phone: b.guestPhone,
        type: "booking",
      }));
    }

    // Search Orders
    if (!type || type === "all" || type === "orders") {
      const orders = await prisma.order.findMany({
        where: {
          ...branchFilter,
          OR: [
            { guestName: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      results.orders = orders.map(o => ({
        id: o.id,
        title: `Order #${o.id.slice(-6)}`,
        subtitle: o.guestName ? `Guest: ${o.guestName}` : `Table ${o.tableNumber}`,
        description: `Total: RWF ${o.total.toLocaleString()}`,
        status: o.status,
        amount: o.total,
        type: "order",
      }));
    }

    // Search Guests
    if (!type || type === "all" || type === "guests") {
      const guests = await prisma.guest.findMany({
        where: {
          ...branchFilter,
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { nationality: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      results.guests = guests.map(g => ({
        id: g.id,
        title: g.name,
        subtitle: g.email,
        description: g.phone || "",
        email: g.email,
        phone: g.phone,
        loyaltyPoints: g.loyaltyPoints,
        totalSpent: g.totalSpent,
        type: "guest",
      }));
    }

    // Search Menu Items
    if (!type || type === "all" || type === "menu") {
      const menuItems = await prisma.menuItem.findMany({
        where: {
          ...branchFilter,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { name: "asc" },
      });
      results.menuItems = menuItems.map(m => ({
        id: m.id,
        title: m.name,
        subtitle: m.category,
        description: m.description,
        price: m.price,
        available: m.available,
        imageUrl: m.imageUrl,
        type: "menu",
      }));
    }

    // Search Staff
    if (!type || type === "all" || type === "staff") {
      const staff = await prisma.staff.findMany({
        where: {
          ...branchFilter,
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { department: { contains: query } },
            { role: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { name: "asc" },
      });
      results.staff = staff.map(s => ({
        id: s.id,
        title: s.name,
        subtitle: s.role,
        description: s.department,
        email: s.email,
        phone: s.phone,
        status: s.status,
        type: "staff",
      }));
    }

    // Search Services
    if (!type || type === "all" || type === "services") {
      const services = await prisma.service.findMany({
        where: {
          ...branchFilter,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { type: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { name: "asc" },
      });
      results.services = services.map(s => ({
        id: s.id,
        title: s.name,
        subtitle: s.type,
        description: s.description,
        price: s.price,
        duration: s.duration,
        available: s.available,
        imageUrl: s.imageUrl,
        type: "service",
      }));
    }

    // Search Events
    if (!type || type === "all" || type === "events") {
      const events = await prisma.event.findMany({
        where: {
          ...branchFilter,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { organizer: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { date: "asc" },
      });
      results.events = events.map(e => ({
        id: e.id,
        title: e.name,
        subtitle: e.type,
        description: e.description,
        date: e.date,
        hall: e.hall,
        capacity: e.capacity,
        attendees: e.attendees,
        status: e.status,
        type: "event",
      }));
    }

    // Calculate total results
    const totalResults = 
      results.rooms.length +
      results.bookings.length +
      results.orders.length +
      results.guests.length +
      results.menuItems.length +
      results.staff.length +
      results.services.length +
      results.events.length;

    return NextResponse.json({
      success: true,
      query,
      total: totalResults,
      results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

// POST - Advanced search with filters
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    
    const { query, filters, branchId, limit = 20 } = body;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Same as GET but with additional filters
    const url = new URL(req.url);
    url.searchParams.set("q", query);
    if (branchId) url.searchParams.set("branchId", branchId);
    url.searchParams.set("limit", limit.toString());
    if (filters?.type) url.searchParams.set("type", filters.type);

    // Reuse GET logic
    return GET(new NextRequest(url.toString()));
  } catch (error) {
    console.error("Advanced search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
