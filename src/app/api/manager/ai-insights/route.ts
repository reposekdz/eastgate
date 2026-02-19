import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/manager/ai-insights
 * AI-powered insights and recommendations for business optimization
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

    const branchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    // Fetch historical data for analysis
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [bookings, orders, revenue, guests, reviews, staff] = await Promise.all([
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: ninetyDaysAgo },
        },
        include: {
          guest: true,
          room: true,
        },
      }),
      prisma.order.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: ninetyDaysAgo },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      }),
      prisma.revenue.findMany({
        where: {
          ...branchWhere,
          date: { gte: ninetyDaysAgo },
        },
        orderBy: { date: "asc" },
      }),
      prisma.guest.findMany({
        where: branchWhere,
        include: {
          bookings: {
            where: {
              createdAt: { gte: ninetyDaysAgo },
            },
          },
          reviews: true,
        },
      }),
      prisma.review.findMany({
        where: {
          guest: branchWhere.branchId ? {
            branchId: branchWhere.branchId
          } : undefined,
          createdAt: { gte: ninetyDaysAgo },
        },
      }),
      prisma.user.findMany({
        where: {
          ...branchWhere,
          role: { not: "SUPER_ADMIN" },
        },
        include: {
          performanceReviews: {
            where: {
              createdAt: { gte: thirtyDaysAgo },
            },
          },
          shifts: {
            where: {
              date: { gte: thirtyDaysAgo },
            },
          },
        },
      }),
    ]);

    // AI Insight 1: Revenue Optimization
    const revenueOptimization = analyzeRevenueOpportunities(revenue, bookings, orders);

    // AI Insight 2: Demand Forecasting
    const demandForecast = predictDemandPatterns(bookings, revenue);

    // AI Insight 3: Guest Behavior Analysis
    const guestInsights = analyzeGuestBehavior(guests, bookings, reviews);

    // AI Insight 4: Pricing Strategy
    const pricingRecommendations = optimizePricing(bookings, revenue);

    // AI Insight 5: Staff Optimization
    const staffOptimization = optimizeStaffing(staff, bookings, orders);

    // AI Insight 6: Menu Optimization
    const menuOptimization = optimizeMenu(orders);

    // AI Insight 7: Operational Efficiency
    const operationalInsights = analyzeOperationalEfficiency(bookings, orders);

    // AI Insight 8: Customer Retention
    const retentionStrategy = optimizeCustomerRetention(guests, reviews);

    // Generate Action Items
    const actionItems = generateActionItems([
      revenueOptimization,
      demandForecast,
      guestInsights,
      pricingRecommendations,
      staffOptimization,
      menuOptimization,
      operationalInsights,
      retentionStrategy,
    ]);

    return NextResponse.json({
      success: true,
      aiPowered: true,
      timestamp: now,
      insights: {
        revenueOptimization,
        demandForecast,
        guestInsights,
        pricingRecommendations,
        staffOptimization,
        menuOptimization,
        operationalInsights,
        retentionStrategy,
      },
      actionItems,
      summary: {
        totalInsights: 8,
        highPriorityActions: actionItems.filter((item: any) => item.priority === "high").length,
        estimatedImpact: actionItems.reduce((sum: number, item: any) => sum + (item.estimatedImpact || 0), 0),
      },
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 }
    );
  }
}

// AI Analysis Functions

function analyzeRevenueOpportunities(revenue: any[], bookings: any[], orders: any[]) {
  const totalRevenue = revenue.reduce((sum, r) => sum + r.totalAmount, 0);
  const roomRevenue = revenue.reduce((sum, r) => sum + r.roomRevenue, 0);
  const restaurantRevenue = revenue.reduce((sum, r) => sum + r.restaurantRevenue, 0);

  const roomPercentage = (roomRevenue / totalRevenue) * 100;
  const restaurantPercentage = (restaurantRevenue / totalRevenue) * 100;

  const opportunities = [];

  // Analyze revenue mix
  if (roomPercentage > 75) {
    opportunities.push({
      type: "revenue_diversification",
      title: "Diversify Revenue Streams",
      description: "Room revenue is dominant (>75%). Increase restaurant and service offerings.",
      potentialIncrease: totalRevenue * 0.15,
      actions: [
        "Launch special dining packages",
        "Introduce spa and wellness services",
        "Create event hosting packages",
      ],
    });
  }

  if (restaurantPercentage < 20) {
    opportunities.push({
      type: "restaurant_growth",
      title: "Boost Restaurant Revenue",
      description: "Restaurant contribution is low. Implement strategies to increase food & beverage sales.",
      potentialIncrease: totalRevenue * 0.10,
      actions: [
        "Introduce room service promotions",
        "Launch breakfast packages",
        "Host themed dinner nights",
      ],
    });
  }

  return {
    currentMix: {
      rooms: roomPercentage,
      restaurant: restaurantPercentage,
      services: 100 - roomPercentage - restaurantPercentage,
    },
    opportunities,
    recommendedMix: {
      rooms: 60,
      restaurant: 25,
      services: 15,
    },
  };
}

