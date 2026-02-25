import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || session.branchId;
    const start = searchParams.get("start") ? new Date(searchParams.get("start")!) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date();

    // Restrict non-super-admins to their branch
    if (session.role !== "SUPER_ADMIN" && session.branchId && session.branchId !== branchId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Total revenue
    const totalRevenue = await prisma.payment.aggregate({
      where: { branchId, status: "completed", createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    // Daily breakdown
    const daily = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, SUM(amount) as total
      FROM payments
      WHERE branchId = ${branchId} AND status = 'completed' AND createdAt BETWEEN ${start} AND ${end}
      GROUP BY DATE(createdAt)
      ORDER BY DATE(createdAt) ASC
    `;

    // Top staff by revenue (via orders -> performedBy)
    const topStaff = await prisma.$queryRaw`
      SELECT s.id, s.name, SUM(p.amount) as total
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN staff s ON o.performed_by = s.id
      WHERE p.branchId = ${branchId} AND p.status = 'completed' AND p.createdAt BETWEEN ${start} AND ${end}
      GROUP BY s.id, s.name
      ORDER BY total DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      data: {
        total: totalRevenue._sum.amount || 0,
        daily,
        topStaff,
      },
    });
  } catch (error: any) {
    console.error("Revenue fetch error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch revenue" }, { status: 500 });
  }
}
