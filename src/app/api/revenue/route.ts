import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch revenue data with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Build date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dateFilter: any = {};
    if (dateFrom && dateTo) {
      dateFilter = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { gte: thirtyDaysAgo };
    }

    // Build branch filter
    let branchFilter: any = {};
    if (isSuperAdminOrManager(userRole)) {
      if (branchId) {
        branchFilter = { branchId: branchId };
      }
    } else {
      branchFilter = { branchId: userBranchId };
    }

    // Get revenue from bookings
    const bookingRevenue = await prisma.booking.aggregate({
      where: {
        ...branchFilter,
        status: { in: ["confirmed", "checked_in", "checked_out"] },
        createdAt: dateFilter,
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Get revenue from orders
    const orderRevenue = await prisma.order.aggregate({
      where: {
        ...branchFilter,
        status: { in: ["completed", "served"] },
        createdAt: dateFilter,
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    // Get branch information
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });

    // Get recent bookings for the branch
    const recentBookings = await prisma.booking.findMany({
      where: branchFilter,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        room: {
          select: { number: true, type: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings: {
          total: bookingRevenue._sum.totalAmount || 0,
          count: bookingRevenue._count,
        },
        orders: {
          total: orderRevenue._sum.total || 0,
          count: orderRevenue._count,
        },
        branches: branches.map(b => ({
          id: b.id,
          name: b.name,
          location: b.location,
        })),
        recentBookings,
      },
    });
  } catch (error) {
    console.error("Revenue fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}
