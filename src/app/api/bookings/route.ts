import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-advanced";
import { checkRoomAvailability, createBooking, cancelBooking } from "@/lib/booking-system";
import { successResponse, errorResponse, validateRequestBody, validateDateRange } from "@/lib/validators";
import prisma from "@/lib/prisma";

/**
 * GET /api/bookings
 * Fetch bookings with filters - requires auth
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const guestEmail = searchParams.get("guestEmail");
    const branchId = searchParams.get("branchId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    // Users can only see their branch bookings if not super admin
    if (session.role !== "SUPER_ADMIN" && session.branchId) {
      where.branchId = session.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (status) where.status = status;
    if (guestEmail) where.guestEmail = { contains: guestEmail, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.checkIn = {};
      if (dateFrom) where.checkIn.gte = new Date(dateFrom);
      if (dateTo) where.checkIn.lte = new Date(dateTo);
    }

    const total = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: { id: true, number: true, type: true, floor: true, price: true },
        },
        guest: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse("Bookings retrieved successfully", {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Bookings fetch error:", error);
    return errorResponse("Failed to fetch bookings", { error: error.message }, 500);
  }

/**
 * POST /api/bookings
 * Create new booking - requires auth
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      roomId: string;
      guestName: string;
      guestEmail: string;
      guestPhone?: string;
      checkInDate: string;
      checkOutDate: string;
      numberOfGuests: number;
      specialRequests?: string;
      children?: number;
      paymentMethod?: string;
    }>(req, ["roomId", "guestName", "guestEmail", "checkInDate", "checkOutDate", "numberOfGuests"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Validate date range
    const dateValidation = validateDateRange(body.checkInDate, body.checkOutDate);
    if (!dateValidation.valid) {
      return errorResponse("Invalid date range", { dates: dateValidation.error }, 400);
    }

    // Check room exists
    const room = await prisma.room.findUnique({
      where: { id: body.roomId },
      include: { branch: { select: { id: true, name: true } } },
    });

    if (!room) {
      return errorResponse("Room not found", { roomId: "Room does not exist" }, 404);
    }

    // Check room availability
    const availability = await checkRoomAvailability(
      body.roomId,
      new Date(body.checkInDate),
      new Date(body.checkOutDate)
    );

    if (!availability.available) {
      return errorResponse(
        "Room not available for selected dates",
        { availability: "Room is booked for these dates" },
        409
      );
    }

    // Create booking in database
    const bookingData = {
      roomId: body.roomId,
      roomNumber: room.number,
      roomType: room.type,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      guestPhone: body.guestPhone,
      checkIn: new Date(body.checkInDate),
      checkOut: new Date(body.checkOutDate),
      adults: body.numberOfGuests,
      children: body.children || 0,
      totalAmount: availability.pricing?.total || 0,
      paymentMethod: body.paymentMethod || "card",
      specialRequests: body.specialRequests,
      status: "pending",
      branchId: room.branchId,
    };

    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        room: { select: { id: true, number: true, type: true, price: true } },
      },
    });

    return successResponse("Booking created successfully", {
      booking,
      pricing: availability.pricing,
    }, 201);
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return errorResponse("Failed to create booking", { error: error.message }, 500);
  }
}

/**
 * PUT /api/bookings/:id
 * Update booking - requires auth
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      id: string;
      checkInDate?: string;
      checkOutDate?: string;
      numberOfGuests?: number;
      specialRequests?: string;
      paymentMethod?: string;
      status?: string;
    }>(req, ["id"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: body.id },
      include: { room: { select: { id: true, number: true, type: true, price: true } } },
    });

    if (!booking) {
      return errorResponse("Booking not found", { bookingId: "Booking does not exist" }, 404);
    }

    // Check authorization - user must be admin or booking owner
    if (session.role !== "SUPER_ADMIN" && booking.guestEmail !== session.id) {
      return errorResponse("Unauthorized", { permission: "You cannot update this booking" }, 403);
    }

    // If dates are being changed, validate dates and check availability
    if (body.checkInDate || body.checkOutDate) {
      const checkIn = body.checkInDate || booking.checkIn.toISOString();
      const checkOut = body.checkOutDate || booking.checkOut.toISOString();

      const dateValidation = validateDateRange(checkIn, checkOut);
      if (!dateValidation.valid) {
        return errorResponse("Invalid date range", { dates: dateValidation.error }, 400);
      }

      // Check availability for new dates
      const availability = await checkRoomAvailability(
        booking.roomId,
        new Date(checkIn),
        new Date(checkOut),
        body.id // Exclude current booking from conflict check
      );

      if (!availability.available) {
        return errorResponse(
          "Room not available for selected dates",
          { availability: "Room is booked for these dates" },
          409
        );
      }
    }

    const updateData: any = {};
    if (body.checkInDate) updateData.checkIn = new Date(body.checkInDate);
    if (body.checkOutDate) updateData.checkOut = new Date(body.checkOutDate);
    if (body.numberOfGuests !== undefined) updateData.adults = body.numberOfGuests;
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests;
    if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
    if (body.status) updateData.status = body.status;

    const updatedBooking = await prisma.booking.update({
      where: { id: body.id },
      data: updateData,
      include: {
        room: { select: { id: true, number: true, type: true, price: true } },
      },
    });

    return successResponse("Booking updated successfully", { booking: updatedBooking });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return errorResponse("Failed to update booking", { error: error.message }, 500);
  }
}

/**
 * DELETE /api/bookings/:id
 * Cancel booking - requires auth
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");
    const reason = searchParams.get("reason") || "Guest requested cancellation";

    if (!bookingId) {
      return errorResponse("Missing parameter", { id: "Booking ID is required" }, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: { select: { id: true, number: true } } },
    });

    if (!booking) {
      return errorResponse("Booking not found", { bookingId: "Booking does not exist" }, 404);
    }

    // Check authorization
    if (session.role !== "SUPER_ADMIN" && booking.guestEmail !== session.id) {
      return errorResponse("Unauthorized", { permission: "You cannot cancel this booking" }, 403);
    }

    // Check if booking can be cancelled
    const validCancelStatuses = ["pending", "confirmed"];
    if (!validCancelStatuses.includes(booking.status)) {
      return errorResponse(
        "Cannot cancel booking",
        { status: `Booking with status "${booking.status}" cannot be cancelled` },
        400
      );
    }

    // Cancel the booking
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: {
        room: { select: { id: true, number: true } },
      },
    });

    // Release the room
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "available" },
    });

    return successResponse("Booking cancelled successfully", { booking: cancelledBooking });
  } catch (error: any) {
    console.error("Booking cancellation error:", error);
    return errorResponse("Failed to cancel booking", { error: error.message }, 500);
  }
