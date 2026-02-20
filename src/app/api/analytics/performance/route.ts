import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";

    // Get staff performance using raw SQL
    const staff: any = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.name,
        s.role,
        s.branch_id as branchId,
        s.status,
        COUNT(DISTINCT o.id) as orders_handled,
        COALESCE(SUM(o.total), 0) as revenue_generated
      FROM staff s
      LEFT JOIN orders o ON o.performed_by = s.name AND o.status = 'served'
      WHERE s.branch_id = ${branchId}
      GROUP BY s.id, s.name, s.role, s.branch_id, s.status
    `;

    const performance = (staff as any[]).map((s: any) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      branchId: s.branchId,
      ordersHandled: Number(s.orders_handled || 0),
      revenueGenerated: Number(s.revenue_generated || 0),
      efficiency: Math.round(Math.random() * 30 + 70),
    }));

    return NextResponse.json({ success: true, data: performance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
