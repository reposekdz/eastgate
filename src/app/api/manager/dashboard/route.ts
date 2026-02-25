/**
 * Manager Dashboard API
 * Branch managers see only their branch data; Super Admin/Manager see all branches
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-advanced";
import { successResponse, errorResponse } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", [], 401);

    const isSuperUser = user.role === "SUPER_ADMIN" || user.role === "SUPER_MANAGER";
    const isManager = user.role === "BRANCH_MANAGER" || isSuperUser;

    if (!isManager) {
      return errorResponse("Only managers can access dashboard", [], 403);
    }

    // Branch filter: Super users see all, managers see only their branch
    const branchFilter = isSuperUser ? {} : { branchId: user.branchId };

    // Fetch dashboard data in parallel
    const [
      branches,
      totalBookings,
      bookingStats,
      revenueStats,
      occupancyStats,
      staffStats,
      recentBookings,
      topRooms,
      expenseData,
    ] = await Promise.all([
      // Branches accessible to this user
      prisma.branch.findMany({
        where: isSuperUser ? undefined : { id: user.branchId },
        select: {
          id: true,
          name: true,
          location: true,
          phone: true,
          email: true,
          totalRooms: true,
          rating: true,
        },
      }),

      // Total bookings count
      prisma.booking.count({ where: branchFilter }),

      // Booking status breakdown
      prisma.booking.groupBy({
        by: ["status"],
        where: branchFilter,
        _count: true,
      }),

      // Revenue stats (last 30 days)
      prisma.booking.aggregate({
        where: {
          ...branchFilter,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),

      // Room occupancy
      prisma.room.groupBy({
        by: ["status"],
        where: branchFilter,
        _count: true,
      }),

      // Staff count by role
      prisma.staff.groupBy({
        by: ["role"],
        where: branchFilter,
        _count: true,
      }),

      // Recent bookings
      prisma.booking.findMany({
        where: branchFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          room: { select: { number: true, type: true } },
          guest: { select: { name: true, email: true, phone: true } },
        },
      }),

      // Top performing rooms
      prisma.booking.groupBy({
        by: ["roomId"],
        where: branchFilter,
        _count: true,
        _sum: { totalAmount: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      // Expense data
      prisma.expense.groupBy({
        by: ["category"],
        where: branchFilter,
        _sum: { amount: true },
      }),
    ]);

    // Calculate KPIs
    const occupiedRooms =
      occupancyStats.find((s) => s.status === "occupied")?._count || 0;
    const totalRooms = occupancyStats.reduce((sum, s) => sum + s._count, 0);
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const confirmed = bookingStats.find((s) => s.status === "confirmed")?._count || 0;
    const checkedIn = bookingStats.find((s) => s.status === "checked_in")?._count || 0;
    const revenue = revenueStats._sum.totalAmount || 0;
    const avgBookingValue = revenueStats._avg.totalAmount || 0;

    return successResponse({
      branch: branches.length === 1 ? branches[0] : branches,
      kpis: {
        totalBookings,
        confirmed,
        checkedIn,
        occupancyRate: Math.round(occupancyRate),
        totalRevenue: revenue,
        avgBookingValue: Math.round(avgBookingValue),
      },
      bookingStatus: bookingStats.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      occupancy: {
        occupied: occupiedRooms,
        available: occupancyStats.find((s) => s.status === "available")?._count || 0,
        maintenance: occupancyStats.find((s) => s.status === "maintenance")?._count || 0,
        cleaning: occupancyStats.find((s) => s.status === "cleaning")?._count || 0,
        total: totalRooms,
      },
      staffByRole: staffStats.map((s) => ({
        role: s.role,
        count: s._count,
      })),
      recentBookings,
      topRooms,
      expenses: expenseData,
    });
  } catch (error: any) {
    console.error("Dashboard fetch error:", error);
    return errorResponse("Failed to fetch dashboard data", [], 500);
  }
}
