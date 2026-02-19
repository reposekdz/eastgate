import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/manager/analytics
 * Advanced analytics for managers with predictive insights
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
    const targetBranchId = searchParams.get("branchId") || branchId;
    const period = searchParams.get("period") || "30"; // days

    // Branch managers can only view their branch analytics
    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const branchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    // Fetch analytics data
    const [bookings, orders, revenue, guests, reviews] = await Promise.all([
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "asc" },
      }),
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
        orderBy: { createdAt: "asc" },
      }),
      prisma.revenue.findMany({
        where: {
          ...branchWhere,
          date: { gte: startDate },
        },
        orderBy: { date: "asc" },
      }),
      prisma.guest.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: startDate },
        },
      }),
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
      }),
    ]);

    // Revenue Trends
    const revenueTrends = revenue.reduce((acc: any, r: any) => {
      const date = r.date.toISOString().split('T')[0];
      acc[date] = {
        total: r.totalAmount,
        rooms: r.roomRevenue,
        restaurant: r.restaurantRevenue,
        services: r.servicesRevenue,
      };
      return acc;
    }, {});

    // Booking Trends
    const bookingTrends = bookings.reduce((acc: any, b: any) => {
      const date = b.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Popular Menu Items
    const menuItemSales = orders
      .flatMap((o: any) => o.items)
      .reduce((acc: any, item: any) => {
        const itemName = item.menuItem.name;
        if (!acc[itemName]) {
          acc[itemName] = {
            name: itemName,
            quantity: 0,
            revenue: 0,
            cost: 0,
          };
        }
        acc[itemName].quantity += item.quantity;
        acc[itemName].revenue += item.price * item.quantity;
        acc[itemName].cost += (item.menuItem.cost || 0) * item.quantity;
        return acc;
      }, {});

    const topMenuItems = Object.values(menuItemSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Guest Demographics
    const guestDemographics = {
      byNationality: guests.reduce((acc: any, g: any) => {
        acc[g.nationality] = (acc[g.nationality] || 0) + 1;
        return acc;
      }, {}),
      byLoyaltyTier: guests.reduce((acc: any, g: any) => {
        if (g.loyaltyTier) {
          acc[g.loyaltyTier] = (acc[g.loyaltyTier] || 0) + 1;
        }
        return acc;
      }, {}),
    };

    // Booking Sources
    const bookingSources = bookings.reduce((acc: any, b: any) => {
      acc[b.source] = (acc[b.source] || 0) + 1;
      return acc;
    }, {});

    // Payment Methods
    const paymentMethods = bookings.reduce((acc: any, b: any) => {
      if (b.paymentMethod) {
        acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + 1;
      }
      return acc;
    }, {});

    // Customer Satisfaction
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    const ratingDistribution = reviews.reduce((acc: any, r: any) => {
      const rating = r.rating || 0;
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    // Predictive Analytics
    const predictions = calculatePredictions(bookings, orders, revenue);

    return NextResponse.json({
      success: true,
      period: days,
      dateRange: {
        start: startDate,
        end: new Date(),
      },
      analytics: {
        revenue: {
          trends: revenueTrends,
          total: revenue.reduce((sum: number, r: any) => sum + r.totalAmount, 0),
          average: revenue.length > 0
            ? revenue.reduce((sum: number, r: any) => sum + r.totalAmount, 0) / revenue.length
            : 0,
        },
        bookings: {
          trends: bookingTrends,
          total: bookings.length,
          bySource: bookingSources,
          byStatus: bookings.reduce((acc: any, b: any) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
          }, {}),
          averageValue: bookings.length > 0
            ? bookings.reduce((sum: number, b: any) => sum + b.finalAmount, 0) / bookings.length
            : 0,
        },
        restaurant: {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum: number, o: any) => sum + o.total, 0),
          topItems: topMenuItems,
          averageOrderValue: orders.length > 0
            ? orders.reduce((sum: number, o: any) => sum + o.total, 0) / orders.length
            : 0,
        },
        guests: {
          total: guests.length,
          demographics: guestDemographics,
          returning: guests.filter((g: any) => g.totalStays > 1).length,
          loyaltyMembers: guests.filter((g: any) => g.loyaltyTier !== null).length,
        },
        satisfaction: {
          averageRating,
          totalReviews: reviews.length,
          distribution: ratingDistribution,
        },
        payments: {
          byMethod: paymentMethods,
        },
      },
      predictions,
      insights: generateInsights(bookings, orders, revenue, guests, reviews),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Calculate predictions based on historical data
function calculatePredictions(bookings: any[], orders: any[], revenue: any[]) {
  // Simple linear regression for revenue prediction
  const revenueByDay = revenue.map((r: any, index: number) => ({
    x: index,
    y: r.totalAmount,
  }));

  if (revenueByDay.length < 7) {
    return {
      nextWeekRevenue: null,
      nextMonthRevenue: null,
      trend: "insufficient_data",
    };
  }

  // Calculate trend
  const n = revenueByDay.length;
  const sumX = revenueByDay.reduce((sum: number, point: any) => sum + point.x, 0);
  const sumY = revenueByDay.reduce((sum: number, point: any) => sum + point.y, 0);
  const sumXY = revenueByDay.reduce((sum: number, point: any) => sum + point.x * point.y, 0);
  const sumXX = revenueByDay.reduce((sum: number, point: any) => sum + point.x * point.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next 7 days
  const nextWeekRevenue = Array.from({ length: 7 }, (_, i) => {
    const x = n + i;
    return {
      day: i + 1,
      predictedRevenue: Math.round(slope * x + intercept),
    };
  });

  const nextWeekTotal = nextWeekRevenue.reduce((sum: number, day: any) => sum + day.predictedRevenue, 0);
  const nextMonthTotal = nextWeekTotal * 4; // Rough estimate

  return {
    nextWeekRevenue: nextWeekTotal,
    nextMonthRevenue: nextMonthTotal,
    trend: slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable",
    daily: nextWeekRevenue,
  };
}

// Generate actionable insights
function generateInsights(
  bookings: any[],
  orders: any[],
  revenue: any[],
  guests: any[],
  reviews: any[]
) {
  const insights = [];

  // Revenue insights
  const recentRevenue = revenue.slice(-7);
  const previousRevenue = revenue.slice(-14, -7);
  
  if (recentRevenue.length > 0 && previousRevenue.length > 0) {
    const recentAvg = recentRevenue.reduce((sum: number, r: any) => sum + r.totalAmount, 0) / recentRevenue.length;
    const previousAvg = previousRevenue.reduce((sum: number, r: any) => sum + r.totalAmount, 0) / previousRevenue.length;
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (change > 10) {
      insights.push({
        type: "positive",
        category: "revenue",
        title: "Revenue Growth",
        message: `Revenue increased by ${change.toFixed(1)}% compared to the previous week`,
      });
    } else if (change < -10) {
      insights.push({
        type: "warning",
        category: "revenue",
        title: "Revenue Decline",
        message: `Revenue decreased by ${Math.abs(change).toFixed(1)}% compared to the previous week`,
      });
    }
  }

  // Booking insights
  const cancelledBookings = bookings.filter((b: any) => b.status === "CANCELLED").length;
  const cancellationRate = bookings.length > 0 ? (cancelledBookings / bookings.length) * 100 : 0;

  if (cancellationRate > 15) {
    insights.push({
      type: "warning",
      category: "bookings",
      title: "High Cancellation Rate",
      message: `${cancellationRate.toFixed(1)}% of bookings were cancelled. Consider reviewing booking policies.`,
    });
  }

  // Guest satisfaction
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  if (averageRating < 3.5 && reviews.length > 10) {
    insights.push({
      type: "critical",
      category: "satisfaction",
      title: "Low Customer Satisfaction",
      message: `Average rating is ${averageRating.toFixed(1)}/5. Immediate attention required.`,
    });
  } else if (averageRating >= 4.5) {
    insights.push({
      type: "positive",
      category: "satisfaction",
      title: "Excellent Customer Satisfaction",
      message: `Average rating is ${averageRating.toFixed(1)}/5. Keep up the great work!`,
    });
  }

  // Returning guests
  const returningGuests = guests.filter((g: any) => g.totalStays > 1).length;
  const returningRate = guests.length > 0 ? (returningGuests / guests.length) * 100 : 0;

  if (returningRate > 40) {
    insights.push({
      type: "positive",
      category: "loyalty",
      title: "High Guest Retention",
      message: `${returningRate.toFixed(1)}% of guests are returning customers`,
    });
  }

  return insights;
}
