import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";

    // Get room stats using raw SQL
    const rooms = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available
      FROM rooms WHERE branch_id = ${branchId}
    ` as any[];

    // Get bookings
    const bookings = await prisma.$queryRaw`
      SELECT * FROM bookings 
      WHERE branch_id = ${branchId} 
        AND (status = 'confirmed' OR status = 'checked_in')
      ORDER BY check_in ASC
      LIMIT 20
    ` as any[];

    // Get revenue
    const revenue = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments 
      WHERE branch_id = ${branchId} AND status = 'completed'
    ` as any[];

    const totalRooms = Number(rooms[0]?.total || 0);
    const occupiedRooms = Number(rooms[0]?.occupied || 0);
    const revenueAmount = Number(revenue[0]?.total || 0);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const adr = occupiedRooms > 0 ? revenueAmount / occupiedRooms : 0;
    const revpar = totalRooms > 0 ? revenueAmount / totalRooms : 0;

    // Forecast for next 7 days
    const next7Days = bookings.filter((b: any) => {
      const checkIn = new Date(b.check_in);
      const now = new Date();
      const diff = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });

    const forecast: Record<string, number> = {};
    next7Days.forEach((b: any) => {
      const day = b.check_in.toISOString().split("T")[0];
      forecast[day] = (forecast[day] || 0) + 1;
    });

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
