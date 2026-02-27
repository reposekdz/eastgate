import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

/**
 * GET /api/manager/revenue
 * Fetch revenue data with filtering by date range
 * Managers see their branch data, Super Admin sees all
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

    // Check permissions
    if (!["SUPER_ADMIN", "manager", "senior_manager", "super_manager"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentType = searchParams.get("paymentType");

    // Set date range (default last 30 days)
    let start = new Date();
    start.setDate(start.getDate() - 30);
    let end = new Date();

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    // Determine which branch(es) to query
    const queryBranchIds: string[] = [];

    if (session.role === "manager") {
      // Manager can only see their assigned branch
      queryBranchIds.push(session.branchId || "");
    } else if (session.role === "super_manager") {
      // Super manager sees all assigned branches
      const assignments = await prisma.managerAssignment.findMany({
        where: { managerId: session.id, isActive: true },
        select: { branchId: true },
      });
      queryBranchIds.push(...assignments.map((a) => a.branchId));
    } else if (session.role === "SUPER_ADMIN") {
      // Super admin can filter by branch or see all
      if (branchId) {
        queryBranchIds.push(branchId);
      } else {
        const branches = await prisma.branch.findMany({
          select: { id: true },
        });
        queryBranchIds.push(...branches.map((b) => b.id));
      }
    }

    if (queryBranchIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            totalRevenue: 0,
            totalPayments: 0,
            averagePayment: 0,
            paymentBreakdown: {},
            dailyRevenue: [],
            topPaymentMethods: [],
            revenueByType: {},
          },
        },
        { status: 200 }
      );
    }

    // Get payments within date range
    const where: any = {
      branchId: { in: queryBranchIds },
      status: "completed",
      createdAt: { gte: start, lte: end },
    };

    if (paymentType) {
      where.paymentType = paymentType;
    }

    // Fetch payment data
    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        paymentType: true,
        status: true,
        createdAt: true,
        branchId: true,
        guestName: true,
      },
    });

    // Calculate aggregates
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = payments.length;
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

    // Payment method breakdown
    const paymentMethods = new Map<string, { count: number; amount: number }>();
    payments.forEach((p) => {
      const method = p.paymentMethod || "unknown";
      const current = paymentMethods.get(method) || {
        count: 0,
        amount: 0,
      };
      paymentMethods.set(method, {
        count: current.count + 1,
        amount: current.amount + p.amount,
      });
    });

    // Payment type breakdown
    const revenuByType = new Map<string, { count: number; amount: number }>();
    payments.forEach((p) => {
      const type = p.paymentType || "other";
      const current = revenuByType.get(type) || {
        count: 0,
        amount: 0,
      };
      revenuByType.set(type, {
        count: current.count + 1,
        amount: current.amount + p.amount,
      });
    });

    // Daily revenue breakdown
    const dailyMap = new Map<string, number>();
    payments.forEach((p) => {
      const dateKey = new Date(p.createdAt).toISOString().split("T")[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + p.amount);
    });

    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get branch details if needed
    const branches = await prisma.branch.findMany({
      where: { id: { in: queryBranchIds } },
      select: {
        id: true,
        name: true,
        currency: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          totalRevenue,
          totalPayments,
          averagePayment: parseFloat(averagePayment.toFixed(2)),
          currency: branches[0]?.currency || "RWF",
          paymentMethodBreakdown: Object.fromEntries(paymentMethods),
          paymentTypeBreakdown: Object.fromEntries(revenuByType),
          dailyRevenue,
          branches: branches.map((b) => ({
            id: b.id,
            name: b.name,
          })),
          dateRange: {
            start: start.toISOString().split("T")[0],
            end: end.toISOString().split("T")[0],
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Revenue fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch revenue data",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/manager/revenue/summary
 * Get quick revenue summary
 */
export async function getSummary(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || !session.branchId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Today's revenue
    const todayRevenue = await prisma.payment.aggregate({
      where: {
        branchId: session.branchId,
        status: "completed",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
      _count: true,
    });

    // This month's revenue
    const monthRevenue = await prisma.payment.aggregate({
      where: {
        branchId: session.branchId,
        status: "completed",
        createdAt: { gte: thisMonth },
      },
      _sum: { amount: true },
      _count: true,
    });

    // This year's revenue
    const yearRevenue = await prisma.payment.aggregate({
      where: {
        branchId: session.branchId,
        status: "completed",
        createdAt: { gte: thisYear },
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          today: {
            revenue: todayRevenue._sum.amount || 0,
            transactions: todayRevenue._count,
          },
          thisMonth: {
            revenue: monthRevenue._sum.amount || 0,
            transactions: monthRevenue._count,
          },
          thisYear: {
            revenue: yearRevenue._sum.amount || 0,
            transactions: yearRevenue._count,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Revenue summary error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch revenue summary",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/manager/revenue/reports
 * Generate advanced revenue reports
 */
export async function generateReports(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || !session.branchId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "daily"; // daily, weekly, monthly

    const now = new Date();
    let startDate = new Date();

    if (reportType === "daily") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (reportType === "weekly") {
      startDate.setDate(startDate.getDate() - 90);
    } else if (reportType === "monthly") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const payments = await prisma.payment.findMany({
      where: {
        branchId: session.branchId,
        status: "completed",
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        paymentType: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    // Group data by time period
    const grouped = new Map<string, any>();

    payments.forEach((p) => {
      let key = "";
      const date = new Date(p.createdAt);

      if (reportType === "daily") {
        key = date.toISOString().split("T")[0];
      } else if (reportType === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else if (reportType === "monthly") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          total: 0,
          count: 0,
          byType: {},
          byMethod: {},
        });
      }

      const entry = grouped.get(key);
      entry.total += p.amount;
      entry.count += 1;

      const typeKey = p.paymentType || "unknown";
      entry.byType[typeKey] = (entry.byType[typeKey] || 0) + p.amount;

      const methodKey = p.paymentMethod || "unknown";
      entry.byMethod[methodKey] = (entry.byMethod[methodKey] || 0) + p.amount;
    });

    const report = Array.from(grouped.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          reportType,
          report,
          totalRevenue: report.reduce((sum, r) => sum + r.total, 0),
          totalTransactions: report.reduce((sum, r) => sum + r.count, 0),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate report",
      },
      { status: 500 }
    );
  }
}
