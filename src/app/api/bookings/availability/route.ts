import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { checkIn, checkOut, branchId, roomType, guests } = await req.json();

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: "Check-in and check-out dates required" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const where: any = { status: "available" };
    if (branchId) where.branchId = branchId;
    if (roomType) where.type = roomType;
    if (guests) where.maxOccupancy = { gte: parseInt(guests) };

    const availableRooms = await prisma.room.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, location: true } },
        roomAmenities: true,
        bookings: {
          where: {
            OR: [
              {
                AND: [
                  { checkIn: { lte: checkOutDate } },
                  { checkOut: { gte: checkInDate } },
                ],
              },
            ],
            status: { in: ["confirmed", "checked_in"] },
          },
        },
      },
    });

    const fullyAvailable = availableRooms.filter(room => room.bookings.length === 0);

    return NextResponse.json({
      success: true,
      available: fullyAvailable.length,
      rooms: fullyAvailable.map(({ bookings, ...room }) => room),
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
