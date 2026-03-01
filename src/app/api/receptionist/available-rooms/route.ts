import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

/**
 * GET /api/receptionist/available-rooms
 * Get available rooms for assignment with rich data and real-time availability
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
    
    // Check role (case-insensitive)
    const allowedRoles = ["receptionist", "branch_manager", "branch_admin", "super_admin", "super_manager"];
    const canViewRooms = allowedRoles.includes(user.role.toLowerCase());
    
    if (!canViewRooms) {
      return errorResponse("Insufficient permissions", [{
        field: "role",
        message: "Only receptionists and managers can view available rooms",
        code: "FORBIDDEN"
      }], 403);
    }

    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const roomType = searchParams.get("roomType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const floor = searchParams.get("floor");
    const guests = parseInt(searchParams.get("guests") || "1");

    // Use user's branch for non-super users - STRICT branch filtering
    const branchId = user.branchId; // Always use user's assigned branch only

    const where: any = {
      branchId,
    };

    // Room type filter
    if (roomType && roomType !== "all") {
      where.type = roomType;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Floor filter
    if (floor) {
      where.floor = parseInt(floor);
    }

    // Guest capacity filter
    if (guests > 1) {
      where.maxOccupancy = { gte: guests };
    }

    // Get all rooms first, then filter by availability
    const [allRooms, roomStats] = await Promise.all([
      prisma.room.findMany({
        where,
        orderBy: [
          { floor: "asc" },
          { number: "asc" }
        ],
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
            }
          },
          bookings: {
            where: {
              status: { in: ["confirmed", "checked_in"] },
              checkOut: { gte: new Date() },
            },
            select: {
              id: true,
              bookingRef: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
              status: true,
            },
            orderBy: { checkIn: "asc" },
            take: 1,
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: ["confirmed", "checked_out"] }
                }
              }
            }
          }
        },
      }),
      prisma.room.groupBy({
        by: ["type"],
        where: { branchId, status: "available" },
        _count: true,
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    // Add rich room data to all rooms
    const allRoomsWithDetails = allRooms.map(room => ({
      ...room,
      isCurrentlyOccupied: room.bookings.length > 0,
      currentGuest: room.bookings[0]?.guestName || null,
      nextCheckOut: room.bookings[0]?.checkOut || null,
      totalBookings: room._count.bookings,
      amenities: [
        "Free WiFi",
        "Air Conditioning", 
        "Private Bathroom",
        "Room Service",
        ...(room.type === "executive_suite" || room.type === "presidential_suite" 
          ? ["Mini Bar", "Balcony", "Work Desk"] 
          : []),
        ...(room.type === "presidential_suite" 
          ? ["Living Room", "Kitchenette", "Butler Service"] 
          : [])
      ],
    }));

    // Filter available rooms for assignment
    let availableRooms = allRoomsWithDetails.filter(room => 
      room.status === "available" && !room.isCurrentlyOccupied
    );

    // Apply date-based availability check
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          branchId,
          status: { in: ["pending", "confirmed", "checked_in"] },
          OR: [{
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          }],
        },
        select: { roomId: true }
      });

      const conflictingRoomIds = conflictingBookings.map(b => b.roomId);
      availableRooms = availableRooms.filter(room => !conflictingRoomIds.includes(room.id));
    }

    // Calculate statistics
    const stats = {
      totalAvailable: availableRooms.length,
      totalRooms: allRoomsWithDetails.length,
      occupied: allRoomsWithDetails.filter(r => r.isCurrentlyOccupied).length,
      maintenance: allRoomsWithDetails.filter(r => r.status === "maintenance").length,
      cleaning: allRoomsWithDetails.filter(r => r.status === "cleaning").length,
      byType: roomStats.map(stat => ({
        type: stat.type,
        count: stat._count,
        avgPrice: Math.round(stat._avg.price || 0),
        minPrice: stat._min.price || 0,
        maxPrice: stat._max.price || 0,
      })),
      priceRange: {
        min: availableRooms.length > 0 ? Math.min(...availableRooms.map(r => r.price)) : 0,
        max: availableRooms.length > 0 ? Math.max(...availableRooms.map(r => r.price)) : 0,
        avg: availableRooms.length > 0 ? Math.round(availableRooms.reduce((sum, r) => sum + r.price, 0) / availableRooms.length) : 0,
      },
      floors: [...new Set(allRoomsWithDetails.map(r => r.floor))].sort(),
    };

    return successResponse({
      rooms: allRoomsWithDetails, // All rooms with their current status
      availableRooms, // Only available rooms for assignment
      stats,
      filters: {
        checkIn,
        checkOut,
        roomType,
        minPrice,
        maxPrice,
        floor,
        guests,
      },
      userRole: user.role,
      branchId,
    });
  } catch (error: any) {
    console.error("Available rooms fetch error:", error);
    return errorResponse("Failed to fetch available rooms", [], 500);
  }
}

/**
 * POST /api/receptionist/available-rooms
 * Assign room to guest with payment verification
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
    
    // Only receptionists and managers can assign rooms
    const canAssignRoom = ["receptionist", "branch_manager", "branch_admin", "super_admin", "super_manager"].includes(user.role.toLowerCase());
    
    if (!canAssignRoom) {
      return errorResponse("Insufficient permissions", [{
        field: "role",
        message: "Only receptionists and managers can assign rooms",
        code: "FORBIDDEN"
      }], 403);
    }

    const body = await req.json();
    const {
      guestId,
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

    // Validation
    const required = { guestId, roomId, checkIn, checkOut, paymentStatus };
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

    // Verify guest and room exist
    const [guest, room] = await Promise.all([
      prisma.guest.findUnique({ where: { id: guestId } }),
      prisma.room.findUnique({ where: { id: roomId }, include: { branch: true } })
    ]);

    if (!guest) {
      return errorResponse("Guest not found", [{
        field: "guestId",
        message: "Guest does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    if (!room) {
      return errorResponse("Room not found", [{
        field: "roomId",
        message: "Room does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    // Check room availability
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
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

    // Create booking and update room status
    const result = await prisma.$transaction(async (tx) => {
      // Generate booking reference
      const bookingCount = await tx.booking.count();
      const bookingRef = `BK${String(bookingCount + 1).padStart(8, "0")}`;

      // Create booking
      const booking = await tx.booking.create({
        data: {
          bookingRef,
          guestId,
          guestName: guest.name,
          guestEmail: guest.email,
          guestPhone: guest.phone,
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
          paymentStatus: paymentStatus,
          status: paymentStatus === "paid" ? "confirmed" : "pending",
          branchId: room.branchId,
        },
        include: {
          guest: true,
          room: true,
          branch: true,
        }
      });

      // Update room status based on payment
      const newRoomStatus = paymentStatus === "paid" ? "reserved" : "available";
      await tx.room.update({
        where: { id: roomId },
        data: { status: newRoomStatus }
      });

      // Update guest total spent if paid
      if (paymentStatus === "paid") {
        await tx.guest.update({
          where: { id: guestId },
          data: {
            totalSpent: { increment: calculatedTotal },
            lastVisit: new Date(),
          }
        });
      }

      return booking;
    });

    return successResponse({
      message: "Room assigned successfully",
      booking: result,
      roomStatus: paymentStatus === "paid" ? "reserved" : "available",
    }, 201);

  } catch (error: any) {
    console.error("Room assignment error:", error);
    return errorResponse("Failed to assign room", [], 500);
  }
}