import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch bookings with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const guestEmail = searchParams.get("guestEmail");
    const userBranchId = session.user.branchId as string;
    const userRole = session.user.role as string;

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole) && userBranchId) {
      where.branchId = userBranchId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.checkIn = {};
      if (dateFrom) where.checkIn.gte = new Date(dateFrom);
      if (dateTo) where.checkIn.lte = new Date(dateTo);
    }

    if (guestEmail) {
      where.guestEmail = { contains: guestEmail };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        room: {
          select: {
            number: true,
            type: true,
            floor: true,
          },
        },
      },
      take: 100,
    });

    // Get statistics
    const stats = await prisma.booking.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      bookings,
      stats,
    });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST - Create new booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    // Allow guest bookings without session
    const body = await req.json();
    const {
      guestName,
      guestEmail,
      guestPhone,
      guestAvatar,
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
      addOns,
    } = body;

    // Validate required fields
    if (!guestName || !guestEmail || !roomId || !checkIn || !checkOut || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields: guestName, guestEmail, roomId, checkIn, checkOut, totalAmount" },
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
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ["pending", "confirmed", "checked_in"] },
        OR: [
          {
            checkIn: { lte: checkInDate },
            checkOut: { gt: checkInDate },
          },
          {
            checkIn: { lt: checkOutDate },
            checkOut: { gte: checkOutDate },
          },
          {
            checkIn: { gte: checkInDate },
            checkOut: { lte: checkOutDate },
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

    // Determine branch ID
    let branchId = room.branchId;
    if (session?.user?.branchId) {
      branchId = session.user.branchId;
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestName,
        guestEmail,
        guestPhone,
        guestAvatar,
        roomId,
        roomNumber: roomNumber || room.number,
        roomType: roomType || room.type,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: adults || 1,
        children: children || 0,
        totalAmount: parseFloat(totalAmount),
        paymentMethod,
        specialRequests,
        addOns,
        status: "pending",
        branchId,
      },
    });

    // Update room status to booked
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "booked" },
    });

    // Log if staff created
    if (session?.user) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.email || undefined,
          branchId,
          action: "booking_created",
          entity: "booking",
          entityId: booking.id,
          details: { guestName, roomNumber, performedBy: session.user.name },
        },
      });
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// PUT - Update booking
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      status,
      checkIn,
      checkOut,
      totalAmount,
      paymentMethod,
      specialRequests,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (checkIn) updateData.checkIn = new Date(checkIn);
    if (checkOut) updateData.checkOut = new Date(checkOut);
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    // Handle room status changes
    if (status === "cancelled" || status === "checked_out") {
      await prisma.room.update({
        where: { id: existingBooking.roomId },
        data: { status: "available" },
      });
    }
    
    // When checking in, set room to occupied
    if (status === "checked_in") {
      await prisma.room.update({
        where: { id: existingBooking.roomId },
        data: { status: "occupied" },
      });
    }

    // Log update
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "booking_updated",
        entity: "booking",
        entityId: id,
        details: { status, performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel booking
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update booking status to cancelled
    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });

    // Update room status to available
    await prisma.room.update({
      where: { id: existingBooking.roomId },
      data: { status: "available" },
    });

    // Log cancellation
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "booking_cancelled",
        entity: "booking",
        entityId: id,
        details: { performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Booking cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
