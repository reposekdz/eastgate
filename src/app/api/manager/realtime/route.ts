import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/manager/realtime
 * Real-time system monitoring and live updates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const targetBranchId = request.nextUrl.searchParams.get("branchId") || branchId;

    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const branchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    // Fetch real-time data
    const [
      activeOrders,
      recentBookings,
      onlineStaff,
      recentCheckIns,
      pendingServices,
      currentOccupancy,
      todayRevenue,
      recentNotifications,
      activeGuests,
      systemActivity
    ] = await Promise.all([
      // Active orders in last 5 minutes
      prisma.order.findMany({
        where: {
          ...branchWhere,
          status: { in: ["PENDING", "PREPARING", "READY"] },
          createdAt: { gte: fiveMinutesAgo },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Recent bookings (last 5 minutes)
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: fiveMinutesAgo },
        },
        include: {
          guest: true,
          room: true,
        },
        orderBy: { createdAt: "desc" },
      }),

      // Staff who logged in recently (online now)
      prisma.user.findMany({
        where: {
          ...branchWhere,
          lastLogin: { gte: fiveMinutesAgo },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          role: true,
          lastLogin: true,
        },
      }),

      // Recent check-ins
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          actualCheckIn: { gte: fiveMinutesAgo },
          status: "CHECKED_IN",
        },
        include: {
          guest: true,
          room: true,
        },
        orderBy: { actualCheckIn: "desc" },
      }),

      // Pending service requests
      prisma.service.findMany({
        where: {
          ...branchWhere,
          status: "PENDING",
        },
        include: {
          booking: {
            include: {
              guest: true,
              room: true,
            },
          },
          staff: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Current room occupancy
      prisma.room.findMany({
        where: branchWhere,
        include: {
          currentGuest: true,
          housekeepingTasks: {
            where: {
              status: { not: "COMPLETED" },
            },
          },
        },
      }),

      // Today's revenue
      prisma.revenue.findFirst({
        where: {
          ...branchWhere,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),

      // Recent notifications
      prisma.notification.findMany({
        where: {
          user: branchWhere.branchId ? {
            branchId: branchWhere.branchId
          } : undefined,
          createdAt: { gte: fiveMinutesAgo },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),

      // Active guests (checked in)
      prisma.booking.count({
        where: {
          ...branchWhere,
          status: "CHECKED_IN",
        },
      }),

      // Recent system activity
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          updatedAt: { gte: fiveMinutesAgo },
        },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          updatedAt: true,
          guest: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    // Calculate real-time metrics
    const liveMetrics = {
      timestamp: now,
      activeOrders: {
        count: activeOrders.length,
        pending: activeOrders.filter((o: any) => o.status === "PENDING").length,
        preparing: activeOrders.filter((o: any) => o.status === "PREPARING").length,
        ready: activeOrders.filter((o: any) => o.status === "READY").length,
        totalValue: activeOrders.reduce((sum: number, o: any) => sum + o.total, 0),
        items: activeOrders.flatMap((o: any) => o.items.map((item: any) => ({
          orderId: o.id,
          orderNumber: o.orderNumber,
          itemName: item.menuItem.name,
          quantity: item.quantity,
          status: o.status,
        }))),
      },
      recentBooking: {
        count: recentBookings.length,
        totalValue: recentBookings.reduce((sum: number, b: any) => sum + b.finalAmount, 0),
        bookings: recentBookings.map((b: any) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          guestName: `${b.guest.firstName} ${b.guest.lastName}`,
          roomNumber: b.room.number,
          checkInDate: b.checkInDate,
          amount: b.finalAmount,
          status: b.status,
        })),
      },
      staffActivity: {
        onlineNow: onlineStaff.length,
        staff: onlineStaff.map((s: any) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          lastSeen: s.lastLogin,
        })),
      },
      checkIns: {
        count: recentCheckIns.length,
        guests: recentCheckIns.map((b: any) => ({
          bookingNumber: b.bookingNumber,
          guestName: `${b.guest.firstName} ${b.guest.lastName}`,
          roomNumber: b.room.number,
          checkInTime: b.actualCheckIn,
        })),
      },
      pendingServices: {
        count: pendingServices.length,
        urgent: pendingServices.filter((s: any) => 
          new Date(s.createdAt).getTime() < now.getTime() - 30 * 60 * 1000
        ).length,
        services: pendingServices.map((s: any) => ({
          id: s.id,
          type: s.type,
          description: s.description,
          guestName: s.booking ? `${s.booking.guest.firstName} ${s.booking.guest.lastName}` : null,
          roomNumber: s.booking?.room.number,
          createdAt: s.createdAt,
          assignedTo: s.staff?.name,
        })),
      },
      occupancy: {
        total: currentOccupancy.length,
        occupied: currentOccupancy.filter((r: any) => r.status === "OCCUPIED").length,
        available: currentOccupancy.filter((r: any) => r.status === "AVAILABLE").length,
        cleaning: currentOccupancy.filter((r: any) => r.status === "CLEANING").length,
        maintenance: currentOccupancy.filter((r: any) => r.status === "MAINTENANCE").length,
        occupancyRate: currentOccupancy.length > 0 
          ? (currentOccupancy.filter((r: any) => r.status === "OCCUPIED").length / currentOccupancy.length) * 100 
          : 0,
        needsCleaning: currentOccupancy.filter((r: any) => 
          r.housekeepingTasks.length > 0
        ).length,
      },
      todayRevenue: {
        total: todayRevenue?.totalAmount || 0,
        rooms: todayRevenue?.roomRevenue || 0,
        restaurant: todayRevenue?.restaurantRevenue || 0,
        services: todayRevenue?.servicesRevenue || 0,
      },
      activeGuests: activeGuests,
      notifications: {
        count: recentNotifications.length,
        urgent: recentNotifications.filter((n: any) => n.type === "ALERT").length,
        items: recentNotifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          userName: n.user.name,
          userRole: n.user.role,
          createdAt: n.createdAt,
        })),
      },
      systemActivity: {
        count: systemActivity.length,
        activities: systemActivity.map((a: any) => ({
          type: "booking_update",
          id: a.id,
          reference: a.bookingNumber,
          status: a.status,
          guestName: `${a.guest.firstName} ${a.guest.lastName}`,
          timestamp: a.updatedAt,
        })),
      },
    };

    // Generate live alerts
    const liveAlerts = [];

    if (activeOrders.length > 10) {
      liveAlerts.push({
        type: "warning",
        priority: "high",
        category: "restaurant",
        title: "High Order Volume",
        message: `${activeOrders.length} active orders require attention`,
        actionUrl: "/manager/orders",
      });
    }

    if (pendingServices.length > 5) {
      liveAlerts.push({
        type: "warning",
        priority: "medium",
        category: "services",
        title: "Pending Service Requests",
        message: `${pendingServices.length} service requests pending`,
        actionUrl: "/manager/services",
      });
    }

    const urgentServices = pendingServices.filter((s: any) => 
      new Date(s.createdAt).getTime() < now.getTime() - 30 * 60 * 1000
    );
    if (urgentServices.length > 0) {
      liveAlerts.push({
        type: "critical",
        priority: "urgent",
        category: "services",
        title: "Overdue Service Requests",
        message: `${urgentServices.length} service requests are overdue (>30 min)`,
        actionUrl: "/manager/services",
      });
    }

    if (liveMetrics.occupancy.needsCleaning > 3) {
      liveAlerts.push({
        type: "info",
        priority: "medium",
        category: "housekeeping",
        title: "Rooms Require Cleaning",
        message: `${liveMetrics.occupancy.needsCleaning} rooms need housekeeping`,
        actionUrl: "/manager/rooms",
      });
    }

    if (liveMetrics.occupancy.occupancyRate > 90) {
      liveAlerts.push({
        type: "success",
        priority: "low",
        category: "occupancy",
        title: "High Occupancy",
        message: `${liveMetrics.occupancy.occupancyRate.toFixed(1)}% occupancy - Excellent!`,
        actionUrl: "/manager/rooms",
      });
    }

    if (onlineStaff.length < 3 && now.getHours() >= 8 && now.getHours() < 22) {
      liveAlerts.push({
        type: "warning",
        priority: "high",
        category: "staffing",
        title: "Low Staff Online",
        message: `Only ${onlineStaff.length} staff members are currently active`,
        actionUrl: "/manager/staff",
      });
    }

    return NextResponse.json({
      success: true,
      realtime: true,
      timestamp: now,
      refreshInterval: 5000, // ms - client should refresh every 5 seconds
      metrics: liveMetrics,
      alerts: liveAlerts,
      systemHealthy: true,
      lastUpdate: now.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch real-time data",
        systemHealthy: false,
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/realtime
 * Trigger real-time actions (acknowledge alerts, update status, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { action, targetId, data } = body;

    let result;

    switch (action) {
      case "acknowledge_alert":
        // Mark notification as read
        result = await prisma.notification.update({
          where: { id: targetId },
          data: { read: true },
        });
        break;

      case "prioritize_order":
        // Update order priority
        result = await prisma.order.update({
          where: { id: targetId },
          data: { priority: "URGENT" },
        });
        break;

      case "assign_service":
        // Assign service to staff
        result = await prisma.service.update({
          where: { id: targetId },
          data: {
            staffId: data.staffId,
            status: "IN_PROGRESS",
          },
        });
        break;

      case "quick_note":
        // Add quick note to booking
        result = await prisma.booking.update({
          where: { id: targetId },
          data: {
            notes: data.note,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error performing real-time action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
