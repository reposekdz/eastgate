import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (branchId && branchId !== "all") where.branchId = branchId;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { branch: { select: { name: true } }, approvedBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });

    const byCategory = await prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
      _count: { category: true },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingApproval = expenses.filter(e => e.status === "pending").length;

    return NextResponse.json({
      success: true,
      data: expenses,
      summary: {
        total: totalExpenses,
        pendingApproval,
        byCategory: byCategory.map(c => ({
          category: c.category,
          total: c._sum.amount || 0,
          count: c._count.category,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchId, category, amount, description, vendor, paymentMethod, userId } = body;

    const expense = await prisma.expense.create({
      data: {
        branchId,
        category,
        amount,
        description,
        vendor,
        paymentMethod,
        date: new Date(),
        status: "pending",
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        branchId,
        type: "expense_approval",
        title: "New Expense Submitted",
        message: `${category} expense of RWF ${amount.toLocaleString()} requires approval`,
        priority: "medium",
        metadata: { expenseId: expense.id },
      },
    });

    return NextResponse.json({ success: true, data: expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, approvedById } = body;

    const expense = await prisma.expense.update({
      where: { id },
      data: { status, approvedById, approvedAt: status === "approved" ? new Date() : null },
    });

    return NextResponse.json({ success: true, data: expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
