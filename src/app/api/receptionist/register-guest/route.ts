import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, idNumber, nationality, address, dateOfBirth, roomId, checkIn, checkOut, numberOfGuests, specialRequests, branchId } = body;

    if (!name || !phone || !idNumber || !roomId || !checkIn || !checkOut) {
      return NextResponse.json({ success: false, error: "Name, phone, ID, room, check-in and check-out dates are required" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status !== "available") {
      return NextResponse.json({ success: false, error: "Room is not available" }, { status: 400 });
    }

    let guest = await prisma.guest.findFirst({
      where: { OR: [{ email: email || undefined }, { phone }, { idNumber }] },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name, email: email || null, phone, idNumber, nationality: nationality || "Rwanda",
          address: address || null, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          loyaltyTier: "bronze", totalSpent: 0, visitCount: 0,
        },
      });
    }

    const days = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = room.price * days;

    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id, guestName: name, guestEmail: email || null, guestPhone: phone,
        roomId, roomNumber: room.roomNumber, roomType: room.type,
        checkIn: new Date(checkIn), checkOut: new Date(checkOut),
        numberOfGuests: numberOfGuests || 1, totalAmount, status: "checked_in",
        specialRequests: specialRequests || null, branchId: branchId || room.branchId,
        paymentStatus: "paid",
      },
    });

    await prisma.room.update({ where: { id: roomId }, data: { status: "occupied" } });
    await prisma.guest.update({ where: { id: guest.id }, data: { visitCount: { increment: 1 }, lastVisit: new Date() } });

    return NextResponse.json({ success: true, message: "Guest registered and checked in successfully", booking, guest });
  } catch (error) {
    console.error("Error registering guest:", error);
    return NextResponse.json({ success: false, error: "Failed to register guest" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
