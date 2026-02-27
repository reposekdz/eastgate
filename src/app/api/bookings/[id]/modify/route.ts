import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { checkInDate, checkOutDate, roomId, specialRequests } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status === "checked_out") return NextResponse.json({ error: "Cannot modify completed booking" }, { status: 400 });

    const updateData: any = {};
    if (checkInDate) updateData.checkInDate = new Date(checkInDate);
    if (checkOutDate) updateData.checkOutDate = new Date(checkOutDate);
    if (roomId && roomId !== booking.roomId) {
      const newRoom = await prisma.room.findUnique({ where: { id: roomId } });
      if (!newRoom || newRoom.status !== "available") {
        return NextResponse.json({ error: "Room not available" }, { status: 400 });
      }
      updateData.roomId = roomId;
    }
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: booking.room.branchId,
        action: "booking_modified",
        entity: "booking",
        entityId: params.id,
        details: { changes: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Modify booking error:", error);
    return NextResponse.json({ error: "Failed to modify booking" }, { status: 500 });
  }
}
