import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();
    const branchId = searchParams.get("branchId");

    const where: any = {
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
    };
    if (branchId) where.room = { branchId };

    const [bookings, orders, payments] = await Promise.all([
      prisma.booking.findMany({
        where: { ...where, status: "checked_out" },
        select: { paidAmount: true, checkIn: true, checkedOutAt: true, room: { select: { branchId: true, branch: { select: { name: true } } } } },
      }),
      prisma.order.findMany({
        where: { createdAt: where.createdAt, status: "served" },
        select: { total: true, createdAt: true },
      }),
      prisma.payment.findMany({
        where: { createdAt: where.createdAt, status: "completed" },
        select: { amount: true, paymentMethod: true, createdAt: true },
      }),
    ]);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0) + orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const bookingRevenue = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const orderRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const paymentsByMethod = payments.reduce((acc, p) => {
      acc[p.paymentMethod || 'unknown'] = (acc[p.paymentMethod || 'unknown'] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const dailyRevenue = [...bookings.filter(b => b.checkedOutAt).map(b => ({ date: b.checkedOutAt!, amount: b.paidAmount })), ...orders.map(o => ({ date: o.createdAt, amount: o.total }))]
      .reduce((acc, item) => {
        const date = new Date(item.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (item.amount || 0);
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      report: {
        period: { startDate, endDate },
        totalRevenue,
        bookingRevenue,
        orderRevenue,
        totalBookings: bookings.length,
        totalOrders: orders.length,
        paymentsByMethod,
        dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })),
      },
    });
  } catch (error) {
    console.error("Financial report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
