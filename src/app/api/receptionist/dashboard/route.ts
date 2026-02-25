import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth-advanced";

const prisma = new PrismaClient();

const VALID_ACTIONS = ["checkin", "checkout", "confirm", "cancel"];

/**
 * GET /api/receptionist/dashboard
 * Get receptionist dashboard with check-ins, check-outs, available rooms, and active bookings
 * Requires: RECEPTIONIST role or higher
 */
export async function GET(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Verify user role
    const user = await prisma.staff.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !["RECEPTIONIST", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const branchWhere = user.branchId ? { branchId: user.branchId } : {};

    // Get today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIns = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        checkIn: { gte: today, lt: tomorrow },
        status: { in: ["confirmed", "checked_in"] },
      },
      include: { guest: true },
      orderBy: { checkIn: "asc" },
    });

    // Get today's check-outs
    const todayCheckOuts = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        checkOut: { gte: today, lt: tomorrow },
        status: { in: ["confirmed", "checked_in"] },
      },
      include: { guest: true },
      orderBy: { checkOut: "asc" },
    });

    // Get available rooms
    const availableRooms = await prisma.room.findMany({
      where: { ...branchWhere, status: "available" },
      orderBy: { roomNumber: "asc" },
    });

    // Get active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        ...branchWhere,
        status: { in: ["confirmed", "checked_in"] },
      },
      include: { guest: true, room: true },
      orderBy: { checkIn: "asc" },
    });

    // Get pending bookings
    const pendingBookings = await prisma.booking.findMany({
      where: { ...branchWhere, status: "pending" },
      include: { guest: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate statistics
    const totalRooms = await prisma.room.count({ where: branchWhere });
    const occupiedRooms = await prisma.room.count({
      where: { ...branchWhere, status: "occupied" },
    });
    const bookedRooms = await prisma.room.count({
      where: { ...branchWhere, status: { in: ["occupied", "booked"] } },
    });
    const occupancyRate = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;

    // Calculate today's revenue
    const todayRevenue = await prisma.booking.aggregate({
      where: {
        ...branchWhere,
        checkIn: { gte: today, lt: tomorrow },
        paymentStatus: "paid",
      },
      _sum: { totalAmount: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          todayCheckIns,
          todayCheckOuts,
          availableRooms,
          activeBookings,
          pendingBookings,
          stats: {
            totalRooms,
            occupiedRooms,
            availableRoomsCount: totalRooms - bookedRooms,
            occupancyRate,
            todayCheckInsCount: todayCheckIns.length,
            todayCheckOutsCount: todayCheckOuts.length,
            todayRevenue: todayRevenue._sum.totalAmount || 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Receptionist dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/receptionist/dashboard
 * Update booking status (checkin, checkout, confirm, cancel)
 * Requires: RECEPTIONIST role or higher
 * Body: { bookingId, action }
 */
export async function PUT(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Verify user role
    const user = await prisma.staff.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !["RECEPTIONIST", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bookingId, action } = body;

    // Validate input
    if (!bookingId || !action) {
      return NextResponse.json(
        { success: false, error: "Booking ID and action are required" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Get existing booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true, guest: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify booking belongs to user's branch
    if (user.branchId && booking.branchId !== user.branchId && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Booking belongs to different branch" },
        { status: 403 }
      );
    }

    const updateData: { updatedAt: Date; status?: string; checkedInAt?: Date; checkedInBy?: string; checkedOutAt?: Date; checkedOutBy?: string; cancelledAt?: Date; cancelledBy?: string } = { updatedAt: new Date() };
    const roomUpdate: { status?: string } = {};

    switch (action) {
      case "checkin":
        if (booking.status !== "confirmed") {
          return NextResponse.json(
            { success: false, error: "Only confirmed bookings can be checked in" },
            { status: 400 }
          );
        }
        updateData.status = "checked_in";
        updateData.checkedInAt = new Date();
        updateData.checkedInBy = user.id;
        roomUpdate.status = "occupied";
        break;

      case "checkout":
        if (!["confirmed", "checked_in"].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: "Invalid booking status for checkout" },
            { status: 400 }
          );
        }
        updateData.status = "checked_out";
        updateData.checkedOutAt = new Date();
        updateData.checkedOutBy = user.id;
        roomUpdate.status = "available";
        break;

      case "confirm":
        if (booking.status !== "pending") {
          return NextResponse.json(
            { success: false, error: "Only pending bookings can be confirmed" },
            { status: 400 }
          );
        }
        updateData.status = "confirmed";
        break;

      case "cancel":
        updateData.status = "cancelled";
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = user.id;
        if (["confirmed", "checked_in"].includes(booking.status)) {
          roomUpdate.status = "available";
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: { guest: true, room: true },
    });

    // Update room status if needed
    if (Object.keys(roomUpdate).length > 0 && booking.roomId) {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: roomUpdate,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Booking ${action} successfully`,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Receptionist booking update error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
