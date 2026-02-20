import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "30d";

    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = branchId && branchId !== "all" ? { branchId } : {};

    const [payments, orders, events, services] = await Promise.all([
      prisma.payment.groupBy({
        by: ["createdAt"],
        where: { ...where, status: "completed", createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.order.groupBy({
        by: ["createdAt"],
        where: { ...where, status: "completed", createdAt: { gte: startDate } },
        _sum: { totalAmount: true },
      }),
      prisma.event.groupBy({
        by: ["createdAt"],
        where: { ...where, status: "completed", createdAt: { gte: startDate } },
        _sum: { totalCost: true },
      }),
      prisma.service.groupBy({
        by: ["createdAt"],
        where: { ...where, status: "completed", createdAt: { gte: startDate } },
        _sum: { cost: true },
      }),
    ]);

    const revenueByDay = new Map<string, number>();
    
    payments.forEach(p => {
      const day = p.createdAt.toISOString().split("T")[0];
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + (p._sum.amount || 0));
    });
    
    orders.forEach(o => {
      const day = o.createdAt.toISOString().split("T")[0];
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + (o._sum.totalAmount || 0));
    });
    
    events.forEach(e => {
      const day = e.createdAt.toISOString().split("T")[0];
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + (e._sum.totalCost || 0));
    });
    
    services.forEach(s => {
      const day = s.createdAt.toISOString().split("T")[0];
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + (s._sum.cost || 0));
    });

    const chartData = Array.from(revenueByDay.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ success: true, data: chartData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
