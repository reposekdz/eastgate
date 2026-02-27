/**
 * Manager Dashboard API - Advanced Real-time Data
 * Comprehensive dashboard for managers to view all their branch data
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

/**
 * GET /api/manager/dashboard
 * Comprehensive dashboard data for managers with real-time updates
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || session.branchId;

    // Verify access control
    if (session.role === "manager" && branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Access denied to this branch" },
        { status: 403 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: "Branch ID required" },
        { status: 400 }
      );
    }

    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        currency: true,
        timezone: true,
        rating: true,
        totalRooms: true,
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found" },
        { status: 404 }
      );
    }

    // Fetch all dashboard metrics in parallel
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      todayStats,
      weekStats,
      monthStats,
      roomStatus,
      staffMetrics,
      bookingMetrics,
      orderMetrics,
      paymentMetrics,
      topItems,
      recentActivity,
      pendingTasks,
    ] = await Promise.all([
      // Today's stats
      getPeriodStats(branchId, today, now),

      // Week stats
      getPeriodStats(branchId, weekAgo, now),

      // Month stats
      getPeriodStats(branchId, monthAgo, now),

      // Room status breakdown
      prisma.room.groupBy({
        by: ["status"],
        where: { branchId },
        _count: true,
      }),

      // Staff metrics
      getStaffMetrics(branchId),

      // Booking metrics
      getBookingMetrics(branchId),

      // Order metrics
      getOrderMetrics(branchId),

      // Payment metrics
      getPaymentMetrics(branchId),

      // Top menu items (most ordered)
      prisma.menuItem.findMany({
        where: { branchId },
        orderBy: { totalOrders: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          totalOrders: true,
          rating: true,
        },
      }),

      // Recent activity logs
      prisma.activityLog.findMany({
        where: { branchId },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          userId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),

      // Pending tasks/items needing attention
      getPendingTasks(branchId),
    ]);

    // Transform room status
    const roomStatusMap: Record<string, number> = {};
    roomStatus.forEach((r) => {
      roomStatusMap[r.status || "unknown"] = r._count;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          branch,
          overview: {
            today: todayStats,
            thisWeek: weekStats,
            thisMonth: monthStats,
          },
          rooms: {
            total: branch.totalRooms,
            status: roomStatusMap,
          },
          staff: staffMetrics,
          bookings: bookingMetrics,
          orders: orderMetrics,
          payments: paymentMetrics,
          topMenuItems: topItems,
          recentActivity: recentActivity.map((log) => ({
            ...log,
            createdAt: log.createdAt.toISOString(),
          })),
          alerts: pendingTasks,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}

/**
 * Get metrics for a time period
 */
