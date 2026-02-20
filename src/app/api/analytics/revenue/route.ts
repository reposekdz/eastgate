import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";
    const period = parseInt(searchParams.get("period") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get revenue using raw SQL
    const payments: any = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM payments 
      WHERE branch_id = ${branchId} 
        AND status = 'completed'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
    `;

    const orders: any = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM orders 
      WHERE branch_id = ${branchId} 
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
    `;

    const events: any = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(*) as count,
        DATE(date) as date
      FROM events 
      WHERE branch_id = ${branchId} 
        AND date >= ${startDate}
      GROUP BY DATE(date)
    `;

    // Format revenue data
    const revenueData = (payments as any[]).map((p: any) => ({
      date: p.date,
      rooms: Number(p.total || 0),
      restaurant: 0,
      events: 0,
      spa: 0,
    }));

    return NextResponse.json({
      success: true,
      data: revenueData,
      summary: {
        totalRevenue: revenueData.reduce((sum, r) => sum + r.rooms, 0),
        totalOrders: (orders as any[]).reduce((sum, o) => sum + Number(o.count || 0), 0),
        totalEvents: (events as any[]).reduce((sum, e) => sum + Number(e.count || 0), 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
