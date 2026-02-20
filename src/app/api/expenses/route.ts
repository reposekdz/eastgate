import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";
    const category = searchParams.get("category");

    let query = "SELECT * FROM expenses WHERE branch_id = ?";
    const params: any[] = [branchId];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY date DESC LIMIT 100";

    const expenses: any = await prisma.$queryRawUnsafe(query, ...params);

    // Get category totals
    const byCategory: any = await prisma.$queryRaw`
      SELECT category, COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE branch_id = ${branchId}
      GROUP BY category
    `;

    return NextResponse.json({
      success: true,
      expenses: expenses || [],
      byCategory: (byCategory as any[]).map((c: any) => ({
        category: c.category,
        total: Number(c.total || 0),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, amount, description, date, branchId = "br-001" } = body;

    if (!category || !amount || !date) {
      return NextResponse.json(
        { success: false, error: "Category, amount, and date are required" },
        { status: 400 }
      );
    }

    const id = `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await prisma.$executeRaw`
      INSERT INTO expenses (id, category, amount, description, date, branch_id, created_at, updated_at)
      VALUES (${id}, ${category}, ${amount}, ${description || null}, ${date}, ${branchId}, NOW(), NOW())
    `;

    return NextResponse.json({
      success: true,
      message: "Expense created",
      id,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
