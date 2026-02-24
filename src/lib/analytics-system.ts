/**
 * Advanced Analytics & Reporting System
 * Real-time dashboards, forecasting, and performance metrics
 */

import prisma from "@/lib/prisma";

// ============================================
// ANALYTICS INTERFACES
// ============================================

export interface DashboardMetrics {
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancellations: number;
  };
  occupancy: {
    rate: number;
    availableRooms: number;
    occupiedRooms: number;
    totalRooms: number;
  };
  guests: {
    total: number;
    newGuests: number;
    returningGuests: number;
    vipGuests: number;
  };
  operations: {
    averageOrderValue: number;
    completedOrders: number;
    averageServiceTime: number;
    customerSatisfaction: number;
  };
}

export interface FinancialReport {
  period: string;
  revenue: {
    accommodation: number;
    food_beverage: number;
    services: number;
    events: number;
    total: number;
  };
  expenses: {
    salaries: number;
    utilities: number;
    maintenance: number;
    supplies: number;
    other: number;
    total: number;
  };
  profit: number;
  profitMargin: number;
}

export interface GuestAnalytics {
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  avgStayDuration: number;
  avgSpendPerGuest: number;
  loyaltyDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  topSourceMarkets: Array<{ country: string; count: number }>;
  satisfaction: number;
}

