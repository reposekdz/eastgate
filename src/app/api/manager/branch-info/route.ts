import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || decoded.branchId;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        managerAssignments: {
          where: { isActive: true },
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                level: true,
              },
            },
          },
        },
        _count: {
          select: {
            rooms: true,
            staff: { where: { status: "active" } },
            bookings: { where: { status: { in: ["confirmed", "checked_in"] } } },
            orders: { where: { status: { not: "served" } } },
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const [occupiedRooms, todayRevenue, activeOrders] = await Promise.all([
      prisma.room.count({
        where: { branchId, status: { in: ["occupied", "booked"] } },
      }),
      prisma.payment.aggregate({
        where: {
          branchId,
          status: "completed",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
      }),
      prisma.order.count({
        where: { branchId, status: { in: ["pending", "preparing"] } },
      }),
    ]);

    const occupancyRate = branch._count.rooms > 0 
      ? (occupiedRooms / branch._count.rooms) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      branch: {
        id: branch.id,
        name: branch.name,
        location: branch.location,
        city: branch.city,
        phone: branch.phone,
        email: branch.email,
        totalRooms: branch._count.rooms,
        activeStaff: branch._count.staff,
        activeBookings: branch._count.bookings,
        activeOrders: branch._count.orders,
        occupiedRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        todayRevenue: todayRevenue._sum.amount || 0,
        rating: branch.rating,
        isActive: branch.isActive,
        manager: branch.managerAssignments[0]?.manager || null,
      },
    });
  } catch (error) {
    console.error("Error fetching branch info:", error);
    return NextResponse.json({ error: "Failed to fetch branch info" }, { status: 500 });
  }
}