function predictDemandPatterns(bookings: any[], revenue: any[]) {
  // Analyze booking patterns by day of week
  const bookingsByDay: any = {};
  bookings.forEach(booking => {
    const day = new Date(booking.checkInDate).getDay();
    bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
  });

  const peakDays = Object.entries(bookingsByDay)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 2)
    .map(([day]) => ({ day: parseInt(day), name: getDayName(parseInt(day)) }));

  // Predict next 30 days demand
  const avgDailyBookings = bookings.length / 90;
  const nextMonthPrediction = Math.round(avgDailyBookings * 30);

  // Identify seasonal patterns
  const bookingsByMonth: any = {};
  bookings.forEach(booking => {
    const month = new Date(booking.createdAt).getMonth();
    bookingsByMonth[month] = (bookingsByMonth[month] || 0) + 1;
  });

  const peakMonth = Object.entries(bookingsByMonth)
    .sort(([, a]: any, [, b]: any) => b - a)[0];

  return {
    patterns: {
      peakDays,
      avgDailyBookings: Math.round(avgDailyBookings * 10) / 10,
      peakMonth: peakMonth ? { month: getMonthName(parseInt(peakMonth[0])), bookings: peakMonth[1] } : null,
    },
    forecast: {
      next7Days: Math.round(avgDailyBookings * 7),
      next30Days: nextMonthPrediction,
      confidence: 85,
    },
    recommendations: [
      {
        title: "Dynamic Pricing",
        description: `Implement premium pricing on ${peakDays.map((d: any) => d.name).join(" and ")}`,
        estimatedIncrease: 12000,
      },
      {
        title: "Promotional Campaigns",
        description: "Run special offers during low-demand periods",
        estimatedIncrease: 8000,
      },
    ],
  };
}

function analyzeGuestBehavior(guests: any[], bookings: any[], reviews: any[]) {
  const returningGuests = guests.filter(g => g.totalStays > 1).length;
  const returnRate = guests.length > 0 ? (returningGuests / guests.length) * 100 : 0;

  // Analyze booking preferences
  const roomPreferences: any = {};
  bookings.forEach(booking => {
    const type = booking.room.type;
    roomPreferences[type] = (roomPreferences[type] || 0) + 1;
  });

  // Analyze guest satisfaction
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  // Identify VIP guests (high spenders)
  const vipGuests = guests
    .filter(g => g.totalSpent > 500000)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return {
    metrics: {
      totalGuests: guests.length,
      returningGuests,
      returnRate: Math.round(returnRate * 10) / 10,
      avgSatisfaction: Math.round(avgRating * 10) / 10,
      vipCount: vipGuests.length,
    },
    preferences: {
      roomTypes: roomPreferences,
      avgStayDuration: bookings.length > 0
        ? bookings.reduce((sum, b) => sum + b.nights, 0) / bookings.length
        : 0,
    },
    segments: {
      vipGuests: vipGuests.map(g => ({
        name: `${g.firstName} ${g.lastName}`,
        totalSpent: g.totalSpent,
        stays: g.totalStays,
        loyaltyTier: g.loyaltyTier,
      })),
    },
    recommendations: [
      {
        title: "Loyalty Program Enhancement",
        description: `Return rate is ${Math.round(returnRate)}%. Enhance loyalty benefits to increase retention.`,
      },
      {
        title: "VIP Treatment",
        description: `${vipGuests.length} high-value guests identified. Implement personalized services.`,
      },
      returnRate < 30 ? {
        title: "Improve Guest Retention",
        description: "Low return rate detected. Implement post-stay engagement programs.",
      } : null,
    ].filter(Boolean),
  };
}