export interface PerformanceMetrics {
  roomRevenue: number;
  restaurantRevenue: number;
  avgRoomPrice: number;
  occupancyRate: number;
  revenu per Available Room: number; // RevPAR
  bookingConversionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

// ============================================
// DASHBOARD METRICS
// ============================================

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<DashboardMetrics> {
  try {
    // Get revenue data
    const revenue = await getRevenue(branchId, dateRange);

    // Get booking data
    const bookings = await getBookingMetrics(branchId, dateRange);

    // Get occupancy data
    const occupancy = await getOccupancyMetrics(branchId, dateRange);

    // Get guest data
    const guests = await getGuestMetrics(branchId, dateRange);

    // Get operational metrics
    const operations = await getOperationalMetrics(branchId, dateRange);

    return {
      revenue,
      bookings,
      occupancy,
      guests,
      operations,
    };
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    throw error;
  }
}

/**
 * Get revenue metrics
 */
async function getRevenue(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<DashboardMetrics["revenue"]> {
  try {
    // Get payments for the range
    // TODO: Implement with actual payment records
    const today = new Date();
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Placeholder calculations
    const todayRevenue = 0;
    const weekRevenue = 0;
    const monthRevenue = 0;

    return {
      today: todayRevenue,
      week: weekRevenue,
      month: monthRevenue,
      trend: monthRevenue > 0 ? ((todayRevenue - monthRevenue / 30) / (monthRevenue / 30)) * 100 : 0,
    };
  } catch (error) {
    console.error("Revenue metrics error:", error);
    throw error;
  }
}

/**
 * Get booking metrics
 */
async function getBookingMetrics(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<DashboardMetrics["bookings"]> {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        branchId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;

    return {
      total: bookings.length,
      confirmed,
      pending,
      cancellations: cancelled,
    };
  } catch (error) {
    console.error("Booking metrics error:", error);
    throw error;
  }
}

/**
 * Get occupancy metrics
 */
async function getOccupancyMetrics(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<DashboardMetrics["occupancy"]> {
  try {
    const totalRooms = await prisma.room.count({
      where: { branchId },
    });

    const occupiedRooms = await prisma.booking.count({
      where: {
        branchId,
        status: {
          in: ["checked_in"],
        },
        checkInDate: {
          lte: new Date(dateRange.end),
        },
        checkOutDate: {
          gte: new Date(dateRange.start),
        },
      },
    });

    const availableRooms = totalRooms - occupiedRooms;
    const rate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    return {
      rate,
      occupiedRooms,
      availableRooms,
      totalRooms,
    };
  } catch (error) {
    console.error("Occupancy metrics error:", error);
    throw error;
  }
}

/**
 * Get guest metrics
 */
async function getGuestMetrics(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<DashboardMetrics["guests"]> {
  try {
    const guests = await prisma.guest.findMany({
      where: {
        branchId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const newGuests = guests.length;

    // Count returning guests from bookings
    const returningGuests = await prisma.guest.count({
      where: {
        branchId,
        totalStays: {
          gt: 1,
        },
      },
    });

    const vipGuests = guests.filter((g) => g.isVip).length;
    const totalGuests = await prisma.guest.count({
      where: { branchId },
    });

    return {
      total: totalGuests,
      newGuests,
      returningGuests,
      vipGuests,
    };
  } catch (error) {
    console.error("Guest metrics error:", error);
    throw error;
  }
}

/**
 * Get operational metrics
 */
async function getOperationalMetrics(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<DashboardMetrics["operations"]> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        branchId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue =
      completedOrders > 0 ? totalValue / completedOrders : 0;

    // Placeholder for service time and satisfaction
    const averageServiceTime = 25; // minutes
    const customerSatisfaction = 4.5; // out of 5

    return {
      averageOrderValue,
      completedOrders,
      averageServiceTime,
      customerSatisfaction,
    };
  } catch (error) {
    console.error("Operational metrics error:", error);
    throw error;
  }
}

// ============================================
// FINANCIAL REPORTING
// ============================================

/**
 * Generate financial report
 */
export async function generateFinancialReport(
  branchId: string,
  period: "daily" | "weekly" | "monthly" | "yearly",
  date: Date
): Promise<FinancialReport> {
  try {
    const dateRange = getDateRange(period, date);

    // Get revenue by category
    const revenue = await getRevenueByCategory(branchId, dateRange);

    // Get expenses by category
    const expenses = await getExpensesByCategory(branchId, dateRange);

    const totalRevenue = Object.values(revenue).reduce((sum, v) => sum + v, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, v) => sum + v, 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      period: `${period}-${date.toISOString().split("T")[0]}`,
      revenue: {
        ...revenue,
        total: totalRevenue,
      } as any,
      expenses: {
        ...expenses,
        total: totalExpenses,
      } as any,
      profit,
      profitMargin,
    };
  } catch (error) {
    console.error("Financial report generation error:", error);
    throw error;
  }
}

/**
 * Get revenue by category
 */
async function getRevenueByCategory(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<Record<string, number>> {
  // TODO: Implement detailed revenue categorization
  return {
    accommodation: 0,
    food_beverage: 0,
    services: 0,
    events: 0,
  };
}

/**
 * Get expenses by category
 */
async function getExpensesByCategory(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<Record<string, number>> {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        branchId,
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    const byCategory: Record<string, number> = {
      salaries: 0,
      utilities: 0,
      maintenance: 0,
      supplies: 0,
      other: 0,
    };

    expenses.forEach((expense) => {
      const category = expense.category as keyof typeof byCategory;
      if (category in byCategory) {
        byCategory[category] += expense.amount;
      } else {
        byCategory.other += expense.amount;
      }
    });

    return byCategory;
  } catch (error) {
    console.error("Expense categorization error:", error);
    throw error;
  }
}

// ============================================
// GUEST ANALYTICS
// ============================================

/**
 * Get detailed guest analytics
 */
export async function getGuestAnalytics(
  branchId: string,
  dateRange: { start: Date; end: Date }
): Promise<GuestAnalytics> {
  try {
    const guests = await prisma.guest.findMany({
      where: { branchId },
    });

    const newGuests = guests.filter(
      (g) =>
        g.createdAt >= dateRange.start &&
        g.createdAt <= dateRange.end
    ).length;

    const totalSpent = guests.reduce((sum, g) => sum + g.totalSpent, 0);
    const avgSpendPerGuest = guests.length > 0 ? totalSpent / guests.length : 0;

    // Count by loyalty tier
    const loyaltyDistribution = {
      bronze: guests.filter((g) => g.loyaltyTier === "bronze").length,
      silver: guests.filter((g) => g.loyaltyTier === "silver").length,
      gold: guests.filter((g) => g.loyaltyTier === "gold").length,
      platinum: guests.filter((g) => g.loyaltyTier === "platinum").length,
    };

    // Get top countries
    const countryMap: Record<string, number> = {};
    guests.forEach((g) => {
      if (g.country) {
        countryMap[g.country] = (countryMap[g.country] || 0) + 1;
      }
    });

    const topSourceMarkets = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Calculate average stay duration
    const bookings = await prisma.booking.findMany({
      where: {
        branchId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    let totalNights = 0;
    bookings.forEach((b) => {
      const nights = Math.ceil(
        (b.checkOutDate.getTime() - b.checkInDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      totalNights += nights;
    });

    const avgStayDuration =
      bookings.length > 0 ? totalNights / bookings.length : 0;

    return {
      totalGuests: guests.length,
      newGuests,
      returningGuests: guests.filter((g) => g.totalStays > 1).length,
      avgStayDuration,
      avgSpendPerGuest,
      loyaltyDistribution,
      topSourceMarkets,
      satisfaction: 4.5, // Placeholder
    };
  } catch (error) {
    console.error("Guest analytics error:", error);
    throw error;
  }
}

// ============================================
// FORECASTING
// ============================================

/**
 * Forecast revenue
 */
export async function forecastRevenue(
  branchId: string,
  daysAhead: number = 30
): Promise<Array<{ date: Date; forecast: number; confidence: number }>> {
  try {
    // TODO: Implement ML-based forecasting
    // For now, return dummy data
    const forecast: Array<{ date: Date; forecast: number; confidence: number }> = [];

    for (let i = 0; i < daysAhead; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date,
        forecast: Math.random() * 10000,
        confidence: 0.85,
      });
    }

    return forecast;
  } catch (error) {
    console.error("Revenue forecasting error:", error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get date range for period
 */
function getDateRange(
  period: "daily" | "weekly" | "monthly" | "yearly",
  date: Date
): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yearly":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}
