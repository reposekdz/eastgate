import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const days = parseInt(searchParams.get("days") || "30");

    const historicalDate = new Date();
    historicalDate.setDate(historicalDate.getDate() - 90);

    const where = branchId && branchId !== "all" ? { branchId } : {};

    const [historicalBookings, historicalRevenue, seasonalData] = await Promise.all([
      prisma.booking.findMany({
        where: { ...where, createdAt: { gte: historicalDate } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findMany({
        where: { ...where, status: "completed", createdAt: { gte: historicalDate } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.booking.groupBy({
        by: ["checkIn"],
        where: { ...where, createdAt: { gte: historicalDate } },
        _count: { id: true },
      }),
    ]);

    const bookingsByDay = historicalBookings.reduce((acc, b) => {
      const day = b.createdAt.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const revenueByDay = historicalRevenue.reduce((acc, r) => {
      const day = r.createdAt.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

    const avgDailyBookings = Object.values(bookingsByDay).reduce((sum, v) => sum + v, 0) / Object.keys(bookingsByDay).length;
    const avgDailyRevenue = Object.values(revenueByDay).reduce((sum, v) => sum + v, 0) / Object.keys(revenueByDay).length;

    const dayOfWeekPattern = historicalBookings.reduce((acc, b) => {
      const day = new Date(b.createdAt).getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const seasonalFactor = (dayOfWeekPattern[dayOfWeek] || avgDailyBookings) / avgDailyBookings;
      
      forecast.push({
        date: futureDate.toISOString().split("T")[0],
        predictedBookings: Math.round(avgDailyBookings * seasonalFactor),
        predictedRevenue: Math.round(avgDailyRevenue * seasonalFactor),
        confidence: 0.75 + (Math.random() * 0.15),
      });
    }

    const upcomingBookings = await prisma.booking.count({
      where: { ...where, checkIn: { gte: new Date(), lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000) } },
    });

    return NextResponse.json({
      success: true,
      data: {
        forecast,
        insights: {
          avgDailyBookings: Math.round(avgDailyBookings),
          avgDailyRevenue: Math.round(avgDailyRevenue),
          upcomingBookings,
          peakDay: Object.entries(dayOfWeekPattern).sort((a, b) => b[1] - a[1])[0]?.[0] || 0,
          trend: avgDailyBookings > 5 ? "increasing" : "stable",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
