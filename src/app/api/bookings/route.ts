import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

/**
 * GET /api/bookings
 * Fetch bookings with advanced filtering and role-based access
 */
export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const roomId = searchParams.get("roomId");
    const guestEmail = searchParams.get("guestEmail");
    const guestId = searchParams.get("guestId");
    const checkInFrom = searchParams.get("checkInFrom");
    const checkInTo = searchParams.get("checkInTo");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    // Role-based filtering - all branch staff can see bookings
    const isSuperRole = ["super_admin", "super_manager"].includes(user.role.toLowerCase());
    const isBranchStaff = ["branch_manager", "branch_admin", "receptionist", "waiter", "restaurant_staff"].includes(user.role.toLowerCase());
    
    // Apply branch filtering based on role
    if (!isSuperRole) {
      // All branch staff can only see their branch bookings
      where.branchId = user.branchId;
    } else if (branchId && branchId !== "all") {
      // Super users can filter by specific branch
      where.branchId = branchId;
    }

    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (guestId) where.guestId = guestId;
    if (guestEmail) where.guestEmail = { contains: guestEmail, mode: "insensitive" };

    // Date range filter
    if (checkInFrom || checkInTo) {
      where.checkIn = {};
      if (checkInFrom) where.checkIn.gte = new Date(checkInFrom);
      if (checkInTo) where.checkIn.lte = new Date(checkInTo);
    }

    // Search filter
    if (search) {
      where.OR = [
        { bookingRef: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { guestPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [bookings, total, statusCounts] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
              phone: true,
            },
          },
          room: {
            select: {
              id: true,
              number: true,
              type: true,
              floor: true,
              price: true,
              imageUrl: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              loyaltyTier: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ["status"],
        where: where.branchId ? { branchId: where.branchId } : {},
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // Calculate statistics
    const stats = {
      total,
      pending: statusCounts.find((s) => s.status === "pending")?._count || 0,
      confirmed: statusCounts.find((s) => s.status === "confirmed")?._count || 0,
      checked_in: statusCounts.find((s) => s.status === "checked_in")?._count || 0,
      checked_out: statusCounts.find((s) => s.status === "checked_out")?._count || 0,
      cancelled: statusCounts.find((s) => s.status === "cancelled")?._count || 0,
      totalRevenue: statusCounts.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0),
    };

    return successResponse({
      bookings,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      userRole: user.role,
      branchFilter: where.branchId || "all",
    });
  } catch (error: any) {
    console.error("Bookings fetch error:", error);
    return errorResponse("Failed to fetch bookings", [], 500);
  }
}

/**
 * POST /api/bookings
 * Create new booking with role-based permissions
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
    
    // All branch staff can create bookings
    const canCreateBooking = ["receptionist", "branch_manager", "branch_admin", "super_admin", "super_manager", "waiter", "restaurant_staff"].includes(user.role.toLowerCase());
    
    if (!canCreateBooking) {
      return errorResponse("Insufficient permissions", [{
        field: "role",
        message: "Only receptionists and managers can create bookings",
        code: "FORBIDDEN"
      }], 403);
    }

    const body = await req.json();
    const {
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      guestId,
      checkIn,
      checkOut,
      adults,
      children,
      infants,
      specialRequests,
      paymentMethod,
      branchId,
    } = body;

    // Use user's branch if not super role
    const finalBranchId = ["super_admin", "super_manager"].includes(user.role.toLowerCase()) ? branchId : user.branchId;

    // Validation
    const required = { roomId, guestName, guestEmail, checkIn, checkOut, branchId: finalBranchId };
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
      return errorResponse(
        "Invalid dates",
        [{
          field: "checkIn",
          message: "Check-in date cannot be in the past",
          code: "INVALID"
        }],
        400
      );
    }

    if (checkOutDate <= checkInDate) {
      return errorResponse(
        "Invalid dates",
        [{
          field: "checkOut",
          message: "Check-out date must be after check-in date",
          code: "INVALID"
        }],
        400
      );
    }

    // Check room exists
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
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          },
        ],
      },
    });

    if (conflictingBookings > 0) {
      return errorResponse(
        "Room not available",
        [{
          field: "availability",
          message: "Room is already booked for these dates",
          code: "CONFLICT"
        }],
        409
      );
    }

    // Calculate nights and total
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalAmount = nights * room.price;

    // Generate booking reference
    const bookingCount = await prisma.booking.count();
    const bookingRef = `BK${String(bookingCount + 1).padStart(8, "0")}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        guestId: guestId || null,
        roomId,
        roomNumber: room.number,
        roomType: room.type,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        adults: adults || 1,
        children: children || 0,
        infants: infants || 0,
        totalAmount,
        specialRequests: specialRequests || null,
        paymentMethod: paymentMethod || "card",
        status: "pending",
        branchId: finalBranchId,
      },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            price: true,
            imageUrl: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return successResponse({ booking }, 201);
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return errorResponse("Failed to create booking", [], 500);
  }
}

/**
 * PUT /api/bookings
 * Update booking
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, checkIn, checkOut, adults, children, specialRequests } = body;

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Booking ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!existingBooking) {
      return errorResponse("Booking not found", [{
        field: "id",
        message: "Booking does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    const updateData: any = {};

    if (status) {
      const validStatuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];
      if (!validStatuses.includes(status)) {
        return errorResponse(
          "Invalid status",
          [{
            field: "status",
            message: `Must be one of: ${validStatuses.join(", ")}`,
            code: "INVALID"
          }],
          400
        );
      }
      updateData.status = status;

      // Update room status based on booking status
      if (status === "checked_in") {
        await prisma.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "occupied" },
        });
        updateData.checkedInAt = new Date();
      } else if (status === "checked_out") {
        await prisma.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "cleaning" },
        });
        updateData.checkedOutAt = new Date();
      } else if (status === "cancelled") {
        await prisma.room.update({
          where: { id: existingBooking.roomId },
          data: { status: "available" },
        });
        updateData.cancelledAt = new Date();
      }
    }

    if (checkIn) updateData.checkIn = new Date(checkIn);
    if (checkOut) updateData.checkOut = new Date(checkOut);
    if (adults !== undefined) updateData.adults = adults;
    if (children !== undefined) updateData.children = children;
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;

    // Recalculate nights and total if dates changed
    if (checkIn || checkOut) {
      const newCheckIn = checkIn ? new Date(checkIn) : existingBooking.checkIn;
      const newCheckOut = checkOut ? new Date(checkOut) : existingBooking.checkOut;
      const nights = Math.ceil(
        (newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      updateData.nights = nights;
      updateData.totalAmount = nights * existingBooking.room.price;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            price: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return successResponse({ booking });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return errorResponse("Failed to update booking", [], 500);
  }
}

/**
 * DELETE /api/bookings
 * Cancel booking
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reason = searchParams.get("reason") || "Guest requested cancellation";

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Booking ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return errorResponse("Booking not found", [{
        field: "id",
        message: "Booking does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(existingBooking.status)) {
      return errorResponse(
        "Cannot cancel booking",
        [{
          field: "status",
          message: `Booking with status "${existingBooking.status}" cannot be cancelled`,
          code: "INVALID_STATUS"
        }],
        400
      );
    }

    // Cancel booking and release room
    const [booking] = await Promise.all([
      prisma.booking.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
        include: {
          room: {
            select: {
              id: true,
              number: true,
              type: true,
            },
          },
        },
      }),
      prisma.room.update({
        where: { id: existingBooking.roomId },
        data: { status: "available" },
      }),
    ]);

    return successResponse({ booking });
  } catch (error: any) {
    console.error("Booking cancellation error:", error);
    return errorResponse("Failed to cancel booking", [], 500);
  }
}
