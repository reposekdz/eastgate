import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where: any = {};
    if (branchId) where.branchId = branchId;

    const [
      totalRevenue,
      totalBookings,
      totalGuests,
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalOrders,
      restaurantRevenue,
      recentBookings,
      topGuests,
      popularRooms,
      revenueByBranch,
    ] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          ...where,
          status: { in: ["confirmed", "checked_in", "checked_out"] },
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.count({
        where: {
          ...where,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
      }),
      prisma.guest.count({ where }),
      prisma.room.count({ where }),
      prisma.room.count({ where: { ...where, status: "available" } }),
      prisma.room.count({ where: { ...where, status: "occupied" } }),
      prisma.order.count({
        where: {
          ...where,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
      }),
      prisma.order.aggregate({
        where: {
          ...where,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        _sum: { total: true },
      }),
      prisma.booking.findMany({
        where: {
          ...where,
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          room: { select: { number: true, type: true } },
          branch: { select: { name: true } },
        },
      }),
      prisma.guest.findMany({
        where,
        take: 10,
        orderBy: { totalSpent: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          totalSpent: true,
          totalStays: true,
          loyaltyTier: true,
          avatar: true,
        },
      }),
      prisma.room.findMany({
        where,
        take: 10,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          number: true,
          type: true,
          price: true,
          rating: true,
        },
      }),
      prisma.branch.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { bookings: true, rooms: true } },
        },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    return NextResponse.json({
      success: true,
      dashboard: {
        overview: {
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalBookings,
          totalGuests,
          totalRooms,
          availableRooms,
          occupiedRooms,
          occupancyRate: occupancyRate.toFixed(2),
          totalOrders,
          restaurantRevenue: restaurantRevenue._sum.total || 0,
        },
        recentBookings,
        topGuests,
        popularRooms,
        revenueByBranch,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
