import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status && status !== "all") where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        guest: true,
        room: true,
      },
      orderBy: { checkIn: "desc" },
    });

    const transformedBookings = bookings.map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone || "N/A",
      roomNumber: booking.roomNumber,
      roomType: booking.roomType,
      checkIn: booking.checkIn.toISOString().split("T")[0],
      checkOut: booking.checkOut.toISOString().split("T")[0],
      status: booking.status,
      totalAmount: booking.totalAmount,
      numberOfGuests: booking.numberOfGuests || booking.adults,
      specialRequests: booking.specialRequests,
      branchId: booking.branchId,
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      total: transformedBookings.length,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, status } = body;

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(status === "checked_in" && { checkedInAt: new Date() }),
        ...(status === "checked_out" && { checkedOutAt: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
