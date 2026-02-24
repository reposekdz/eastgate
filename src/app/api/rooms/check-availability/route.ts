import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Check room availability
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, checkIn, checkOut } = body;

    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: "roomId, checkIn, and checkOut are required" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ["pending", "confirmed", "checked_in"] },
        OR: [
          { checkIn: { lte: checkInDate }, checkOut: { gt: checkInDate } },
          { checkIn: { lt: checkOutDate }, checkOut: { gte: checkOutDate } },
          { checkIn: { gte: checkInDate }, checkOut: { lte: checkOutDate } },
        ],
      },
    });

    const isAvailable = conflictingBookings.length === 0;

    return NextResponse.json({
      success: true,
      available: isAvailable,
      conflicts: conflictingBookings.length,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check availability" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
