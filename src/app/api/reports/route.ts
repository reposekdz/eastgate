import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const type = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const targetDate = new Date(date);
    const startDate = new Date(targetDate);
    const endDate = new Date(targetDate);

    if (type === "weekly") {
      startDate.setDate(targetDate.getDate() - 7);
    } else if (type === "monthly") {
      startDate.setMonth(targetDate.getMonth() - 1);
    } else if (type === "yearly") {
      startDate.setFullYear(targetDate.getFullYear() - 1);
    }

    const where = branchId && branchId !== "all" ? { branchId } : {};
    const dateFilter = { gte: startDate, lte: endDate };

    const [bookings, payments, orders, services, expenses, rooms] = await Promise.all([
      prisma.booking.findMany({
        where: { ...where, createdAt: dateFilter },
        include: { guest: true, room: true },
      }),
      prisma.payment.findMany({
        where: { ...where, createdAt: dateFilter, status: "completed" },
      }),
      prisma.order.findMany({
        where: { ...where, createdAt: dateFilter },
        include: { items: true },
      }),
      prisma.service.findMany({
        where: { ...where, createdAt: dateFilter },
      }),
      prisma.expense.findMany({
        where: { ...where, date: dateFilter },
      }),
      prisma.room.findMany({ where }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const occupancyRate = rooms.length > 0 ? (rooms.filter(r => r.status === "occupied").length / rooms.length) * 100 : 0;

    const report = {
      type,
      period: { start: startDate, end: endDate },
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
        occupancyRate: occupancyRate.toFixed(2),
        totalBookings: bookings.length,
        totalOrders: orders.length,
        totalServices: services.length,
      },
      bookings: {
        total: bookings.length,
        confirmed: bookings.filter(b => b.status === "confirmed").length,
        checkedIn: bookings.filter(b => b.status === "checked_in").length,
        checkedOut: bookings.filter(b => b.status === "checked_out").length,
        cancelled: bookings.filter(b => b.status === "cancelled").length,
      },
      revenue: {
        rooms: payments.filter(p => p.method === "room_charge").reduce((sum, p) => sum + p.amount, 0),
        restaurant: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        services: services.reduce((sum, s) => sum + s.cost, 0),
      },
      topGuests: bookings
        .reduce((acc, b) => {
          const existing = acc.find(g => g.guestId === b.guestId);
          if (existing) {
            existing.bookings++;
            existing.spent += b.totalAmount;
          } else {
            acc.push({ guestId: b.guestId, name: b.guest.name, bookings: 1, spent: b.totalAmount });
          }
          return acc;
        }, [] as any[])
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 10),
    };

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
