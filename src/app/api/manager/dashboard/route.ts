import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/manager/dashboard
 * Comprehensive dashboard data for branch managers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    // Only allow managers and super managers
    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today, week, month, year
    const targetBranchId = searchParams.get("branchId") || branchId;

    // Super managers can view any branch, branch managers only their branch
    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Build where clause for branch filtering
    const branchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    // Fetch comprehensive data in parallel
    const [
      bookings,
      rooms,
      orders,
      staff,
      guests,
      services,
      revenue,
      events,
      payments,
      reviews,
      branch
    ] = await Promise.all([
      // Bookings
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: startDate },
        },
        include: {
          guest: true,
          room: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Rooms
      prisma.room.findMany({
        where: branchWhere,
        include: {
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
          },
          housekeepingTasks: {
            where: {
              status: { not: "COMPLETED" },
            },
          },
          maintenanceLogs: {
            where: {
              status: { not: "RESOLVED" },
            },
          },
        },
      }),

      // Orders
      prisma.order.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: startDate },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Staff
      prisma.user.findMany({
        where: {
          ...branchWhere,
          role: { not: "SUPER_ADMIN" },
        },
        include: {
          shifts: {
            where: {
              date: { gte: startDate },
            },
          },
          performanceReviews: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),

      // Guests
      prisma.guest.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: startDate },
        },
        include: {
          bookings: true,
        },
      }),

      // Services
      prisma.service.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: startDate },
        },
        include: {
          staff: true,
        },
      }),

      // Revenue
      prisma.revenue.findMany({
        where: {
          ...branchWhere,
          date: { gte: startDate },
        },
        orderBy: { date: "desc" },
      }),

      // Events
      prisma.event.findMany({
        where: {
          ...branchWhere,
          date: { gte: startDate },
        },
        orderBy: { date: "asc" },
      }),

      // Payments
      prisma.payment.findMany({
        where: {
          booking: branchWhere.branchId ? {
            branchId: branchWhere.branchId
          } : undefined,
          createdAt: { gte: startDate },
        },
      }),

      // Reviews
      prisma.review.findMany({
        where: {
          guest: branchWhere.branchId ? {
            branchId: branchWhere.branchId
          } : undefined,
          createdAt: { gte: startDate },
        },
        include: {
          guest: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Branch Info
      targetBranchId ? prisma.branch.findUnique({
        where: { id: targetBranchId },
        include: {
          users: {
            where: { status: "ACTIVE" },
          },
          rooms: true,
        },
      }) : null,
    ]);

    // Calculate metrics
    const metrics = {
      // Revenue Metrics
      totalRevenue: revenue.reduce((sum, r) => sum + r.totalAmount, 0),
      roomRevenue: revenue.reduce((sum, r) => sum + r.roomRevenue, 0),
      restaurantRevenue: revenue.reduce((sum, r) => sum + r.restaurantRevenue, 0),
      serviceRevenue: revenue.reduce((sum, r) => sum + r.servicesRevenue, 0),
      
      // Booking Metrics
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "CONFIRMED").length,
      checkedInBookings: bookings.filter(b => b.status === "CHECKED_IN").length,
      checkedOutBookings: bookings.filter(b => b.status === "CHECKED_OUT").length,
      cancelledBookings: bookings.filter(b => b.status === "CANCELLED").length,
      noShowBookings: bookings.filter(b => b.status === "NO_SHOW").length,
      averageBookingValue: bookings.length > 0 
        ? bookings.reduce((sum, b) => sum + b.finalAmount, 0) / bookings.length 
        : 0,
      
      // Room Metrics
      totalRooms: rooms.length,
      availableRooms: rooms.filter(r => r.status === "AVAILABLE").length,
      occupiedRooms: rooms.filter(r => r.status === "OCCUPIED").length,
      cleaningRooms: rooms.filter(r => r.status === "CLEANING").length,
      maintenanceRooms: rooms.filter(r => r.status === "MAINTENANCE").length,
      occupancyRate: rooms.length > 0 
        ? (rooms.filter(r => r.status === "OCCUPIED").length / rooms.length) * 100 
        : 0,
      
      // Order Metrics
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === "PENDING").length,
      preparingOrders: orders.filter(o => o.status === "PREPARING").length,
      completedOrders: orders.filter(o => o.status === "COMPLETED").length,
      totalOrderRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length 
        : 0,
      
      // Staff Metrics
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.status === "ACTIVE").length,
      onLeaveStaff: staff.filter(s => s.status === "ON_LEAVE").length,
      suspendedStaff: staff.filter(s => s.status === "SUSPENDED").length,
      
      // Guest Metrics
      totalGuests: guests.length,
      newGuests: guests.filter(g => !g.lastVisit || g.lastVisit >= startDate).length,
      returningGuests: guests.filter(g => g.totalStays > 1).length,
      loyaltyMembers: guests.filter(g => g.loyaltyTier !== null).length,
      
      // Service Metrics
      totalServices: services.length,
      pendingServices: services.filter(s => s.status === "PENDING").length,
      inProgressServices: services.filter(s => s.status === "IN_PROGRESS").length,
      completedServices: services.filter(s => s.status === "COMPLETED").length,
      
      // Event Metrics
      totalEvents: events.length,
      upcomingEvents: events.filter(e => new Date(e.date) > now).length,
      
      // Payment Metrics
      totalPayments: payments.length,
      successfulPayments: payments.filter(p => p.status === "PAID").length,
      pendingPayments: payments.filter(p => p.status === "PENDING").length,
      totalPaymentAmount: payments
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0),
      
      // Review Metrics
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
        : 0,
    };

    // Recent activities
    const recentActivities = [
      ...bookings.slice(0, 10).map(b => ({
        type: "booking",
        id: b.id,
        title: `Booking ${b.bookingNumber}`,
        description: `${b.guest.firstName} ${b.guest.lastName} - Room ${b.room.number}`,
        timestamp: b.createdAt,
        status: b.status,
      })),
      ...orders.slice(0, 10).map(o => ({
        type: "order",
        id: o.id,
        title: `Order ${o.orderNumber}`,
        description: `${o.items.length} items - ${o.guestName || 'Walk-in'}`,
        timestamp: o.createdAt,
        status: o.status,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    // Performance trends (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()));
    
    const previousRevenue = await prisma.revenue.findMany({
      where: {
        ...branchWhere,
        date: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    });

    const previousTotalRevenue = previousRevenue.reduce((sum, r) => sum + r.totalAmount, 0);
    const revenueGrowth = previousTotalRevenue > 0 
      ? ((metrics.totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
      branch: branch ? {
        id: branch.id,
        name: branch.name,
        location: branch.location,
        totalRooms: branch.totalRooms,
        activeStaff: branch.users.length,
      } : null,
      metrics,
      trends: {
        revenueGrowth,
        occupancyTrend: metrics.occupancyRate,
      },
      recentActivities,
      alerts: [
        ...(metrics.pendingOrders > 5 ? [{
          type: "warning",
          title: "High Pending Orders",
          message: `${metrics.pendingOrders} orders are pending`,
        }] : []),
        ...(metrics.maintenanceRooms > 0 ? [{
          type: "info",
          title: "Rooms Under Maintenance",
          message: `${metrics.maintenanceRooms} rooms require attention`,
        }] : []),
        ...(metrics.occupancyRate > 90 ? [{
          type: "success",
          title: "High Occupancy",
          message: `${metrics.occupancyRate.toFixed(1)}% occupancy rate`,
        }] : []),
      ],
      topPerformers: {
        staff: staff
          .map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            shiftsWorked: s.shifts.length,
            rating: s.performanceReviews[0]?.rating || null,
          }))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5),
        menuItems: orders
          .flatMap(o => o.items)
          .reduce((acc: any, item) => {
            const name = item.menuItem.name;
            acc[name] = (acc[name] || 0) + item.quantity;
            return acc;
          }, {}),
      },
    });
  } catch (error) {
    console.error("Error fetching manager dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
