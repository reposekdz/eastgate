import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { paymentMethod, additionalCharges } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.status !== "checked_in") return NextResponse.json({ error: "Guest not checked in" }, { status: 400 });

    // Get orders for this room
    const orders = await prisma.order.findMany({
      where: { roomId: booking.roomId, paymentStatus: "unpaid" },
    });

    const roomCharges = booking.totalAmount || 0;
    const orderCharges = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalBill = roomCharges + orderCharges + (additionalCharges || 0);

    // Get room info for assignment
    const room = await prisma.room.findUnique({ where: { id: booking.roomId } });

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: { 
          status: "checked_out", 
          checkedOutAt: new Date(),
          paidAmount: totalBill,
          paymentStatus: "paid",
        },
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "cleaning" },
      }),
      prisma.activityLog.create({
        data: {
          userId: decoded.userId,
          branchId: booking.branchId,
          action: "check_out",
          entity: "booking",
          entityId: params.id,
          details: { guestName: booking.guestName, roomNumber: room?.number, totalBill },
        },
      }),
    ]);

    // Create housekeeping assignment - find available housekeeping staff
    const housekeepingStaff = await prisma.staff.findFirst({
      where: { 
        branchId: booking.branchId, 
        role: "housekeeping",
        status: "active"
      },
    });

    if (housekeepingStaff) {
      await prisma.assignment.create({
        data: {
          staffId: housekeepingStaff.id,
          entityId: booking.roomId,
          type: "cleaning",
          status: "pending",
          priority: "high",
        },
      });
    }

    return NextResponse.json({ success: true, totalBill, message: "Check-out successful" });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Check-out failed" }, { status: 500 });
  }
}
