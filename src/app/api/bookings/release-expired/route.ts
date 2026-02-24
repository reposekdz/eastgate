import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Release expired bookings
export async function POST(req: NextRequest) {
  try {
    const now = new Date();

    // Find all bookings that have passed checkout date but still marked as checked_in or confirmed
    const expiredBookings = await prisma.booking.findMany({
      where: {
        checkOut: { lt: now },
        status: { in: ["confirmed", "checked_in"] },
      },
      select: { id: true, roomId: true },
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired bookings found",
        released: 0,
      });
    }

    // Update bookings to checked_out
    await prisma.booking.updateMany({
      where: {
        id: { in: expiredBookings.map((b) => b.id) },
      },
      data: { status: "checked_out", checkedOutAt: now },
    });

    // Update rooms to available
    const roomIds = [...new Set(expiredBookings.map((b) => b.roomId))];
    await prisma.room.updateMany({
      where: { id: { in: roomIds } },
      data: { status: "available" },
    });

    return NextResponse.json({
      success: true,
      message: `Released ${expiredBookings.length} expired bookings`,
      released: expiredBookings.length,
    });
  } catch (error) {
    console.error("Release expired bookings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to release expired bookings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