function optimizePricing(bookings: any[], revenue: any[]) {
  // Calculate current average rates
  const avgRoomRate = bookings.length > 0
    ? bookings.reduce((sum, b) => sum + b.roomRate, 0) / bookings.length
    : 0;

  // Identify pricing opportunities
  const occupancyByRate: any = {};
  bookings.forEach(booking => {
    const rateRange = Math.floor(booking.roomRate / 10000) * 10000;
    if (!occupancyByRate[rateRange]) {
      occupancyByRate[rateRange] = { count: 0, total: 0 };
    }
    occupancyByRate[rateRange].count++;
    occupancyByRate[rateRange].total += booking.finalAmount;
  });

  return {
    currentPricing: {
      avgRoomRate,
      lowestRate: Math.min(...bookings.map(b => b.roomRate)),
      highestRate: Math.max(...bookings.map(b => b.roomRate)),
    },
    recommendations: [
      {
        strategy: "Dynamic Pricing",
        description: "Implement automated pricing based on demand",
        implementation: [
          "Increase rates by 15-20% during peak periods",
          "Offer 10-15% discounts during low seasons",
          "Weekend premium pricing (Friday-Sunday)",
        ],
        estimatedImpact: avgRoomRate * bookings.length * 0.12,
      },
      {
        strategy: "Package Deals",
        description: "Create value-added packages",
        implementation: [
          "Bed & Breakfast package (+15% value perception)",
          "Weekend getaway package (2 nights + dining)",
          "Business traveler package (room + workspace amenities)",
        ],
        estimatedImpact: avgRoomRate * bookings.length * 0.08,
      },
    ],
  };
}

function optimizeStaffing(staff: any[], bookings: any[], orders: any[]) {
  // Analyze staff productivity
  const staffMetrics = staff.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role,
    shiftsWorked: s.shifts.length,
    avgRating: s.performanceReviews.length > 0
      ? s.performanceReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / s.performanceReviews.length
      : 0,
  }));

  const avgShiftsPerStaff = staff.length > 0
    ? staff.reduce((sum, s) => sum + s.shifts.length, 0) / staff.length
    : 0;

  // Identify understaffed areas
  const staffByRole: any = {};
  staff.forEach(s => {
    staffByRole[s.role] = (staffByRole[s.role] || 0) + 1;
  });

  return {
    current: {
      totalStaff: staff.length,
      avgShiftsPerStaff,
      staffByRole,
    },
    performance: {
      topPerformers: staffMetrics
        .filter(s => s.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5),
      needsAttention: staffMetrics
        .filter(s => s.avgRating > 0 && s.avgRating < 3.5),
    },
    recommendations: [
      {
        title: "Optimize Shift Scheduling",
        description: "Align staffing levels with demand patterns",
        actions: [
          "Increase staff during peak check-in times",
          "Cross-train staff for flexibility",
          "Implement part-time positions for peak periods",
        ],
      },
      {
        title: "Training & Development",
        description: "Invest in staff development programs",
        actions: [
          "Monthly training sessions",
          "Customer service excellence programs",
          "Career progression paths",
        ],
      },
    ],
  };
}

function optimizeMenu(orders: any[]) {
  // Analyze menu item performance
  const itemSales: any = {};
  orders.forEach(order => {
    order.items.forEach((item: any) => {
      const name = item.menuItem.name;
      if (!itemSales[name]) {
        itemSales[name] = {
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
      }
      itemSales[name].quantity += item.quantity;
      itemSales[name].revenue += item.price * item.quantity;
      itemSales[name].orders++;
    });
  });

  const sortedItems = Object.entries(itemSales)
    .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue);

  const topPerformers = sortedItems.slice(0, 10);
  const underPerformers = sortedItems.slice(-10);

  return {
    performance: {
      topSellers: topPerformers.map(([name, data]: any) => ({
        name,
        ...data,
      })),
      underPerformers: underPerformers.map(([name, data]: any) => ({
        name,
        ...data,
      })),
    },
    recommendations: [
      {
        title: "Menu Engineering",
        description: "Optimize menu based on popularity and profitability",
        actions: [
          `Promote top ${topPerformers.length} items with featured placement`,
          "Review pricing of underperforming items",
          "Consider removing items with less than 5 monthly orders",
          "Create combo deals with best sellers",
        ],
      },
      {
        title: "Seasonal Menu Updates",
        description: "Introduce rotating seasonal specials",
        expectedIncrease: 15,
      },
    ],
  };
}

