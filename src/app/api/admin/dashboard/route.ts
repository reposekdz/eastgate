import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSuperAdminOrManager, isBranchManager } from "@/lib/auth";

// GET - Fetch comprehensive dashboard data from database
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Determine branch filter
    const branchWhere = !isSuperAdmin(userRole) && userBranchId 
      ? { branchId: userBranchId } 
      : undefined;

    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branchId");
    const branchWhereFilter = branchIdParam && isSuperAdmin(userRole) 
      ? { branchId: branchIdParam } 
      : branchWhere;

    // Get room statistics
    const totalRooms = await prisma.room.count({
      where: branchWhereFilter as any,
    });

    const availableRooms = await prisma.room.count({
      where: {
        ...branchWhereFilter,
        status: "available",
      } as any,
    });

    const bookedRooms = await prisma.room.count({
      where: {
        ...branchWhereFilter,
        status: { in: ["booked", "occupied"] },
      } as any,
    });

    // Get booking statistics
    const totalBookings = await prisma.booking.count({
      where: branchWhereFilter as any,
    });

    const activeBookings = await prisma.booking.count({
      where: {
        ...branchWhereFilter,
        status: "confirmed",
      } as any,
    });

    // Get guest statistics
    const totalGuests = await prisma.guest.count({
      where: branchWhereFilter as any,
    });

    // Get order statistics
    const totalOrders = await prisma.order.count({
      where: branchWhereFilter as any,
    });

    const pendingOrders = await prisma.order.count({
      where: {
        ...branchWhereFilter,
        status: "pending",
      } as any,
    });

    const completedOrders = await prisma.order.count({
      where: {
        ...branchWhereFilter,
        status: "served",
      } as any,
    });

    // Get revenue
    const revenueResult = await prisma.booking.aggregate({
      where: {
        ...branchWhereFilter,
        status: "confirmed",
      } as any,
      _sum: {
        totalAmount: true,
      },
    });

    // Get recent bookings with room info
    const recentBookings = await prisma.booking.findMany({
      where: branchWhereFilter as any,
      include: {
        room: {
          select: {
            number: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: branchWhereFilter as any,
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get staff count
    const staffCount = await prisma.staff.count({
      where: {
        ...branchWhereFilter,
        status: "active",
      } as any,
    });

    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        rooms: {
          total: totalRooms,
          available: availableRooms,
          booked: bookedRooms,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          recent: recentBookings,
        },
        guests: {
          total: totalGuests,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          recent: recentOrders,
        },
        revenue: {
          total: revenueResult._sum.totalAmount || 0,
        },
        staff: {
          active: staffCount,
        },
        branchId: branchWhereFilter?.branchId || null,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// POST - Fetch branches list for super admin
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can access this
    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    // Get all branches
    const branches = await prisma.branch.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Get additional stats for each branch
    const branchesWithStats = await Promise.all(
      branches.map(async (branch) => {
        const [roomCount, staffCount, bookingCount, revenueResult] = await Promise.all([
          prisma.room.count({ where: { branchId: branch.id } }),
          prisma.staff.count({ where: { branchId: branch.id, status: "active" } }),
          prisma.booking.count({ where: { branchId: branch.id, status: "confirmed" } }),
          prisma.booking.aggregate({
            where: { branchId: branch.id, status: "confirmed" },
            _sum: { totalAmount: true },
          }),
        ]);

        return {
          id: branch.id,
          name: branch.name,
          location: branch.location,
          address: branch.address,
          isActive: branch.isActive,
          createdAt: branch.createdAt,
          roomCount,
          staffCount,
          bookingCount,
          revenue: revenueResult._sum.totalAmount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      branches: branchesWithStats,
    });
  } catch (error) {
    console.error("Branch fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}
