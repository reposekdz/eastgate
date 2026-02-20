import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const limit = parseInt(searchParams.get("limit") || "15");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!query || query.length < 1) {
    return NextResponse.json({
      success: true,
      query,
      rooms: [],
      menuItems: [],
      orders: [],
      bookings: [],
      events: [],
      services: [],
      branches: [],
      staff: [],
      totalResults: 0,
      resultsPerCategory: {
        rooms: 0,
        menuItems: 0,
        orders: 0,
        bookings: 0,
        events: 0,
        services: 0,
        branches: 0,
        staff: 0,
      },
      pagination: {
        limit,
        offset,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    let rooms: any[] = [];
    let menuItems: any[] = [];
    let orders: any[] = [];
    let bookings: any[] = [];
    let events: any[] = [];
    let services: any[] = [];
    let branches: any[] = [];
    let staff: any[] = [];

    const searchPattern = `%${query}%`;
    const safeLimit = Math.min(limit, 50);
    const safeOffset = Math.max(offset, 0);

    if (category === "all" || category === "rooms") {
      rooms = await prisma.$queryRaw`
        SELECT id, number, floor, type, status, price, description, image_url, branch_id 
        FROM rooms 
        WHERE number LIKE ${searchPattern} 
           OR type LIKE ${searchPattern}
           OR description LIKE ${searchPattern}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "menu") {
      menuItems = await prisma.$queryRaw`
        SELECT id, name, category, price, description, image_url, available, popular, vegetarian, spicy
        FROM menu_items 
        WHERE name LIKE ${searchPattern} 
           OR category LIKE ${searchPattern}
           OR description LIKE ${searchPattern}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "orders") {
      orders = await prisma.$queryRaw`
        SELECT id, table_number, guest_name, items, status, total, room_charge, performed_by, created_at
        FROM orders 
        WHERE id LIKE ${searchPattern.toUpperCase()} 
           OR guest_name LIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "bookings") {
      bookings = await prisma.$queryRaw`
        SELECT id, guest_name, guest_email, room_number, room_type, check_in, check_out, status, total_amount
        FROM bookings 
        WHERE id LIKE ${searchPattern.toUpperCase()} 
           OR guest_name LIKE ${searchPattern}
           OR guest_email LIKE ${searchPattern}
           OR room_number LIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "events") {
      events = await prisma.$queryRaw`
        SELECT id, name, type, date, start_time, end_time, hall, capacity, status, total_amount, organizer
        FROM events 
        WHERE name LIKE ${searchPattern} 
           OR type LIKE ${searchPattern}
           OR organizer LIKE ${searchPattern}
           OR hall LIKE ${searchPattern}
        ORDER BY date ASC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "services") {
      services = await prisma.$queryRaw`
        SELECT id, name, type, price, duration, description, image_url, available
        FROM services 
        WHERE name LIKE ${searchPattern} 
           OR type LIKE ${searchPattern}
           OR description LIKE ${searchPattern}
        ORDER BY name ASC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "branches") {
      branches = await prisma.$queryRaw`
        SELECT id, name, location, address, phone, email
        FROM branches 
        WHERE name LIKE ${searchPattern} 
           OR location LIKE ${searchPattern}
           OR address LIKE ${searchPattern}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    if (category === "all" || category === "staff") {
      staff = await prisma.$queryRaw`
        SELECT id, name, email, role, department, status, avatar
        FROM staff 
        WHERE name LIKE ${searchPattern} 
           OR email LIKE ${searchPattern}
           OR role LIKE ${searchPattern}
           OR department LIKE ${searchPattern}
        LIMIT ${safeLimit} OFFSET ${safeOffset}
      ` as any;
    }

    const totalRooms = (rooms as any[]).length;
    const totalMenuItems = (menuItems as any[]).length;
    const totalOrders = (orders as any[]).length;
    const totalBookings = (bookings as any[]).length;
    const totalEvents = (events as any[]).length;
    const totalServices = (services as any[]).length;
    const totalBranches = (branches as any[]).length;
    const totalStaff = (staff as any[]).length;

    const totalResults = totalRooms + totalMenuItems + totalOrders + totalBookings + totalEvents + totalServices + totalBranches + totalStaff;

    return NextResponse.json({
      success: true,
      query,
      rooms,
      menuItems,
      orders,
      bookings,
      events,
      services,
      branches,
      staff,
      totalResults,
      resultsPerCategory: {
        rooms: totalRooms,
        menuItems: totalMenuItems,
        orders: totalOrders,
        bookings: totalBookings,
        events: totalEvents,
        services: totalServices,
        branches: totalBranches,
        staff: totalStaff,
      },
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        hasMore: totalResults >= safeLimit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Search error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Search failed",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
      query,
      rooms: [],
      menuItems: [],
      orders: [],
      bookings: [],
      events: [],
      services: [],
      branches: [],
      staff: [],
      totalResults: 0,
      resultsPerCategory: {
        rooms: 0,
        menuItems: 0,
        orders: 0,
        bookings: 0,
        events: 0,
        services: 0,
        branches: 0,
        staff: 0,
      },
      pagination: {
        limit,
        offset,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