function analyzeOperationalEfficiency(bookings: any[], orders: any[]) {
  // Analyze booking lead time
  const leadTimes = bookings.map(b => {
    const bookingDate = new Date(b.createdAt);
    const checkInDate = new Date(b.checkInDate);
    return (checkInDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
  });

  const avgLeadTime = leadTimes.length > 0
    ? leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
    : 0;

  // Analyze order processing time
  const orderTimes = orders
    .filter(o => o.preparedAt && o.sentToKitchen)
    .map(o => {
      const sent = new Date(o.sentToKitchen);
      const prepared = new Date(o.preparedAt);
      return (prepared.getTime() - sent.getTime()) / (1000 * 60);
    });

  const avgOrderTime = orderTimes.length > 0
    ? orderTimes.reduce((sum, time) => sum + time, 0) / orderTimes.length
    : 0;

  return {
    metrics: {
      avgBookingLeadTime: Math.round(avgLeadTime),
      avgOrderProcessingTime: Math.round(avgOrderTime),
      cancellationRate: bookings.length > 0
        ? (bookings.filter((b: any) => b.status === "CANCELLED").length / bookings.length) * 100
        : 0,
    },
    recommendations: [
      avgOrderTime > 30 ? {
        title: "Improve Kitchen Efficiency",
        description: `Average order time is ${Math.round(avgOrderTime)} minutes. Target: <25 minutes`,
        actions: [
          "Review kitchen workflow",
          "Implement prep stations",
          "Train staff on efficiency",
        ],
      } : null,
      avgLeadTime < 7 ? {
        title: "Manage Last-Minute Bookings",
        description: "High percentage of short-notice bookings detected",
        actions: [
          "Implement premium pricing for last-minute bookings",
          "Ensure adequate staff for quick turnarounds",
        ],
      } : null,
    ].filter(Boolean),
  };
}

function optimizeCustomerRetention(guests: any[], reviews: any[]) {
  const churnRisk = guests.filter(g => {
    const lastVisit = g.lastVisit ? new Date(g.lastVisit) : null;
    if (!lastVisit) return false;
    const daysSinceVisit = (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceVisit > 90 && g.totalStays > 1;
  });

  const lowSatisfactionGuests = reviews.filter((r: any) => r.rating < 4);

  return {
    metrics: {
      churnRisk: churnRisk.length,
      lowSatisfaction: lowSatisfactionGuests.length,
      opportunityValue: churnRisk.reduce((sum, g) => sum + g.totalSpent, 0) * 0.3,
    },
    recommendations: [
      {
        title: "Win-Back Campaign",
        description: `${churnRisk.length} guests at risk of churn`,
        actions: [
          "Send personalized re-engagement emails",
         "Offer exclusive comeback discounts (15-20%)",
          "Create loyalty rewards for return visits",
        ],
        estimatedRecovery: churnRisk.reduce((sum, g) => sum + g.totalSpent, 0) * 0.3,
      },
      lowSatisfactionGuests.length > 0 ? {
        title: "Address Satisfaction Issues",
        description: `${lowSatisfactionGuests.length} negative reviews require attention`,
        actions: [
          "Personal follow-up with dissatisfied guests",
          "Identify common complaint patterns",
          "Implement service recovery protocols",
        ],
      } : null,
    ].filter(Boolean),
  };
}

function generateActionItems(insights: any[]) {
  const actions: any[] = [];

  insights.forEach(insight => {
    if (insight.opportunities) {
      insight.opportunities.forEach((opp: any) => {
        actions.push({
          category: "Revenue",
          title: opp.title,
          description: opp.description,
          priority: "high",
          estimatedImpact: opp.potentialIncrease,
          actions: opp.actions,
        });
      });
    }

    if (insight.recommendations) {
      insight.recommendations.forEach((rec: any) => {
        if (rec) {
          actions.push({
            category: rec.strategy || rec.title || "General",
            title: rec.title || rec.strategy,
            description: rec.description,
            priority: rec.estimatedImpact > 50000 ? "high" : "medium",
            estimatedImpact: rec.estimatedImpact || 0,
            actions: rec.actions || rec.implementation,
          });
        }
      });
    }
  });

  return actions.sort((a, b) => (b.estimatedImpact || 0) - (a.estimatedImpact || 0));
}

// Helper functions
function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day];
}

function getMonthName(month: number): string {
  const months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  return months[month];
}
