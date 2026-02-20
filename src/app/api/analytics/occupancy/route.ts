import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where = branchId && branchId !== "all" ? { branchId } : {};

    const [totalRooms, occupiedRooms, bookings, revenue] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.count({ where: { ...where, status: "occupied" } }),
      prisma.booking.findMany({
        where: { ...where, status: { in: ["confirmed", "checked_in"] } },
        include: { room: true, guest: true },
        orderBy: { checkIn: "asc" },
      }),
      prisma.payment.aggregate({
        where: { ...where, status: "completed" },
        _sum: { amount: true },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const adr = occupiedRooms > 0 ? (revenue._sum.amount || 0) / occupiedRooms : 0;
    const revpar = totalRooms > 0 ? (revenue._sum.amount || 0) / totalRooms : 0;

    const next7Days = bookings.filter(b => {
      const checkIn = new Date(b.checkIn);
      const now = new Date();
      const diff = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    const forecast = next7Days.reduce((acc, b) => {
      const day = b.checkIn.toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        adr: Math.round(adr),
        revpar: Math.round(revpar),
        forecast: Object.entries(forecast).map(([date, count]) => ({ date, expectedCheckIns: count })),
        upcomingCheckIns: next7Days.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
