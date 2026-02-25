import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

// Default currency configuration
const DEFAULT_CURRENCY = "RWF";

// GET - Financial analytics with RWF as default
export async function GET(req: NextRequest) {
  try {
    // Verify authorization
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "30days"; // 7days, 30days, 90days, year
    const currency = searchParams.get("currency") || DEFAULT_CURRENCY;

    const userRole = (decoded as any)?.role as string;
    const userBranchId = (decoded as any)?.branchId as string;

    // Determine branch filter
    let branchFilter: any = {};
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole) && userBranchId) {
      branchFilter = { branchId: userBranchId };
    } else if (branchId) {
      branchFilter = { branchId };
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Revenue from bookings
    const bookingStats = await prisma.booking.aggregate({
      where: {
        ...branchFilter,
        status: { in: ["confirmed", "checked_in", "checked_out"] },
        createdAt: { gte: startDate },
      },
      _sum: { totalAmount: true },
      _count: true,
      _avg: { totalAmount: true },
    });

    // Revenue from orders
    const orderStats = await prisma.order.aggregate({
      where: {
        ...branchFilter,
        status: { in: ["completed", "served"] },
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    });

    // Total expenses
    const expenseStats = await prisma.expense.aggregate({
      where: {
        ...branchFilter,
        date: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Payments received
    const paymentStats = await prisma.payment.aggregate({
      where: {
        ...branchFilter,
        status: "completed",
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Calculate totals in RWF
    const totalBookingRevenue = Number(bookingStats._sum.totalAmount || 0);
    const totalOrderRevenue = Number(orderStats._sum.total || 0);
    const totalRevenue = totalBookingRevenue + totalOrderRevenue;
    const totalExpenses = Number(expenseStats._sum.amount || 0);
    const totalPayments = Number(paymentStats._sum.amount || 0);
    const netProfit = totalRevenue - totalExpenses;

    // Daily breakdown - using Prisma groupBy for type safety
    const dailyBreakdown = await prisma.booking.groupBy({
      by: ["createdAt"],
      where: {
        ...branchFilter,
        status: { in: ["confirmed", "checked_in", "checked_out"] },
        createdAt: { gte: startDate },
      },
      _sum: { totalAmount: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyRevenue = dailyBreakdown.map(d => ({
      date: new Date(d.createdAt).toISOString().split("T")[0],
      revenue: Number(d._sum.totalAmount || 0),
    }));

    // Payment method breakdown
    const paymentMethods = await prisma.payment.groupBy({
      by: ["paymentMethod"],
      where: {
        ...branchFilter,
        status: "completed",
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    // Format response with RWF currency
    const formatAmount = (amount: number) => ({
      value: amount,
      currency: DEFAULT_CURRENCY,
      formatted: `RWF ${amount.toLocaleString()}`,
    });

    return NextResponse.json({
      success: true,
      currency: {
        code: DEFAULT_CURRENCY,
        symbol: "RWF",
        name: "Rwandan Franc",
      },
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      summary: {
        totalRevenue: formatAmount(totalRevenue),
        bookingRevenue: formatAmount(totalBookingRevenue),
        orderRevenue: formatAmount(totalOrderRevenue),
        totalExpenses: formatAmount(totalExpenses),
        netProfit: formatAmount(netProfit),
        totalPayments: formatAmount(totalPayments),
        outstanding: formatAmount(totalRevenue - totalPayments),
      },
      stats: {
        totalBookings: bookingStats._count || 0,
        totalOrders: orderStats._count || 0,
        averageBookingValue: formatAmount(Number(bookingStats._avg.totalAmount || 0)),
        averageOrderValue: formatAmount(Number(orderStats._avg.total || 0)),
        totalExpenses: expenseStats._count || 0,
      },
      paymentMethods: paymentMethods.map(pm => ({
        method: pm.paymentMethod,
        count: pm._count,
        amount: formatAmount(Number(pm._sum.amount || 0)),
      })),
      dailyRevenue,
    });
  } catch (error) {
    console.error("Financial analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial analytics" },
      { status: 500 }
    );
  }
}
