import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

/**
 * GET /api/rooms
 * Fetch rooms with availability and role-based access
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
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const floor = searchParams.get("floor");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const sortBy = searchParams.get("sortBy") || "number";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const where: any = {};

    // Role-based filtering
    const isSuperRole = ["super_admin", "super_manager"].includes(user.role);
    
    if (!isSuperRole) {
      // Non-super users can only see rooms from their branch
      where.branchId = user.branchId;
    } else if (branchId && branchId !== "all") {
      // Super users can filter by specific branch
      where.branchId = branchId;
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // Type filter
    if (type && type !== "all") {
      where.type = type;
    }

    // Floor filter
    if (floor) {
      where.floor = parseInt(floor);
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Availability filter for specific dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // Find rooms that don't have conflicting bookings
      const conflictingRoomIds = await prisma.booking.findMany({
        where: {
          status: { in: ["pending", "confirmed", "checked_in"] },
          OR: [{
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          }],
        },
        select: { roomId: true }
      });

      if (conflictingRoomIds.length > 0) {
        where.id = {
          notIn: conflictingRoomIds.map(b => b.roomId)
        };
      }
    }

    const [rooms, total, statusCounts, typeCounts] = await Promise.all([
      prisma.room.findMany({
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
            },
          },
          bookings: {
            where: {
              status: { in: ["pending", "confirmed", "checked_in"] },
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
            take: 3,
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
      prisma.room.count({ where }),
      prisma.room.groupBy({
        by: ["status"],
        where: where.branchId ? { branchId: where.branchId } : {},
        _count: true,
      }),
      prisma.room.groupBy({
        by: ["type"],
        where: where.branchId ? { branchId: where.branchId } : {},
        _count: true,
        _avg: {
          price: true,
        },
      }),
    ]);

    // Calculate statistics
    const stats = {
      total,
      available: statusCounts.find((s) => s.status === "available")?._count || 0,
      occupied: statusCounts.find((s) => s.status === "occupied")?._count || 0,
      cleaning: statusCounts.find((s) => s.status === "cleaning")?._count || 0,
      maintenance: statusCounts.find((s) => s.status === "maintenance")?._count || 0,
      reserved: statusCounts.find((s) => s.status === "reserved")?._count || 0,
      occupancyRate: total > 0 ? ((statusCounts.find((s) => s.status === "occupied")?._count || 0) / total) * 100 : 0,
      typeBreakdown: typeCounts.map(t => ({
        type: t.type,
        count: t._count,
        avgPrice: t._avg.price || 0,
      })),
    };

    return successResponse({
      rooms,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      userRole: user.role,
      branchFilter: where.branchId || "all",
      availabilityFilter: checkIn && checkOut ? { checkIn, checkOut } : null,
    });
  } catch (error: any) {
    console.error("Rooms fetch error:", error);
    return errorResponse("Failed to fetch rooms", [], 500);
  }
}

/**
 * POST /api/rooms
 * Create new room (admin only)
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
    
    // Only admins and managers can create rooms
    const canCreateRoom = ["super_admin", "super_manager", "branch_manager", "branch_admin"].includes(user.role);
    
    if (!canCreateRoom) {
      return errorResponse("Insufficient permissions", [{
        field: "role",
        message: "Only admins and managers can create rooms",
        code: "FORBIDDEN"
      }], 403);
    }

    const body = await req.json();
    const {
      number,
      type,
      floor,
      price,
      description,
      amenities,
      imageUrl,
      maxOccupancy,
      branchId,
    } = body;

    // Use user's branch if not super role
    const finalBranchId = ["super_admin", "super_manager"].includes(user.role) ? branchId : user.branchId;

    // Validation
    const required = { number, type, floor, price, branchId: finalBranchId };
    const missing = Object.entries(required)
      .filter(([_, v]) => v === null || v === undefined || v === "")
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

    // Check if room number already exists in branch
    const existingRoom = await prisma.room.findFirst({
      where: {
        number,
        branchId: finalBranchId,
      }
    });

    if (existingRoom) {
      return errorResponse("Room already exists", [{
        field: "number",
        message: "A room with this number already exists in this branch",
        code: "DUPLICATE"
      }], 409);
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        number,
        type,
        floor: parseInt(floor),
        price: parseFloat(price),
        description: description || null,
        imageUrl: imageUrl || null,
        maxOccupancy: maxOccupancy || 2,
        status: "available",
        branchId: finalBranchId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      }
    });

    return successResponse({ room }, 201);
  } catch (error: any) {
    console.error("Room creation error:", error);
    return errorResponse("Failed to create room", [], 500);
  }
}

/**
 * PUT /api/rooms
 * Update room status or details
 */
export async function PUT(req: NextRequest) {
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
    
    // Receptionists and managers can update room status
    const canUpdateRoom = ["receptionist", "branch_manager", "branch_admin", "super_admin", "super_manager"].includes(user.role);
    
    if (!canUpdateRoom) {
      return errorResponse("Insufficient permissions", [{
        field: "role",
        message: "Only receptionists and managers can update rooms",
        code: "FORBIDDEN"
      }], 403);
    }

    const body = await req.json();
    const { id, status, price, description, amenities, imageUrl } = body;

    if (!id) {
      return errorResponse("Validation failed", [{
        field: "id",
        message: "Room ID is required",
        code: "REQUIRED"
      }], 400);
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id }
    });

    if (!existingRoom) {
      return errorResponse("Room not found", [{
        field: "id",
        message: "Room does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    // Check branch access for non-super users
    const isSuperRole = ["super_admin", "super_manager"].includes(user.role);
    if (!isSuperRole && existingRoom.branchId !== user.branchId) {
      return errorResponse("Insufficient permissions", [{
        field: "branchId",
        message: "You can only update rooms in your branch",
        code: "FORBIDDEN"
      }], 403);
    }

    const updateData: any = {};
    
    if (status) {
      const validStatuses = ["available", "occupied", "cleaning", "maintenance", "reserved"];
      if (!validStatuses.includes(status)) {
        return errorResponse("Invalid status", [{
          field: "status",
          message: `Must be one of: ${validStatuses.join(", ")}`,
          code: "INVALID"
        }], 400);
      }
      updateData.status = status;
    }

    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Update room
    const room = await prisma.room.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      }
    });

    return successResponse({ room });
  } catch (error: any) {
    console.error("Room update error:", error);
    return errorResponse("Failed to update room", [], 500);
  }
}