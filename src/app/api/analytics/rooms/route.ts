import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (branchId) where.branchId = branchId;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalBookings,
      totalRevenue,
      avgRoomPrice,
      roomsByType,
      recentBookings,
    ] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.count({ where: { ...where, status: "available" } }),
      prisma.room.count({ where: { ...where, status: "occupied" } }),
      prisma.room.count({ where: { ...where, status: "maintenance" } }),
      prisma.booking.count({
        where: {
          ...(branchId && { branchId }),
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
      }),
      prisma.booking.aggregate({
        where: {
          ...(branchId && { branchId }),
          status: { in: ["confirmed", "checked_in", "checked_out"] },
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        _sum: { totalAmount: true },
      }),
      prisma.room.aggregate({
        where,
        _avg: { price: true },
      }),
      prisma.room.groupBy({
        by: ["type"],
        where,
        _count: true,
        _avg: { price: true },
      }),
      prisma.booking.findMany({
        where: {
          ...(branchId && { branchId }),
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          room: true,
          branch: { select: { name: true } },
        },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const availabilityRate = totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRooms,
          availableRooms,
          occupiedRooms,
          maintenanceRooms,
          occupancyRate: occupancyRate.toFixed(2),
          availabilityRate: availabilityRate.toFixed(2),
        },
        bookings: {
          total: totalBookings,
          revenue: totalRevenue._sum.totalAmount || 0,
          avgRoomPrice: avgRoomPrice._avg.price || 0,
        },
        roomsByType,
        recentBookings,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
