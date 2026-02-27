import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true, guest: true },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "confirmed") return NextResponse.json({ error: "Booking not confirmed" }, { status: 400 });

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: { status: "checked_in", checkedInAt: new Date() },
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "occupied" },
      }),
      prisma.activityLog.create({
        data: {
          userId: decoded.userId,
          branchId: booking.room.branchId,
          action: "check_in",
          entity: "booking",
          entityId: params.id,
          details: { guestName: booking.guestName, roomNumber: booking.room.number },
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Check-in successful" });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
