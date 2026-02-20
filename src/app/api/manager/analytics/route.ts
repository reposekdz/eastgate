import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get comprehensive analytics for manager dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";
    const period = parseInt(searchParams.get("period") || "30");
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get room stats
    const rooms = await prisma.room.findMany({
      where: { branchId },
    });
    
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
    const availableRooms = rooms.filter(r => r.status === "available").length;
    
    // Get revenue stats
    const revenue = await prisma.payment.aggregate({
      where: {
        branchId,
        status: "completed",
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get booking stats
    const bookings = await prisma.booking.findMany({
      where: {
        branchId,
        createdAt: { gte: startDate },
      },
    });
    
    const totalBookingsRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Get order stats
    const orders = await prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: startDate },
      },
    });
    
    const totalOrdersRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Get guest count
    const guestCount = await prisma.guest.count({
      where: { branchId },
    });

    // Get staff count
    const staffCount = await prisma.staff.count({
      where: { branchId, status: "active" },
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      analytics: {
        occupancy: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms,
          occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        },
        revenue: {
          total: revenue._sum.amount || 0,
          transactions: revenue._count || 0,
        },
        bookings: {
          total: bookings.length,
          revenue: totalBookingsRevenue,
        },
        orders: {
          total: orders.length,
          revenue: totalOrdersRevenue,
        },
        guests: {
          total: guestCount,
        },
        staff: {
          active: staffCount,
        },
      },
      recentActivity: {
        bookings: recentBookings,
        orders: recentOrders,
      },
      period: period,
      branchId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch analytics",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
