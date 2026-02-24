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
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" as const : "desc" as const;

    if (!query || query.length < 1) {
      // If no query, return recent items
      return getRecentItems(userRole, userBranchId, type, limit);
    }

    const searchPattern = { contains: query };
    const results: any = {
      rooms: [],
      guests: [],
      bookings: [],
      orders: [],
      menuItems: [],
      events: [],
      services: [],
      staff: [],
      branches: [],
      payments: [],
      inventory: [],
      expenses: [],
    };

    const counts: any = {};
    const isSuperAdminUser = isSuperAdmin(userRole);

    // Filter by branch for non-super-admin users
    const branchFilter = isSuperAdminUser ? {} : { branchId: userBranchId };

    try {
      // Search rooms
      if (type === "all" || type === "rooms") {
        results.rooms = await prisma.room.findMany({
          where: {
            ...branchFilter,
            OR: [
              { number: searchPattern },
              { type: searchPattern },
              { description: searchPattern },
              { status: status ? { contains: status } : undefined },
            ].filter(Boolean) as any,
          },
          take: limit,
          skip: offset,
          orderBy: sortBy === "date" ? { createdAt: sortOrder } : { number: "asc" },
        }).catch(() => []);
        counts.rooms = results.rooms.length;
      }

      // Search guests
      if (type === "all" || type === "guests") {
        results.guests = await prisma.guest.findMany({
          where: {
            ...branchFilter,
            OR: [
              { name: searchPattern },
              { email: searchPattern },
              { phone: searchPattern },
              { nationality: searchPattern },
            ].filter(Boolean) as any,
          },
          take: limit,
          skip: offset,
          orderBy: sortBy === "date" ? { createdAt: sortOrder } : { name: "asc" },
        }).catch(() => []);
        counts.guests = results.guests.length;
      }

      // Search bookings
      if (type === "all" || type === "bookings") {
        results.bookings = await prisma.booking.findMany({
          where: {
            ...branchFilter,
            OR: [
              { id: searchPattern },
              { guestName: searchPattern },
              { guestEmail: searchPattern },
              { roomNumber: searchPattern },
            ].filter(Boolean) as any,
            status: status ? status : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: sortBy === "date" ? { createdAt: sortOrder } : { checkIn: "desc" },
        }).catch(() => []);
        counts.bookings = results.bookings.length;
      }

      // Search orders
      if (type === "all" || type === "orders") {
        results.orders = await prisma.order.findMany({
          where: {
            ...branchFilter,
            OR: [
              { id: searchPattern },
              { guestName: searchPattern },
            ].filter(Boolean) as any,
            status: status ? status : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: sortOrder },
        }).catch(() => []);
        counts.orders = results.orders.length;
      }

      // Search menu items
      if (type === "all" || type === "menu" || type === "menuItems") {
        results.menuItems = await prisma.menuItem.findMany({
          where: {
            ...branchFilter,
            OR: [
              { name: searchPattern },
              { category: searchPattern },
              { description: searchPattern },
            ].filter(Boolean) as any,
            available: status === "unavailable" ? false : status === "available" ? true : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: { name: "asc" },
        }).catch(() => []);
        counts.menuItems = results.menuItems.length;
      }

      // Search events
      if (type === "all" || type === "events") {
        const dateFilter: any = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom);
        if (dateTo) dateFilter.lte = new Date(dateTo);

        results.events = await prisma.event.findMany({
          where: {
            ...branchFilter,
            OR: [
              { name: searchPattern },
              { type: searchPattern },
              { organizer: searchPattern },
              { hall: searchPattern },
            ].filter(Boolean) as any,
            status: status ? status : undefined,
            ...(dateFrom || dateTo ? { date: dateFilter } : {}),
          },
          take: limit,
          skip: offset,
          orderBy: { date: "desc" },
        }).catch(() => []);
        counts.events = results.events.length;
      }

      // Search services
      if (type === "all" || type === "services") {
        results.services = await prisma.service.findMany({
          where: {
            ...branchFilter,
            OR: [
              { name: searchPattern },
              { type: searchPattern },
              { description: searchPattern },
            ].filter(Boolean) as any,
            available: status === "unavailable" ? false : status === "available" ? true : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: { name: "asc" },
        }).catch(() => []);
        counts.services = results.services.length;
      }

      // Search staff (super admin and managers only)
      if ((type === "all" || type === "staff") && isSuperAdminUser) {
        results.staff = await prisma.staff.findMany({
          where: {
            ...branchFilter,
            OR: [
              { name: searchPattern },
              { email: searchPattern },
              { role: searchPattern },
              { department: searchPattern },
            ].filter(Boolean) as any,
            status: status ? status : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: { name: "asc" },
        }).catch(() => []);
        counts.staff = results.staff.length;
      }

      // Search branches (super admin only)
      if ((type === "all" || type === "branches") && isSuperAdminUser) {
        results.branches = await prisma.branch.findMany({
          where: {
            OR: [
              { name: searchPattern },
              { location: searchPattern },
              { address: searchPattern },
            ].filter(Boolean) as any,
          },
          take: limit,
          skip: offset,
          orderBy: { name: "asc" },
        }).catch(() => []);
        counts.branches = results.branches.length;
      }

      // Search payments
      if (type === "all" || type === "payments") {
        results.payments = await prisma.payment.findMany({
          where: {
            ...branchFilter,
            OR: [
              { id: searchPattern },
              { transactionId: searchPattern },
            ].filter(Boolean) as any,
            status: status ? status : undefined,
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: sortOrder },
        }).catch(() => []);
        counts.payments = results.payments.length;
      }

      // Search inventory
      if ((type === "all" || type === "inventory") && isSuperAdminUser) {
        results.inventory = await prisma.inventory.findMany({
          where: {
            ...branchFilter,
            OR: [
              { name: searchPattern },
              { category: searchPattern },
              { supplier: searchPattern },
            ].filter(Boolean) as any,
          },
          take: limit,
          skip: offset,
          orderBy: { name: "asc" },
        }).catch(() => []);
        counts.inventory = results.inventory.length;
      }

      // Search expenses
      if ((type === "all" || type === "expenses") && isSuperAdminUser) {
        results.expenses = await prisma.expense.findMany({
          where: {
            ...branchFilter,
            OR: [
              { category: searchPattern },
              { description: searchPattern },
            ].filter(Boolean) as any,
          },
          take: limit,
          skip: offset,
          orderBy: { date: "desc" },
        }).catch(() => []);
        counts.expenses = results.expenses.length;
      }

    } catch (dbError: any) {
      console.error("Database search error:", dbError);
      return NextResponse.json({
        success: false,
        error: "Database error",
        message: process.env.NODE_ENV === "development" ? dbError.message : "Search failed",
        results,
        counts,
        pagination: { page, limit, offset, hasMore: false },
      }, { status: 500 });
    }

    const totalCount = Object.values(counts).reduce((a: any, b: any) => a + b, 0) as number;

    return NextResponse.json({
      success: true,
      results,
      counts,
      totalCount,
      pagination: {
        page,
        limit,
        offset,
        hasMore: totalCount >= limit,
      },
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({
      success: false,
      error: "Search failed",
      message: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    }, { status: 500 });
  }
}

// Helper function to get recent items
async function getRecentItems(userRole: string, userBranchId: string, type: string, limit: number) {
  const isSuperAdminUser = isSuperAdmin(userRole);
  const branchFilter = isSuperAdminUser ? {} : { branchId: userBranchId };

  const results: any = {};

  try {
    if (type === "all" || type === "rooms") {
      results.rooms = await prisma.room.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "guests") {
      results.guests = await prisma.guest.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "bookings") {
      results.bookings = await prisma.booking.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "orders") {
      results.orders = await prisma.order.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "menu" || type === "menuItems") {
      results.menuItems = await prisma.menuItem.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { name: "asc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "events") {
      results.events = await prisma.event.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { date: "desc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "services") {
      results.services = await prisma.service.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { name: "asc" },
      }).catch(() => []);
    }

    if ((type === "all" || type === "staff") && isSuperAdminUser) {
      results.staff = await prisma.staff.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    if ((type === "all" || type === "branches") && isSuperAdminUser) {
      results.branches = await prisma.branch.findMany({
        take: limit,
        orderBy: { name: "asc" },
      }).catch(() => []);
    }

    if (type === "all" || type === "payments") {
      results.payments = await prisma.payment.findMany({
        where: branchFilter,
        take: limit,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }
  } catch (error: any) {
    console.error("Error fetching recent items:", error);
  }

  return NextResponse.json({
    success: true,
    results,
    counts: {
      rooms: results.rooms?.length || 0,
      guests: results.guests?.length || 0,
      bookings: results.bookings?.length || 0,
      orders: results.orders?.length || 0,
      menuItems: results.menuItems?.length || 0,
      events: results.events?.length || 0,
      services: results.services?.length || 0,
      staff: results.staff?.length || 0,
      branches: results.branches?.length || 0,
      payments: results.payments?.length || 0,
    },
    pagination: {
      page: 1,
      limit,
      offset: 0,
      hasMore: false,
    },
  });
}
