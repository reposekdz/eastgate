import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

/**
 * GET /api/guests
 * Fetch guests with role-based access and real-time data
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
    const search = searchParams.get("search");
    const loyaltyTier = searchParams.get("loyaltyTier");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    // Role-based filtering - all branch staff can see guests from their branch
    const isSuperRole = ["super_admin", "super_manager"].includes(user.role.toLowerCase());
    const isBranchStaff = ["branch_manager", "branch_admin", "receptionist", "waiter", "restaurant_staff"].includes(user.role.toLowerCase());
    
    if (!isSuperRole) {
      // All branch staff can see guests from their branch
      where.branchId = user.branchId;
    } else if (branchId && branchId !== "all") {
      // Super users can filter by specific branch
      where.branchId = branchId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { idNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Loyalty tier filter
    if (loyaltyTier && loyaltyTier !== "all") {
      where.loyaltyTier = loyaltyTier;
    }

    const [guests, total, loyaltyStats] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          bookings: {
            select: {
              id: true,
              bookingRef: true,
              status: true,
              checkIn: true,
              checkOut: true,
              totalAmount: true,
              roomNumber: true,
              branch: {
                select: {
                  name: true,
                }
              }
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              bookings: true,
            }
          }
        },
      }),
      prisma.guest.count({ where }),
      prisma.guest.groupBy({
        by: ["loyaltyTier"],
        _count: true,
        _sum: {
          totalSpent: true,
        },
      }),
    ]);

    // Calculate statistics
    const stats = {
      total,
      silver: loyaltyStats.find((s) => s.loyaltyTier === "silver")?._count || 0,
      gold: loyaltyStats.find((s) => s.loyaltyTier === "gold")?._count || 0,
      platinum: loyaltyStats.find((s) => s.loyaltyTier === "platinum")?._count || 0,
      regular: loyaltyStats.find((s) => s.loyaltyTier === null)?._count || 0,
      totalRevenue: loyaltyStats.reduce((sum, s) => sum + (s._sum.totalSpent || 0), 0),
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
      userRole: user.role,
      branchFilter: branchId || user.branchId,
    });
  } catch (error: any) {
    console.error("Guests fetch error:", error);
    return errorResponse("Failed to fetch guests", [], 500);
  }
}

/**
 * POST /api/guests
 * Create new guest (for walk-ins without booking)
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
    
    // All branch staff can create guests
    const canCreateGuest = ["receptionist", "branch_manager", "branch_admin", "super_admin", "super_manager", "waiter", "restaurant_staff"].includes(user.role.toLowerCase());
    
    if (!canCreateGuest) {
      return errorResponse("Insufficient permissions", [{        field: "role",
        message: "Only branch staff can create guests",
        code: "FORBIDDEN"
      }], 403);
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      nationality,
      idNumber,
      address,
      dateOfBirth,
    } = body;

    // Validation
    const required = { name, email, phone };
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

    // Check if guest already exists
    const existingGuest = await prisma.guest.findUnique({
      where: { email }
    });

    if (existingGuest) {
      return errorResponse("Guest already exists", [{
        field: "email",
        message: "A guest with this email already exists",
        code: "DUPLICATE"
      }], 409);
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        phone,
        nationality: nationality || "Rwanda",
        idNumber,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        avatar: `https://i.pravatar.cc/40?u=${email}`,
        totalSpent: 0,
        loyaltyTier: "bronze",
        branch: {
          connect: {
            id: user.branchId
          }
        }
      }
    });

    return successResponse({ guest }, 201);
  } catch (error: any) {
    console.error("Guest creation error:", error);
    return errorResponse("Failed to create guest", [], 500);
  }
}