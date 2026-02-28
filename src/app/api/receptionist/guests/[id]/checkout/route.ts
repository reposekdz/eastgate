import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guestId = params.id;

    const booking = await prisma.booking.findFirst({
      where: {
        guestId,
        status: "checked_in",
      },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "No active booking found" },
        { status: 404 }
      );
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "checked_out",
        checkedOutAt: new Date(),
      },
    });

    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "cleaning" },
    });

    return NextResponse.json({
      success: true,
      message: "Guest checked out successfully",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check out" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
