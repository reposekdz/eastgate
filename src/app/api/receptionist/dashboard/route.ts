import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// Role check helper
function isReceptionist(role: string): boolean {
  return ["RECEPTIONIST", "SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(role);
}

// GET - Receptionist dashboard data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    if (!isReceptionist(userRole)) {
      return NextResponse.json({ error: "Forbidden - Receptionist access only" }, { status: 403 });
    }

    const branchWhere = userBranchId ? { branchId: userBranchId } : {};

    // Get today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIns = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        checkIn: {
          gte: today,
          lt: tomorrow,
        },
        status: "confirmed",
      },
      include: {
        guest: true,
      },
    });

    // Get today's check-outs
    const todayCheckOuts = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        checkOut: {
          gte: today,
          lt: tomorrow,
        },
        status: "confirmed",
      },
      include: {
        guest: true,
      },
    });

    // Get available rooms
    const availableRooms = await prisma.room.findMany({
      where: {
        ...branchWhere,
        status: "available",
      },
      orderBy: {
        number: "asc",
      },
    });

    // Get all active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        status: "confirmed",
      },
      include: {
        guest: true,
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    // Get pending bookings (not confirmed yet)
    const pendingBookings = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        status: "pending",
      },
      include: {
        guest: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Statistics
    const totalRooms = await prisma.room.count({ where: branchWhere });
    const bookedRooms = await prisma.room.count({
      where: { ...branchWhere, status: "booked" }
    });
    const occupancyRate = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        todayCheckIns,
        todayCheckOuts,
        availableRooms,
        activeBookings,
        pendingBookings,
        stats: {
          totalRooms,
          bookedRooms,
          available: totalRooms - bookedRooms,
          occupancyRate,
          todayCheckInsCount: todayCheckIns.length,
          todayCheckOutsCount: todayCheckOuts.length,
        },
      },
    });
  } catch (error) {
    console.error("Receptionist dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// PUT - Update booking status (check-in, check-out, cancel)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isReceptionist(userRole)) {
      return NextResponse.json({ error: "Forbidden - Receptionist access only" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, action, roomId } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "bookingId and action are required" },
        { status: 400 }
      );
    }

    // Get existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let updateData: any = {};
    let roomUpdate: any = {};

    switch (action) {
      case "checkin":
        // Guest checking in
        updateData = { status: "checked_in" };
        roomUpdate = { status: "booked" };
        break;
      case "checkout":
        // Guest checking out
        updateData = { status: "checked_out" };
        roomUpdate = { status: "available" };
        break;
      case "confirm":
        // Confirm pending booking
        updateData = { status: "confirmed" };
        break;
      case "cancel":
        // Cancel booking
        updateData = { status: "cancelled" };
        roomUpdate = { status: "available" };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // Update room status if needed
    if (roomUpdate.status && existingBooking.roomId) {
      await prisma.room.update({
        where: { id: existingBooking.roomId },
        data: roomUpdate,
      });
    }

    // Log receptionist action
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: `booking_${action}`,
        entity: "booking",
        entityId: bookingId,
        details: { action, performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Receptionist booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// POST - Create new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isReceptionist(userRole)) {
      return NextResponse.json({ error: "Forbidden - Receptionist access only" }, { status: 403 });
    }

    const body = await req.json();
    const {
      guestName,
      guestEmail,
      guestPhone,
      roomId,
      roomNumber,
      roomType,
      checkIn,
      checkOut,
      adults,
      children,
      totalAmount,
      paymentMethod,
      specialRequests,
    } = body;

    // Validate required fields
    if (!guestName || !guestEmail || !roomId || !checkIn || !checkOut || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if room is available
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "available") {
      return NextResponse.json({ error: "Room is not available" }, { status: 400 });
    }

    // Check for conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ["pending", "confirmed", "checked_in"] },
        OR: [
          {
            checkIn: { lte: new Date(checkIn) },
            checkOut: { gt: new Date(checkIn) },
          },
          {
            checkIn: { lt: new Date(checkOut) },
            checkOut: { gte: new Date(checkOut) },
          },
          {
            checkIn: { gte: new Date(checkIn) },
            checkOut: { lte: new Date(checkOut) },
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "Room is already booked for these dates" },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestName,
        guestEmail,
        guestPhone,
        roomId,
        roomNumber: roomNumber || room.number,
        roomType: roomType || room.type,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        adults: adults || 1,
        children: children || 0,
        totalAmount,
        paymentMethod,
        specialRequests,
        status: "confirmed",
        branchId: session.user.branchId || "",
      },
    });

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "booked" },
    });

    // Log the booking creation
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "booking_created",
        entity: "booking",
        entityId: booking.id,
        details: { guestName, roomNumber, performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Receptionist booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
