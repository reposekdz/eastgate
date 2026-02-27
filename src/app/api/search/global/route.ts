import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    const branchId = searchParams.get("branchId") || decoded.branchId;
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    const [guests, bookings, rooms, staff, orders, menuItems] = await Promise.all([
      // Search guests
      prisma.guest.findMany({
        where: {
          branchId,
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { idNumber: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          loyaltyTier: true,
          totalStays: true,
        },
        take: limit,
      }),

      // Search bookings
      prisma.booking.findMany({
        where: {
          branchId,
          OR: [
            { bookingRef: { contains: query } },
            { guestName: { contains: query } },
            { guestEmail: { contains: query } },
            { roomNumber: { contains: query } },
          ],
        },
        select: {
          id: true,
          bookingRef: true,
          guestName: true,
          roomNumber: true,
          status: true,
          checkIn: true,
          checkOut: true,
          totalAmount: true,
        },
        take: limit,
      }),

      // Search rooms
      prisma.room.findMany({
        where: {
          branchId,
          OR: [
            { number: { contains: query } },
            { type: { contains: query } },
          ],
        },
        select: {
          id: true,
          number: true,
          type: true,
          status: true,
          floor: true,
          price: true,
        },
        take: limit,
      }),

      // Search staff
      prisma.staff.findMany({
        where: {
          branchId,
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { role: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          status: true,
        },
        take: limit,
      }),

      // Search orders
      prisma.order.findMany({
        where: {
          branchId,
          OR: [
            { orderNumber: { contains: query } },
            { guestName: { contains: query } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          guestName: true,
          status: true,
          total: true,
          createdAt: true,
        },
        take: limit,
      }),

      // Search menu items
      prisma.menuItem.findMany({
        where: {
          branchId,
          OR: [
            { name: { contains: query } },
            { category: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          available: true,
        },
        take: limit,
      }),
    ]);

    const results = {
      guests: guests.map((g) => ({ ...g, type: "guest" })),
      bookings: bookings.map((b) => ({ ...b, type: "booking" })),
      rooms: rooms.map((r) => ({ ...r, type: "room" })),
      staff: staff.map((s) => ({ ...s, type: "staff" })),
      orders: orders.map((o) => ({ ...o, type: "order" })),
      menuItems: menuItems.map((m) => ({ ...m, type: "menu" })),
    };

    const totalResults =
      guests.length +
      bookings.length +
      rooms.length +
      staff.length +
      orders.length +
      menuItems.length;

    return NextResponse.json({
      success: true,
      query,
      totalResults,
      results,
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
