/**
 * Waiter Dashboard API
 * Real-time order management and table status
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const waiterId = searchParams.get("waiterId");

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: "Branch ID is required" },
        { status: 400 }
      );
    }

    const where: any = { branchId };

    // Fetch orders for the branch
    const [orders, tables, services, todayBookings] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.restaurantTable.findMany({
        where,
        orderBy: { number: "asc" },
      }),
      prisma.order.findMany({
        where: {
          ...where,
          roomCharge: true,
          status: { in: ["pending", "preparing"] },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: {
          branchId,
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: "checked_in",
        },
        select: {
          id: true,
          guestName: true,
          roomNumber: true,
        },
      }),
    ]);

    // Calculate metrics
    const metrics = {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      served: orders.filter((o) => o.status === "served").length,
      myRevenue: orders
        .filter((o) => o.performedBy === waiterId)
        .reduce((sum, o) => sum + o.total, 0),
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    };

    // Get waiter-specific orders if waiterId provided
    const myOrders = waiterId
      ? orders.filter((o) => o.performedBy === waiterId)
      : [];

    return NextResponse.json({
      success: true,
      orders,
      myOrders,
      tables,
      services,
      todayBookings,
      metrics,
    });
  } catch (error: any) {
    console.error("Waiter dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data", message: error.message },
      { status: 500 }
    );
  }
}
