import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

/**
 * POST /api/receptionist/register-guest
 * Register new guest with automatic booking creation
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("eastgate-auth");
    
    if (!authCookie) {
      return errorResponse("Unauthorized", [], 401);
    }

    let authData;
    try {
      authData = JSON.parse(decodeURIComponent(authCookie.value));
    } catch {
      return errorResponse("Invalid auth data", [], 401);
    }

    if (!authData.isAuthenticated || !authData.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    const user = authData.user;
    
    // Only receptionists and managers can register guests
    const canRegisterGuest = ["receptionist", "branch_manager", "branch_admin", "super_admin", "super_manager"].includes(user.role);
    
    if (!canRegisterGuest) {
      return errorResponse("Insufficient permissions", [{
        field: "role",
        message: "Only receptionists and managers can register guests",
        code: "FORBIDDEN"
      }], 403);
    }

    const body = await req.json();
    const {
      // Guest details
      name,
      email,
      phone,
      nationality,
      idNumber,
      address,
      dateOfBirth,
      // Booking details
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      infants,
      specialRequests,
      paymentMethod,
      paymentStatus,
      totalAmount,
    } = body;

    // Use user's branch
    const branchId = user.branchId;

    // Validation
    const required = { name, email, phone, roomId, checkIn, checkOut };
    const missing = Object.entries(required)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      return errorResponse(
        "Validation failed",
        missing.map(field => ({
          field,
          message: `${field} is required`,
          code: "REQUIRED"
        })),
        400
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return errorResponse("Invalid dates", [{
        field: "checkIn",
        message: "Check-in date cannot be in the past",
        code: "INVALID"
      }], 400);
    }

    if (checkOutDate <= checkInDate) {
      return errorResponse("Invalid dates", [{
        field: "checkOut",
        message: "Check-out date must be after check-in date",
        code: "INVALID"
      }], 400);
    }

    // Check if guest already exists
    let existingGuest = await prisma.guest.findUnique({
      where: { email }
    });

    // Check room exists and is available
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { branch: true },
    });

    if (!room) {
      return errorResponse("Room not found", [{
        field: "roomId",
        message: "Room does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    // Check room availability
    const conflictingBookings = await prisma.booking.count({
      where: {
        roomId,
        status: { in: ["pending", "confirmed", "checked_in"] },
        OR: [{
          checkIn: { lte: checkOutDate },
          checkOut: { gte: checkInDate },
        }],
      },
    });

    if (conflictingBookings > 0) {
      return errorResponse("Room not available", [{
        field: "availability",
        message: "Room is already booked for these dates",
        code: "CONFLICT"
      }], 409);
    }

    // Calculate nights and total
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const calculatedTotal = totalAmount || (nights * room.price);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      let guest;
      
      if (existingGuest) {
        // Update existing guest
        guest = await tx.guest.update({
          where: { id: existingGuest.id },
          data: {
            name,
            phone,
            nationality: nationality || existingGuest.nationality,
            idNumber: idNumber || existingGuest.idNumber,
            address: address || existingGuest.address,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingGuest.dateOfBirth,
            lastVisit: new Date(),
            totalSpent: { increment: calculatedTotal },
          }
        });
      } else {
        // Create new guest
        guest = await tx.guest.create({
          data: {
            name,
            email,
            phone,
            nationality: nationality || "Rwanda",
            idNumber,
            address,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            avatar: `https://i.pravatar.cc/40?u=${email}`,
            lastVisit: new Date(),
            totalSpent: calculatedTotal,
            loyaltyTier: calculatedTotal >= 500000 ? "gold" : calculatedTotal >= 200000 ? "silver" : null as any,
            branch: {
              connect: { id: branchId }
            }
          }
        });
      }

      // Generate booking reference
      const bookingCount = await tx.booking.count();
      const bookingRef = `BK${String(bookingCount + 1).padStart(8, "0")}`;

      // Create booking
      const booking = await tx.booking.create({
        data: {
          bookingRef,
          guestId: guest.id,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          roomId,
          roomNumber: room.number,
          roomType: room.type,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          nights,
          adults: adults || 1,
          children: children || 0,
          infants: infants || 0,
          totalAmount: calculatedTotal,
          specialRequests: specialRequests || null,
          paymentMethod: paymentMethod || "cash",
          paymentStatus: paymentStatus || "pending",
          status: paymentStatus === "paid" ? "confirmed" : "pending",
          branchId,
        },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              loyaltyTier: true,
              totalSpent: true,
            }
          },
          room: {
            select: {
              id: true,
              number: true,
              type: true,
              floor: true,
              price: true,
              imageUrl: true,
            }
          },
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
            }
          }
        }
      });

      // Update room status if payment is confirmed
      if (paymentStatus === "paid") {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "reserved" }
        });
      }

      return { guest, booking };
    });

    return successResponse({
      message: "Guest registered and booking created successfully",
      guest: result.guest,
      booking: result.booking,
    }, 201);

  } catch (error: any) {
    console.error("Guest registration error:", error);
    return errorResponse("Failed to register guest", [], 500);
  }
}