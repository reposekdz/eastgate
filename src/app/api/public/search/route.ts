import { NextRequest, NextResponse } from "next/server";

// Fallback data when database is unavailable
const fallbackData = {
  rooms: [
    { id: "1", number: "101", type: "standard", price: 89, description: "Comfortable standard room" },
    { id: "2", number: "201", type: "deluxe", price: 129, description: "Spacious deluxe room" },
    { id: "3", number: "301", type: "family", price: 199, description: "Family suite" },
  ],
  menuItems: [
    { id: "1", name: "Breakfast", category: "Breakfast", price: 15 },
    { id: "2", name: "Lunch Special", category: "Lunch", price: 25 },
    { id: "3", name: "Dinner Buffet", category: "Dinner", price: 35 },
  ],
  services: [
    { id: "1", name: "Spa Treatment", type: "spa", price: 80, duration: 60 },
    { id: "2", name: "Swimming Pool", type: "pool", price: 20, duration: 120 },
    { id: "3", name: "Gym Access", type: "gym", price: 30, duration: 180 },
  ],
  events: [
    { id: "1", name: "Conference Hall", type: "meeting", date: new Date().toISOString() },
  ],
  branches: [
    { id: "1", name: "Kigali Main", location: "Kigali, Rwanda" },
    { id: "2", name: "Ngoma", location: "Ngoma, Rwanda" },
  ],
  bookings: [],
  orders: [],
  staff: [],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const limit = parseInt(searchParams.get("limit") || "15");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Return empty results if no query
  if (!query || query.length < 1) {
    return NextResponse.json({
      success: true,
      query,
      ...fallbackData,
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
      pagination: { limit, offset, hasMore: false },
      timestamp: new Date().toISOString(),
    });
  }

  const queryLower = query.toLowerCase();

  // Try to fetch from database, fall back to static data on error
  try {
    // Dynamic import prisma to prevent initialization errors
    const { default: prisma } = await import("@/lib/prisma");
    
    const results: any = {
      rooms: [],
      menuItems: [],
      orders: [],
      bookings: [],
      events: [],
      services: [],
      branches: [],
      staff: [],
    };

    const safeLimit = Math.min(limit, 50);

    // Search rooms
    if (category === "all" || category === "rooms") {
      try {
        results.rooms = await prisma.room.findMany({
          where: {
            OR: [
              { number: { contains: query } },
              { type: { contains: query } },
            ],
          },
          take: safeLimit,
        });
      } catch (e) { /* ignore */ }
    }

    // Search menu
    if (category === "all" || category === "menu") {
      try {
        results.menuItems = await prisma.menuItem.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { category: { contains: query } },
            ],
          },
          take: safeLimit,
        });
      } catch (e) { /* ignore */ }
    }

    // Search services (spa, pool, gym)
    if (category === "all" || category === "services") {
      try {
        results.services = await prisma.service.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { type: { contains: query } },
            ],
          },
          take: safeLimit,
        });
      } catch (e) { /* ignore */ }
    }

    // Search events
    if (category === "all" || category === "events") {
      try {
        results.events = await prisma.event.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { type: { contains: query } },
            ],
          },
          take: safeLimit,
        });
      } catch (e) { /* ignore */ }
    }

    // Search branches
    if (category === "all" || category === "branches") {
      try {
        results.branches = await prisma.branch.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { location: { contains: query } },
            ],
          },
          take: safeLimit,
        });
      } catch (e) { /* ignore */ }
    }

    const totalResults = 
      results.rooms.length +
      results.menuItems.length +
      results.services.length +
      results.events.length +
      results.branches.length;

    return NextResponse.json({
      success: true,
      query,
      ...results,
      totalResults,
      resultsPerCategory: {
        rooms: results.rooms.length,
        menuItems: results.menuItems.length,
        orders: 0,
        bookings: 0,
        events: results.events.length,
        services: results.services.length,
        branches: results.branches.length,
        staff: 0,
      },
      pagination: {
        limit: safeLimit,
        offset,
        hasMore: totalResults >= safeLimit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Search error, using fallback:", error);

    // Use fallback data with search filtering
    const filtered: any = { ...fallbackData };
    
    if (category === "all" || category === "rooms") {
      filtered.rooms = fallbackData.rooms.filter(r => 
        r.type?.toLowerCase().includes(queryLower) || 
        r.number?.toLowerCase().includes(queryLower)
      );
    }
    
    if (category === "all" || category === "menu") {
      filtered.menuItems = fallbackData.menuItems.filter(m => 
        m.name?.toLowerCase().includes(queryLower) || 
        m.category?.toLowerCase().includes(queryLower)
      );
    }
    
    if (category === "all" || category === "services") {
      filtered.services = fallbackData.services.filter(s => 
        s.name?.toLowerCase().includes(queryLower) || 
        s.type?.toLowerCase().includes(queryLower)
      );
    }
    
    if (category === "all" || category === "events") {
      filtered.events = fallbackData.events.filter(e => 
        e.name?.toLowerCase().includes(queryLower)
      );
    }
    
    if (category === "all" || category === "branches") {
      filtered.branches = fallbackData.branches.filter(b => 
        b.name?.toLowerCase().includes(queryLower) || 
        b.location?.toLowerCase().includes(queryLower)
      );
    }

    const totalResults = 
      filtered.rooms.length +
      filtered.menuItems.length +
      filtered.services.length +
      filtered.events.length +
      filtered.branches.length;

    return NextResponse.json({
      success: true,
      query,
      ...filtered,
      totalResults,
      resultsPerCategory: {
        rooms: filtered.rooms.length,
        menuItems: filtered.menuItems.length,
        orders: 0,
        bookings: 0,
        events: filtered.events.length,
        services: filtered.services.length,
        branches: filtered.branches.length,
        staff: 0,
      },
      pagination: { limit, offset, hasMore: false },
      timestamp: new Date().toISOString(),
    });
  }
}
