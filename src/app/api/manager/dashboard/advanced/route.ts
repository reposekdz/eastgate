import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/dashboard/advanced - Advanced dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "today"; // today, week, month, year

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Determine branch
    let targetBranchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      targetBranchId = branchId || userBranchId;
    }

    // Date range calculation
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const branchFilter = targetBranchId ? { branchId: targetBranchId } : {};

    // Get branch info
    const branch = await prisma.branch.findFirst({
      where: { id: targetBranchId },
    });

    // ============ REVENUE METRICS ============
    const [
      todayBookings,
      todayOrders,
      todayRevenue,
      todayExpenses,
      activeRooms,
      pendingOrders,
      lowStockCount,
    ] = await Promise.all([
      // Today's bookings revenue
      prisma.booking.aggregate({
        where: {
          ...branchFilter,
          status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { finalAmount: true },
        _count: true,
      }),

      // Today's restaurant orders
      prisma.order.aggregate({
        where: {
          ...branchFilter,
          status: { in: ["COMPLETED", "SERVED"] },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Today's total revenue
      prisma.payment.aggregate({
        where: {
          ...branchFilter,
          status: "PAID",
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Today's expenses
      prisma.expense.aggregate({
        where: {
          ...branchFilter,
          status: "PAID",
          paidDate: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),

      // Active rooms
      prisma.room.count({
        where: {
          ...branchFilter,
          status: "OCCUPIED",
        },
      }),

      // Pending orders
      prisma.order.count({
        where: {
          ...branchFilter,
          status: { in: ["PENDING", "CONFIRMED", "PREPARING"] },
        },
      }),

      // Low stock items
      prisma.stockItem.count({
        where: {
          ...branchFilter,
          OR: [
            { status: "LOW_STOCK" },
            { status: "OUT_OF_STOCK" },
            { quantity: { lte: 5 } },
          ],
        },
      }),
    ]);

    // ============ OCCUPANCY METRICS ============
    const [totalRooms, occupiedRooms, availableRooms, maintenanceRooms] = await Promise.all([
      prisma.room.count({ where: branchFilter }),
      prisma.room.count({ where: { ...branchFilter, status: "OCCUPIED" } }),
      prisma.room.count({ where: { ...branchFilter, status: "AVAILABLE" } }),
      prisma.room.count({ where: { ...branchFilter, status: "MAINTENANCE" } }),
    ]);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // ============ RECENT ACTIVITY ============
    const [recentBookings, recentOrders, recentPayments] = await Promise.all([
      prisma.booking.findMany({
        where: branchFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          guest: { select: { firstName: true, lastName: true, phone: true } },
          room: { select: { number: true, type: true } },
        },
      }),
      prisma.order.findMany({
        where: branchFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          guest: { select: { guestName: true } },
        },
      }),
      prisma.payment.findMany({
        where: branchFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // ============ TOP SELLING ITEMS ============
    const topMenuItems = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          ...branchFilter,
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // Get menu item details
    const menuItemIds = topMenuItems.map(i => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, category: true, price: true },
    });

    const topItemsWithDetails = topMenuItems.map(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      return {
        ...menuItem,
        totalQuantity: item._sum.quantity || 0,
        orderCount: item._count,
      };
    });

    // ============ REVENUE BY CATEGORY ============
    const revenueByCategory = await prisma.order.groupBy({
      by: ["status"],
      where: {
        ...branchFilter,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // ============ ALERTS & NOTIFICATIONS ============
    const [unreadNotifications, pendingExpenses, expiringStock] = await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
      prisma.expense.count({
        where: { ...branchFilter, status: "PENDING" },
      }),
      prisma.stockItem.count({
        where: {
          ...branchFilter,
          expiryDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
    ]);

    // ============ COMPARISON WITH PREVIOUS PERIOD ============
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousEndDate = startDate;

    const [previousRevenue, previousOrders] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          ...branchFilter,
          status: "PAID",
          createdAt: { gte: previousStartDate, lte: previousEndDate },
        },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: {
          ...branchFilter,
          createdAt: { gte: previousStartDate, lte: previousEndDate },
        },
        _count: true,
      }),
    ]);

    const currentRevenue = todayRevenue._sum.amount || 0;
    const prevRevenue = previousRevenue._sum.amount || 0;
    const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const currentOrders = todayOrders._count || 0;
    const prevOrders = previousOrders._count || 0;
    const ordersChange = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;

    // ============ HOURLY STATS (for today) ============
    let hourlyStats = [];
    if (period === "today") {
      const ordersByHour = await prisma.order.groupBy({
        by: ["createdAt"],
        where: {
          ...branchFilter,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      });

      // Aggregate by hour
      const hourMap = new Map();
      ordersByHour.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + order._count);
      });

      hourlyStats = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${i}:00`,
        orders: hourMap.get(i) || 0,
      }));
    }

    // ============ BUILD RESPONSE ============
    return NextResponse.json({
      success: true,
      dashboard: {
        // Key Metrics
        metrics: {
          todayRevenue: currentRevenue / 100,
          todayExpenses: (todayExpenses._sum.amount || 0) / 100,
          netProfit: (currentRevenue - (todayExpenses._sum.amount || 0)) / 100,
          revenueChange: parseFloat(revenueChange.toFixed(1)),
          ordersToday: currentOrders,
          ordersChange: parseFloat(ordersChange.toFixed(1)),
          occupancyRate: parseFloat(occupancyRate.toFixed(1)),
          activeRooms,
          totalRooms,
          availableRooms,
          maintenanceRooms,
        },

        // Room Status
        roomStatus: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms,
          maintenance: maintenanceRooms,
          occupancyRate: parseFloat(occupancyRate.toFixed(1)),
        },

        // Today's Summary
        today: {
          bookings: {
            count: todayBookings._count || 0,
            revenue: (todayBookings._sum.finalAmount || 0) / 100,
          },
          orders: {
            count: todayOrders._count || 0,
            revenue: (todayOrders._sum.totalAmount || 0) / 100,
          },
        },

        // Top Selling Items
        topSellingItems: topItemsWithDetails,

        // Alerts
        alerts: {
          unreadNotifications,
          pendingExpenses,
          expiringStock,
          lowStock: lowStockCount,
          pendingOrders,
        },

        // Recent Activity
        recentActivity: {
          bookings: recentBookings.map(b => ({
            id: b.id,
            number: b.bookingNumber,
            guest: `${b.guest?.firstName} ${b.guest?.lastName}`,
            room: b.room?.number,
            amount: b.finalAmount,
            status: b.status,
            createdAt: b.createdAt,
          })),
          orders: recentOrders.map(o => ({
            id: o.id,
            number: o.orderNumber,
            guest: o.guestName || "Guest",
            amount: o.total,
            status: o.status,
            createdAt: o.createdAt,
          })),
          payments: recentPayments.map(p => ({
            id: p.id,
            transactionId: p.transactionId,
            amount: p.amount / 100,
            method: p.method,
            status: p.status,
            createdAt: p.createdAt,
          })),
        },

        // Hourly Stats (for today)
        hourlyStats,

        // Branch Info
        branch: branch ? {
          id: branch.id,
          name: branch.name,
          location: branch.location,
        } : null,
      },
      period,
    });
  } catch (error) {
    console.error("Get advanced dashboard error:", error);
    return NextResponse.json({ error: "Failed to get dashboard data" }, { status: 500 });
  }
}
