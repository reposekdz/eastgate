import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/manager/reports
 * Generate comprehensive reports for managers
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

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "financial"; // financial, staff, operations, guest
    const period = searchParams.get("period") || "month"; // week, month, quarter, year
    const targetBranchId = searchParams.get("branchId") || branchId;

    // Branch managers can only view their branch reports
    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const branchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    let reportData: any = {};

    switch (reportType) {
      case "financial":
        reportData = await generateFinancialReport(branchWhere, startDate, now);
        break;
      case "staff":
        reportData = await generateStaffReport(branchWhere, startDate, now);
        break;
      case "operations":
        reportData = await generateOperationsReport(branchWhere, startDate, now);
        break;
      case "guest":
        reportData = await generateGuestReport(branchWhere, startDate, now);
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reportType,
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
      branchId: targetBranchId,
      data: reportData,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

// Financial Report
async function generateFinancialReport(branchWhere: any, startDate: Date, endDate: Date) {
  const [bookings, orders, payments, revenue] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...branchWhere,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.order.findMany({
      where: {
        ...branchWhere,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        booking: branchWhere.branchId ? {
          branchId: branchWhere.branchId
        } : undefined,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.revenue.findMany({
      where: {
        ...branchWhere,
        date: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const totalRevenue = revenue.reduce((sum: number, r: any) => sum + r.totalAmount, 0);
  const roomRevenue = revenue.reduce((sum: number, r: any) => sum + r.roomRevenue, 0);
  const restaurantRevenue = revenue.reduce((sum: number, r: any) => sum + r.restaurantRevenue, 0);
  const serviceRevenue = revenue.reduce((sum: number, r: any) => sum + r.servicesRevenue, 0);

  const totalBookingRevenue = bookings.reduce((sum: number, b: any) => sum + b.finalAmount, 0);
  const totalOrderRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0);

  const paymentsByMethod = payments.reduce((acc: any, p: any) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {});

  // Calculate costs (if available)
  const orderCosts = orders
    .flatMap((o: any) => o.items)
    .reduce((sum: number, item: any) => {
      return sum + (item.menuItem.cost || 0) * item.quantity;
    }, 0);

  const grossProfit = totalOrderRevenue - orderCosts;
  const profitMargin = totalOrderRevenue > 0 ? (grossProfit / totalOrderRevenue) * 100 : 0;

  return {
    summary: {
      totalRevenue,
      roomRevenue,
      restaurantRevenue,
      serviceRevenue,
      totalBookingRevenue,
      totalOrderRevenue,
      grossProfit,
      profitMargin,
    },
    breakdown: {
      byPaymentMethod: paymentsByMethod,
      bySource: {
        bookings: bookings.length,
        orders: orders.length,
        services: serviceRevenue,
      },
    },
    trends: revenue.map((r: any) => ({
      date: r.date,
      total: r.totalAmount,
      rooms: r.roomRevenue,
      restaurant: r.restaurantRevenue,
      services: r.servicesRevenue,
    })),
  };
}

// Staff Performance Report
async function generateStaffReport(branchWhere: any, startDate: Date, endDate: Date) {
  const staff = await prisma.user.findMany({
    where: {
      ...branchWhere,
      role: { not: "SUPER_ADMIN" },
    },
    include: {
      shifts: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
      performanceReviews: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: { createdAt: "desc" },
      },
      bookingsCreated: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      ordersCreated: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  const staffPerformance = staff.map((s: any) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    status: s.status,
    shiftsWorked: s.shifts.length,
    totalHours: s.shifts.reduce((sum: number, shift: any) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0),
    bookingsCreated: s.bookingsCreated.length,
    ordersCreated: s.ordersCreated.length,
    averageRating: s.performanceReviews.length > 0
      ? s.performanceReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / s.performanceReviews.length
      : null,
    latestReview: s.performanceReviews[0] || null,
  }));

  const attendance = staff.reduce((acc: any, s: any) => {
    acc.active = (acc.active || 0) + (s.status === "ACTIVE" ? 1 : 0);
    acc.onLeave = (acc.onLeave || 0) + (s.status === "ON_LEAVE" ? 1 : 0);
    acc.suspended = (acc.suspended || 0) + (s.status === "SUSPENDED" ? 1 : 0);
    return acc;
  }, {});

  return {
    summary: {
      totalStaff: staff.length,
      attendance,
      totalShifts: staff.reduce((sum: number, s: any) => sum + s.shifts.length, 0),
      totalHours: staff.reduce((sum: number, s: any) => 
        sum + s.shifts.reduce((shiftSum: number, shift: any) => {
          const start = new Date(shift.startTime);
          const end = new Date(shift.endTime);
          return shiftSum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0), 0),
    },
    performance: staffPerformance.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)),
    topPerformers: staffPerformance
      .filter(s => s.averageRating !== null)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 5),
  };
}

// Operations Report
async function generateOperationsReport(branchWhere: any, startDate: Date, endDate: Date) {
  const [rooms, bookings, orders, services, maintenanceLogs, housekeepingTasks] = await Promise.all([
    prisma.room.findMany({
      where: branchWhere,
      include: {
        bookings: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        ...branchWhere,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.order.findMany({
      where: {
        ...branchWhere,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.service.findMany({
      where: {
        ...branchWhere,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.maintenanceLog.findMany({
      where: {
        room: branchWhere.branchId ? {
          branchId: branchWhere.branchId
        } : undefined,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.housekeepingTask.findMany({
      where: {
        room: branchWhere.branchId ? {
          branchId: branchWhere.branchId
        } : undefined,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const occupancyRate = rooms.length > 0
    ? (rooms.filter((r: any) => r.status === "OCCUPIED").length / rooms.length) * 100
    : 0;

  return {
    roomOperations: {
      totalRooms: rooms.length,
      occupied: rooms.filter((r: any) => r.status === "OCCUPIED").length,
      available: rooms.filter((r: any) => r.status === "AVAILABLE").length,
      cleaning: rooms.filter((r: any) => r.status === "CLEANING").length,
      maintenance: rooms.filter((r: any) => r.status === "MAINTENANCE").length,
      occupancyRate,
      totalBookings: bookings.length,
      checkIns: bookings.filter((b: any) => b.status === "CHECKED_IN" || b.status === "CHECKED_OUT").length,
    },
    restaurantOperations: {
      totalOrders: orders.length,
      pending: orders.filter((o: any) => o.status === "PENDING").length,
      preparing: orders.filter((o: any) => o.status === "PREPARING").length,
      completed: orders.filter((o: any) => o.status === "COMPLETED").length,
      cancelled: orders.filter((o: any) => o.status === "CANCELLED").length,
      averagePreparationTime: orders.length > 0
        ? orders
            .filter((o: any) => o.preparedAt && o.sentToKitchen)
            .reduce((sum: number, o: any) => {
              const prep = new Date(o.preparedAt).getTime() - new Date(o.sentToKitchen).getTime();
              return sum + prep / (1000 * 60);
            }, 0) / orders.filter((o: any) => o.preparedAt && o.sentToKitchen).length
        : 0,
    },
    services: {
      total: services.length,
      pending: services.filter((s: any) => s.status === "PENDING").length,
      inProgress: services.filter((s: any) => s.status === "IN_PROGRESS").length,
      completed: services.filter((s: any) => s.status === "COMPLETED").length,
    },
    maintenance: {
      total: maintenanceLogs.length,
      pending: maintenanceLogs.filter((m: any) => m.status === "PENDING").length,
      inProgress: maintenanceLogs.filter((m: any) => m.status === "IN_PROGRESS").length,
      resolved: maintenanceLogs.filter((m: any) => m.status === "RESOLVED").length,
    },
    housekeeping: {
      total: housekeepingTasks.length,
      pending: housekeepingTasks.filter((h: any) => h.status === "PENDING").length,
      inProgress: housekeepingTasks.filter((h: any) => h.status === "IN_PROGRESS").length,
      completed: housekeepingTasks.filter((h: any) => h.status === "COMPLETED").length,
    },
  };
}

// Guest Analytics Report
async function generateGuestReport(branchWhere: any, startDate: Date, endDate: Date) {
  const guests = await prisma.guest.findMany({
    where: {
      ...branchWhere,
    },
    include: {
      bookings: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      reviews: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
  });

  const newGuests = guests.filter((g: any) => 
    !g.lastVisit || new Date(g.lastVisit) >= startDate
  );

  const returningGuests = guests.filter((g: any) => g.totalStays > 1);

  const guestsByNationality = guests.reduce((acc: any, g: any) => {
    acc[g.nationality] = (acc[g.nationality] || 0) + 1;
    return acc;
  }, {});

  const averageSpend = guests.length > 0
    ? guests.reduce((sum: number, g: any) => sum + g.totalSpent, 0) / guests.length
    : 0;

  return {
    summary: {
      totalGuests: guests.length,
      newGuests: newGuests.length,
      returningGuests: returningGuests.length,
      loyaltyMembers: guests.filter((g: any) => g.loyaltyTier !== null).length,
      averageSpend,
      totalSpend: guests.reduce((sum: number, g: any) => sum + g.totalSpent, 0),
    },
    demographics: {
      byNationality: guestsByNationality,
      byLoyaltyTier: guests.reduce((acc: any, g: any) => {
        if (g.loyaltyTier) {
          acc[g.loyaltyTier] = (acc[g.loyaltyTier] || 0) + 1;
        }
        return acc;
      }, {}),
    },
    satisfaction: {
      totalReviews: guests.reduce((sum: number, g: any) => sum + g.reviews.length, 0),
      averageRating: guests.reduce((sum: number, g: any) => {
        const guestAvg = g.reviews.length > 0
          ? g.reviews.reduce((rSum: number, r: any) => rSum + (r.rating || 0), 0) / g.reviews.length
          : 0;
        return sum + guestAvg;
      }, 0) / guests.filter((g: any) => g.reviews.length > 0).length || 0,
    },
    topSpenders: guests
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((g: any) => ({
        id: g.id,
        name: `${g.firstName} ${g.lastName}`,
        totalSpent: g.totalSpent,
        totalStays: g.totalStays,
        loyaltyTier: g.loyaltyTier,
      })),
  };
}
