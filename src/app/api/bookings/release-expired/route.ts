import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * API to automatically release rooms when booking checkOut date has passed
 * This can be called by a cron job or manually to ensure rooms are properly released
 */
export async function POST(req: NextRequest) {
  try {
    const now = new Date();
    
    // Find all bookings where:
    // 1. Status is checked_in
    // 2. CheckOut date has passed
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "checked_in",
        checkOut: {
          lt: now,
        },
      },
    });

    if (expiredBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired bookings found",
        releasedCount: 0,
      });
    }

    // Release each room and update booking status
    const results = await Promise.all(
      expiredBookings.map(async (booking) => {
        // Update booking to checked_out
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "checked_out" },
        });

        // Release the room
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "available" },
        });

        return {
          bookingId: booking.id,
          roomId: booking.roomId,
          roomNumber: booking.roomNumber,
          guestName: booking.guestName,
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: `Released ${results.length} room(s)`,
      releasedCount: results.length,
      releasedRooms: results,
    });
  } catch (error) {
    console.error("Error releasing expired bookings:", error);
    return NextResponse.json(
      { error: "Failed to release expired bookings" },
      { status: 500 }
    );
  }
}

/**
 * GET - Check which bookings are expired (for monitoring)
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();

    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "checked_in",
        checkOut: {
          lt: now,
        },
      },
      select: {
        id: true,
        roomId: true,
        roomNumber: true,
        roomType: true,
        guestName: true,
        guestEmail: true,
        checkIn: true,
        checkOut: true,
        totalAmount: true,
        branchId: true,
      },
    });

    return NextResponse.json({
      success: true,
      expiredCount: expiredBookings.length,
      expiredBookings,
    });
  } catch (error) {
    console.error("Error checking expired bookings:", error);
    return NextResponse.json(
      { error: "Failed to check expired bookings" },
      { status: 500 }
    );
  }
}
