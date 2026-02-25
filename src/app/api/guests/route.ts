import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";

/**
 * GET /api/guests
 * Fetch guests with advanced filtering and analytics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const loyaltyTier = searchParams.get("loyaltyTier");
    const isVip = searchParams.get("isVip");
    const nationality = searchParams.get("nationality");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (loyaltyTier) where.loyaltyTier = loyaltyTier;
    if (isVip === "true") where.isVip = true;
    if (nationality) where.nationality = nationality;

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { idNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [guests, total, loyaltyStats, nationalityStats] = await Promise.all([
      prisma.guest.findMany({
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
            select: {
              id: true,
              status: true,
              checkIn: true,
              checkOut: true,
              totalAmount: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              bookings: true,
              orders: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.guest.count({ where }),
      prisma.guest.groupBy({
        by: ["loyaltyTier"],
        where: branchId ? { branchId } : {},
        _count: true,
      }),
      prisma.guest.groupBy({
        by: ["nationality"],
        where: branchId ? { branchId } : {},
        _count: true,
        orderBy: { _count: { nationality: "desc" } },
        take: 10,
      }),
    ]);

    // Calculate guest statistics
    const stats = {
      total,
      vip: await prisma.guest.count({ where: { ...where, isVip: true } }),
      bronze: loyaltyStats.find((s) => s.loyaltyTier === "bronze")?._count || 0,
      silver: loyaltyStats.find((s) => s.loyaltyTier === "silver")?._count || 0,
      gold: loyaltyStats.find((s) => s.loyaltyTier === "gold")?._count || 0,
      platinum: loyaltyStats.find((s) => s.loyaltyTier === "platinum")?._count || 0,
      topNationalities: nationalityStats.map((n) => ({
        nationality: n.nationality,
        count: n._count,
      })),
    };

    return successResponse({
      guests,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Guests fetch error:", error);
    return errorResponse("Failed to fetch guests", [], 500);
  }
}

/**
 * POST /api/guests
 * Create new guest
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      nationality,
      idType,
      idNumber,
      dateOfBirth,
      gender,
      address,
      city,
      country,
      branchId,
    } = body;

    // Validation
    const required = { name, email, branchId };
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

    // Check for duplicate email
    const existingGuest = await prisma.guest.findUnique({
      where: { email },
    });

    if (existingGuest) {
      return errorResponse(
        "Guest exists",
        [{
          field: "email",
          message: "A guest with this email already exists",
          code: "DUPLICATE"
        }],
        400
      );
    }

    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        phone: phone || null,
        nationality: nationality || null,
        idType: idType || null,
        idNumber: idNumber || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        address: address || null,
        city: city || null,
        country: country || null,
        branchId,
        loyaltyTier: "bronze",
        loyaltyPoints: 0,
        totalStays: 0,
        totalSpent: 0,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return successResponse({ guest }, 201);
  } catch (error: any) {
    console.error("Guest creation error:", error);
    return errorResponse("Failed to create guest", [], 500);
  }
}

/**
 * PUT /api/guests
 * Update guest
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Guest ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingGuest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!existingGuest) {
      return errorResponse(
        "Guest not found",
        [{
          field: "id",
          message: "Guest does not exist",
          code: "NOT_FOUND"
        }],
        404
      );
    }

    // Sanitize update data
    const allowedFields = [
      "name",
      "phone",
      "nationality",
      "idType",
      "idNumber",
      "dateOfBirth",
      "gender",
      "address",
      "city",
      "country",
      "loyaltyTier",
      "isVip",
      "notes",
      "preferences",
      "specialRequests",
    ];

    const updateData: any = {};
    Object.keys(updateFields).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (key === "dateOfBirth" && updateFields[key]) {
          updateData[key] = new Date(updateFields[key]);
        } else {
          updateData[key] = updateFields[key];
        }
      }
    });

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    return successResponse({ guest });
  } catch (error: any) {
    console.error("Guest update error:", error);
    return errorResponse("Failed to update guest", [], 500);
  }
}

/**
 * DELETE /api/guests
 * Delete guest
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Guest ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingGuest = await prisma.guest.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!existingGuest) {
      return errorResponse(
        "Guest not found",
        [{
          field: "id",
          message: "Guest does not exist",
          code: "NOT_FOUND"
        }],
        404
      );
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        guestId: id,
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
    });

    if (activeBookings > 0) {
      return errorResponse(
        "Cannot delete guest",
        [{
          field: "bookings",
          message: `Guest has ${activeBookings} active booking(s)`,
          code: "HAS_ACTIVE_BOOKINGS"
        }],
        400
      );
    }

    await prisma.guest.delete({
      where: { id },
    });

    return successResponse({ message: "Guest deleted successfully" });
  } catch (error: any) {
    console.error("Guest deletion error:", error);
    return errorResponse("Failed to delete guest", [], 500);
  }
}