async function getPeriodStats(
  branchId: string,
  startDate: Date,
  endDate: Date
) {
  const [revenue, paymentCount, orderCount, bookingCount] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        branchId,
        status: "completed",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),

    prisma.payment.count({
      where: {
        branchId,
        status: "completed",
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    prisma.order.count({
      where: {
        branchId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    prisma.booking.count({
      where: {
        branchId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  return {
    totalRevenue: revenue._sum.amount || 0,
    transactions: paymentCount,
    orders: orderCount,
    bookings: bookingCount,
    averageTransaction: paymentCount > 0
      ? Math.round((revenue._sum.amount || 0) / paymentCount)
      : 0,
  };
}

/**
 * Get staff metrics
 */
async function getStaffMetrics(branchId: string) {
  const [total, active, inactive, byRole, byDepartment, onlineCount] = await Promise.all([
    prisma.staff.count({ where: { branchId } }),

    prisma.staff.count({
      where: { branchId, status: "active" },
    }),

    prisma.staff.count({
      where: { branchId, status: "inactive" },
    }),

    prisma.staff.groupBy({
      by: ["role"],
      where: { branchId, status: "active" },
      _count: true,
    }),

    prisma.staff.groupBy({
      by: ["department"],
      where: { branchId, status: "active" },
      _count: true,
    }),

    prisma.staff.count({
      where: { branchId, activityStatus: "online" },
    }),
  ]);

  return {
    total,
    active,
    inactive,
    onlineCount,
    byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count])),
    byDepartment: Object.fromEntries(
      byDepartment.map((d) => [d.department, d._count])
    ),
  };
}

/**
 * Get booking metrics
 */
async function getBookingMetrics(branchId: string) {
  const [total, byStatus, revenue, occupancyRate] = await Promise.all([
    prisma.booking.count({ where: { branchId } }),

    prisma.booking.groupBy({
      by: ["status"],
      where: { branchId },
      _count: true,
    }),

    prisma.booking.aggregate({
      where: { branchId, paymentStatus: "completed" },
      _sum: { totalAmount: true },
    }),

    prisma.booking.count({
      where: { branchId, status: "checked_in" },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  byStatus.forEach((s) => {
    statusMap[s.status || "unknown"] = s._count;
  });

  return {
    total,
    status: statusMap,
    totalRevenue: revenue._sum.totalAmount || 0,
    currentOccupancy: occupancyRate,
  };
}

/**
 * Get order metrics
 */
async function getOrderMetrics(branchId: string) {
  const [total, pendingCount, byStatus, revenue, paidCount] = await Promise.all([
    prisma.order.count({ where: { branchId } }),

    prisma.order.count({
      where: { branchId, status: "pending" },
    }),

    prisma.order.groupBy({
      by: ["status"],
      where: { branchId },
      _count: true,
    }),

    prisma.order.aggregate({
      where: { branchId },
      _sum: { total: true },
    }),

    prisma.order.count({
      where: { branchId, paymentStatus: "paid" },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  byStatus.forEach((s) => {
    statusMap[s.status || "unknown"] = s._count;
  });

  return {
    total,
    pending: pendingCount,
    status: statusMap,
    totalRevenue: revenue._sum.total || 0,
    paidCount,
    unpaidCount: total - paidCount,
  };
}

/**
 * Get payment metrics
 */
async function getPaymentMetrics(branchId: string) {
  const [completed, pending, failed, byMethod] = await Promise.all([
    prisma.payment.aggregate({
      where: { branchId, status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),

    prisma.payment.aggregate({
      where: { branchId, status: "pending" },
      _sum: { amount: true },
      _count: true,
    }),

    prisma.payment.aggregate({
      where: { branchId, status: "failed" },
      _sum: { amount: true },
      _count: true,
    }),

    prisma.payment.groupBy({
      by: ["paymentMethod"],
      where: { branchId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const methodMap: Record<string, { count: number; amount: number }> = {};
  byMethod.forEach((m) => {
    methodMap[m.paymentMethod || "unknown"] = {
      count: m._count,
      amount: m._sum.amount || 0,
    };
  });

  return {
    completed: {
      count: completed._count,
      amount: completed._sum.amount || 0,
    },
    pending: {
      count: pending._count,
      amount: pending._sum.amount || 0,
    },
    failed: {
      count: failed._count,
      amount: failed._sum.amount || 0,
    },
    byMethod: methodMap,
  };
}

/**
 * Get pending tasks and alerts
 */
async function getPendingTasks(branchId: string) {
  const alerts: any[] = [];

  // Pending payment
  const pendingPayments = await prisma.payment.count({
    where: { branchId, status: "pending" },
  });

  if (pendingPayments > 0) {
    alerts.push({
      type: "warning",
      title: "Pending Payments",
      message: `${pendingPayments} payment(s) awaiting confirmation`,
      action: "view_payments",
      priority: "high",
    });
  }

  // Pending orders
  const pendingOrders = await prisma.order.count({
    where: { branchId, status: "pending" },
  });

  if (pendingOrders > 0) {
    alerts.push({
      type: "info",
      title: "Pending Orders",
      message: `${pendingOrders} order(s) waiting to be processed`,
      action: "view_orders",
      priority: "medium",
    });
  }

  // Low inventory
  const lowInventory = await prisma.inventory.count({
    where: {
      branchId,
    },
  });

  if (lowInventory > 0) {
    alerts.push({
      type: "warning",
      title: "Low Stock Levels",
      message: `${lowInventory} items need restocking`,
      action: "manage_inventory",
      priority: "medium",
    });
  }

  return alerts;
}

