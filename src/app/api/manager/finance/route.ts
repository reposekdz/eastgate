import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/finance - Get financial analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily"; // daily, weekly, monthly, yearly
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Determine branch access
    let branchFilter: any = {};
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      if (branchId) branchFilter = { id: branchId };
      else if (userBranchId) branchFilter = { id: userBranchId };
    } else {
      branchFilter = { id: userBranchId };
    }

    // Date range calculation
    const now = new Date();
    let dateFilter: any = {};
    
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      switch (period) {
        case "daily":
          dateFilter = {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(now.setHours(23, 59, 59, 999)),
          };
          break;
        case "weekly":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          dateFilter = { gte: weekStart };
          break;
        case "monthly":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { gte: monthStart };
          break;
        case "yearly":
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter = { gte: yearStart };
          break;
      }
    }

    // Get branches
    const branches = await prisma.branch.findMany({
      where: branchFilter.id ? branchFilter : {},
      select: { id: true, name: true },
    });

    const branchIds = branches.map(b => b.id);

    // Get income from various sources
    const [roomBookings, restaurantOrders, events, services, payments] = await Promise.all([
      // Room revenue (completed bookings)
      prisma.booking.aggregate({
        where: {
          branchId: { in: branchIds },
          status: "CHECKED_OUT",
          createdAt: dateFilter,
        },
        _sum: { finalAmount: true },
        _count: true,
      }),
      
      // Restaurant orders revenue
      prisma.order.aggregate({
        where: {
          branchId: { in: branchIds },
          status: "COMPLETED",
          createdAt: dateFilter,
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      
      // Event revenue
      prisma.event.aggregate({
        where: {
          branchId: { in: branchIds },
          status: "COMPLETED",
          createdAt: dateFilter,
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      
      // Spa/Service revenue
      prisma.service.aggregate({
        where: {
          branchId: { in: branchIds },
          status: "COMPLETED",
          createdAt: dateFilter,
        },
        _sum: { price: true },
        _count: true,
      }),
      
      // All payments received
      prisma.payment.aggregate({
        where: {
          branchId: { in: branchIds },
          status: "PAID",
          createdAt: dateFilter,
        },
        _sum: { amount: true },
      }),
    ]);

    // Get expenses
    const expenses = await prisma.expense.aggregate({
      where: {
        branchId: { in: branchIds },
        status: "PAID",
        paidDate: dateFilter,
      },
      _sum: { amount: true },
      _groupBy: ["category"],
    });

    // Get expenses by category
    const expenseByCategory = await prisma.expense.groupBy({
      by: ["category"],
      where: {
        branchId: { in: branchIds },
        status: "PAID",
        paidDate: dateFilter,
      },
      _sum: { amount: true },
    });

    // Calculate totals
    const totalIncome = 
      (roomBookings._sum.finalAmount || 0) +
      (restaurantOrders._sum.totalAmount || 0) +
      (events._sum.totalAmount || 0) +
      (services._sum.price || 0);

    const totalExpenses = expenseByCategory.reduce(
      (sum, cat) => sum + (cat._sum.amount || 0),
      0
    );

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Get recent transactions
    const recentTransactions = await Promise.all([
      // Recent bookings
      prisma.booking.findMany({
        where: {
          branchId: { in: branchIds },
          createdAt: dateFilter,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          bookingNumber: true,
          finalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      
      // Recent expenses
      prisma.expense.findMany({
        where: {
          branchId: { in: branchIds },
          createdAt: dateFilter,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          description: true,
          amount: true,
          category: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Get daily breakdown for charts
    const dailyData = await getDailyFinancialData(branchIds, dateFilter);

    return NextResponse.json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        roomRevenue: roomBookings._sum.finalAmount || 0,
        restaurantRevenue: restaurantOrders._sum.totalAmount || 0,
        eventRevenue: events._sum.totalAmount || 0,
        spaRevenue: services._sum.price || 0,
        paymentReceived: payments._sum.amount || 0,
      },
      expensesByCategory: expenseByCategory.map(cat => ({
        category: cat.category,
        amount: cat._sum.amount || 0,
      })),
      recentTransactions: {
        bookings: recentTransactions[0],
        expenses: recentTransactions[1],
      },
      dailyData,
      branches,
      period,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error("Get finance error:", error);
    return NextResponse.json({ error: "Failed to get financial data" }, { status: 500 });
  }
}

// POST /api/manager/finance - Create expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "ACCOUNTANT"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      category,
      subCategory,
      description,
      amount,
      currency,
      paymentMethod,
      reference,
      expenseDate,
      dueDate,
      vendorName,
      vendorId,
      isRecurring,
      recurringPeriod,
      notes,
    } = body;

    if (!category || !description || !amount) {
      return NextResponse.json(
        { error: "Category, description, and amount are required" },
        { status: 400 }
      );
    }

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || userBranchId;
    }

    if (!branchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        category: category.toUpperCase(),
        subCategory: subCategory || "",
        description,
        amount: parseFloat(amount),
        currency: currency || "RWF",
        paymentMethod,
        reference,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        vendorName,
        vendorId,
        status: "PENDING",
        isRecurring: isRecurring || false,
        recurringPeriod,
        notes,
        branchId,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// PUT /api/manager/finance - Update expense
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "ACCOUNTANT"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      expenseId,
      status,
      approvedBy,
      paidDate,
      receiptUrl,
    } = body;

    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID required" }, { status: 400 });
    }

    // Get existing expense
    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Update expense
    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    if (paidDate) {
      updateData.paidDate = new Date(paidDate);
      updateData.status = "PAID";
    }
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
    });

    // Create notification for approval
    if (status === "APPROVED" || status === "PAID") {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "SYSTEM",
          title: "Expense Updated",
          message: `Expense "${existing.description}" has been ${status.toLowerCase()}`,
          read: false,
        },
      });
    }

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// Helper function to get daily financial data
async function getDailyFinancialData(branchIds: string[], dateFilter: any) {
  // Try to get from DailyFinancial model first
  let dailyFinancials = await prisma.dailyFinancial.findMany({
    where: {
      branchId: { in: branchIds },
      date: dateFilter.gte ? { gte: dateFilter.gte } : undefined,
    },
    orderBy: { date: "asc" },
    take: 30,
  });

  // If no data, calculate from transactions
  if (dailyFinancials.length === 0) {
    const bookings = await prisma.booking.groupBy({
      by: ["createdAt"],
      where: {
        branchId: { in: branchIds },
        status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
        createdAt: dateFilter.gte ? { gte: dateFilter.gte } : undefined,
      },
      _sum: { finalAmount: true },
    });

    const expenses = await prisma.expense.groupBy({
      by: ["expenseDate"],
      where: {
        branchId: { in: branchIds },
        status: "PAID",
        paidDate: dateFilter.gte ? { gte: dateFilter.gte } : undefined,
      },
      _sum: { amount: true },
    });

    dailyFinancials = [
      ...bookings.map(b => ({
        date: b.createdAt,
        totalIncome: b._sum.finalAmount || 0,
        totalExpense: 0,
      })),
      ...expenses.map(e => ({
        date: e.expenseDate,
        totalIncome: 0,
        totalExpense: e._sum.amount || 0,
      })),
    ];
  }

  return dailyFinancials.map(d => ({
    date: d.date,
    dateString: d.dateString || d.date.toISOString().split("T")[0],
    income: d.totalIncome || 0,
    expense: d.totalExpense || 0,
    profit: (d.totalIncome || 0) - (d.totalExpense || 0),
  }));
}
