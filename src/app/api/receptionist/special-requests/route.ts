import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, type, requestedTime, reason, branchId } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const extraCharge = type === "early_checkin" ? 50000 : 30000;

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: booking.totalAmount + extraCharge,
      },
    });

    await prisma.activityLog.create({
      data: {
        branchId,
        action: "update",
        entity: "booking",
        entityId: bookingId,
        details: {
          type,
          requestedTime,
          reason,
          extraCharge,
          guestName: booking.guestName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      extraCharge,
      message: `${type === "early_checkin" ? "Early check-in" : "Late checkout"} approved`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
