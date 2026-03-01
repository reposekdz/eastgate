import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [rooms, bookings, guests] = await Promise.all([
      prisma.room.findMany({ where: { branchId: branchId || undefined } }),
      prisma.booking.findMany({
        where: {
          branchId: branchId || undefined,
          checkIn: { gte: today },
        },
      }),
      prisma.guest.findMany({ where: { branchId: branchId || undefined } }),
    ]);

    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
    const availableRooms = rooms.filter((r) => r.status === "available").length;
    const cleaningRooms = rooms.filter((r) => r.status === "cleaning").length;
    const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length;
    const reservedRooms = rooms.filter((r) => r.status === "reserved").length;

    const stats = {
      activeGuests: bookings.filter((b) => b.status === "checked_in").length,
      expectedArrivals: bookings.filter((b) => b.status === "confirmed").length,
      checkOuts: bookings.filter((b) => b.status === "checked_out" && b.checkedOutAt && b.checkedOutAt >= today).length,
      availableRooms,
      cleaningRooms,
      maintenanceRooms,
      occupancyRate: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0,
      totalRooms: rooms.length,
      occupiedRooms,
      reservedRooms,
      branchId,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}