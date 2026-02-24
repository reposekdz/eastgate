/**
 * Advanced Booking API
 * Complete booking workflow with availability checking, payment, and confirmation
 */

import { NextRequest, NextResponse } from "next/server";
import {
  successResponse,
  errorResponse,
  validateRequestBody,
  validateDateRange,
} from "@/lib/validators";
import { extractToken, withAuth } from "@/lib/middleware-advanced";
import {
  checkRoomAvailability,
  createBooking,
  getAvailableRooms,
  type BookingRequest,
} from "@/lib/booking-system";
import { processPayment, PaymentMethod } from "@/lib/payment-system";
import { verifyToken } from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

// ============================================
// POST /api/bookings/search
// Search available rooms
// ============================================

export async function handleBookingSearch(req: NextRequest) {
  try {
    // Extract and validate request
    const { data: body, errors } = await validateRequestBody<{
      checkInDate: string;
      checkOutDate: string;
      roomType?: string;
      minPrice?: number;
      maxPrice?: number;
      occupancy?: number;
    }>(req, ["checkInDate", "checkOutDate"]);

    if (!body) {
      return errorResponse(
        "Validation failed",
        errors,
        400
      );
    }

    // Validate date range
    const dateValidation = validateDateRange(body.checkInDate, body.checkOutDate);
    if (!dateValidation.valid) {
      return errorResponse(
        "Invalid date range",
        dateValidation.errors,
        400
      );
    }

    // Get user branch
    const token = extractToken(req);
    const session = token ? verifyToken(token) : null;
    const branchId = session?.branchId || req.headers.get("x-branch-id") || "default";

    // Search available rooms
    const availableRooms = await getAvailableRooms(
      branchId,
      new Date(body.checkInDate),
      new Date(body.checkOutDate),
      {
        roomType: body.roomType,
        minPrice: body.minPrice,
        maxPrice: body.maxPrice,
        occupancy: body.occupancy,
      }
    );

    return successResponse({
      available: true,
      count: availableRooms.length,
      rooms: availableRooms.map((room) => ({
        id: room.id,
        number: room.number,
        type: room.type,
        price: room.pricing?.roomPrice || room.price,
        totalPrice: room.pricing?.total,
        occupancy: room.maxOccupancy,
        features: room.features,
        rating: room.rating,
        imageUrl: room.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Booking search error:", error);
    return errorResponse("Failed to search bookings", [], 500);
  }
}

// ============================================
// POST /api/bookings/create
// Create booking with payment
// ============================================

export async function handleCreateBooking(req: NextRequest) {
  try {
    // Verify authentication
    const token = extractToken(req);
    if (!token) {
      return errorResponse("Authentication required", [], 401);
    }

    const session = verifyToken(token);
    if (!session) {
      return errorResponse("Invalid token", [], 401);
    }

    // Extract and validate request
    const { data: body, errors } = await validateRequestBody<{
      roomId: string;
      guestId: string;
      checkInDate: string;
      checkOutDate: string;
      numberOfGuests: number;
      specialRequests?: string;
      paymentMethod?: string;
    }>(req, ["roomId", "guestId", "checkInDate", "checkOutDate", "numberOfGuests"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Check availability
    const availability = await checkRoomAvailability(
      body.roomId,
      new Date(body.checkInDate),
      new Date(body.checkOutDate)
    );

    if (!availability.available) {
      return errorResponse("Room not available for selected dates", [], 409);
    }

    if (!availability.pricing) {
      return errorResponse("Pricing calculation failed", [], 500);
    }

    // Create booking
    const booking = await createBooking({
      roomId: body.roomId,
      guestId: body.guestId,
      checkInDate: new Date(body.checkInDate),
      checkOutDate: new Date(body.checkOutDate),
      numberOfGuests: body.numberOfGuests,
      specialRequests: body.specialRequests,
      branchId: session.branchId,
    });

    // Process payment if payment method provided
    let paymentResponse = null;
    if (body.paymentMethod) {
      try {
        const guest = await prisma.guest.findUnique({
          where: { id: body.guestId },
        });

        if (!guest) {
          throw new Error("Guest not found");
        }

        paymentResponse = await processPayment({
          amount: availability.pricing.total,
          currency: "RWF",
          method: body.paymentMethod as PaymentMethod,
          email: guest.email,
          fullName: guest.name,
          description: `Booking for ${booking.id}`,
          bookingId: booking.id,
          branchId: session.branchId,
        });
      } catch (paymentError) {
        console.error("Payment processing error:", paymentError);
        // Booking created but payment failed
      }
    }

    return successResponse(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalAmount: availability.pricing.total,
        },
        payment: paymentResponse,
      },
      201
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return errorResponse("Failed to create booking", [], 500);
  }
}

// ============================================
// PUT /api/bookings/:id
// Update booking
// ============================================

export async function handleUpdateBooking(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(req);
    if (!token) {
      return errorResponse("Authentication required", [], 401);
    }

    const session = verifyToken(token);
    if (!session) {
      return errorResponse("Invalid token", [], 401);
    }

    const { data: body } = await validateRequestBody(req, []);

    // Check if booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return errorResponse("Booking not found", [], 404);
    }

    if (booking.branchId !== session.branchId) {
      return errorResponse("Access denied", [], 403);
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: body,
    });

    return successResponse({ booking: updated });
  } catch (error) {
    console.error("Booking update error:", error);
    return errorResponse("Failed to update booking", [], 500);
  }
}

// ============================================
// DELETE /api/bookings/:id
// Cancel booking
// ============================================

export async function handleCancelBooking(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(req);
    if (!token) {
      return errorResponse("Authentication required", [], 401);
    }

    const session = verifyToken(token);
    if (!session) {
      return errorResponse("Invalid token", [], 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      reason: string;
    }>(req, ["reason"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return errorResponse("Booking not found", [], 404);
    }

    if (booking.branchId !== session.branchId) {
      return errorResponse("Access denied", [], 403);
    }

    // Cancel booking
    const cancelled = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: "cancelled",
        cancellationDate: new Date(),
        cancellationReason: body.reason,
      },
    });

    return successResponse({
      message: "Booking cancelled successfully",
      booking: cancelled,
    });
  } catch (error) {
    console.error("Booking cancellation error:", error);
    return errorResponse("Failed to cancel booking", [], 500);
  }
}
