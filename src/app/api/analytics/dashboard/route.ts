import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/analytics/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const period = searchParams.get("period") || "month"; // day, week, month, year

        // Determine date range
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case "day":
                startDate.setHours(0, 0, 0, 0);
                break;
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Branch filter based on role
        const branchFilter: any = {};
        if (session.user.role === "RECEPTIONIST" || session.user.role === "BRANCH_MANAGER" || session.user.role === "WAITER") {
            branchFilter.branchId = session.user.branchId;
        } else if (branchId) {
            branchFilter.branchId = branchId;
        }

        // Get total revenue
        const bookings = await prisma.booking.findMany({
            where: {
                ...branchFilter,
                createdAt: { gte: startDate },
                status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
            },
            select: {
                finalAmount: true,
            },
        });

        const totalRevenue = bookings.reduce((sum: number, b: { finalAmount: number }) => sum + b.finalAmount, 0);

        // Get restaurant revenue
        const orders = await prisma.order.findMany({
            where: {
                ...branchFilter,
                createdAt: { gte: startDate },
                status: { in: ["COMPLETED", "SERVED"] },
            },
            select: {
                total: true,
            },
        });

        const restaurantRevenue = orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

        // Get occupancy rate
        const totalRooms = await prisma.room.count({
            where: branchFilter,
        });

        const occupiedRooms = await prisma.room.count({
            where: {
                ...branchFilter,
                status: "OCCUPIED",
            },
        });

        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Get room status breakdown
        const roomStatusBreakdown = await prisma.room.groupBy({
            by: ["status"],
            where: branchFilter,
            _count: {
                status: true,
            },
        });

        // Get today's check-ins and check-outs
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayCheckIns = await prisma.booking.count({
            where: {
                ...branchFilter,
                checkInDate: { gte: todayStart, lte: todayEnd },
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
        });

        const todayCheckOuts = await prisma.booking.count({
            where: {
                ...branchFilter,
                checkOutDate: { gte: todayStart, lte: todayEnd },
                status: "CHECKED_IN",
            },
        });

        // Get total guests (unique)
        const totalGuests = await prisma.guest.count({
            where: branchFilter.branchId ? { branchId: branchFilter.branchId } : {},
        });

        // Get recent bookings
        const recentBookings = await prisma.booking.findMany({
            where: {
                ...branchFilter,
                createdAt: { gte: startDate },
            },
            include: {
                guest: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
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
            take: 10,
        });

        // Calculate ADR (Average Daily Rate)
        const adr = bookings.length > 0
            ? totalRevenue / bookings.reduce((sum: number, b: { finalAmount: number }) => sum + (b.finalAmount > 0 ? 1 : 0), 0)
            : 0;

        // Calculate RevPAR (Revenue Per Available Room)
        const daysInPeriod = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const revpar = totalRooms > 0 && daysInPeriod > 0
            ? totalRevenue / (totalRooms * daysInPeriod)
            : 0;

        // Get monthly revenue trend (last 12 months)
        const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        SUM(final_amount) as revenue
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '12 months'
        AND status IN ('CHECKED_IN', 'CHECKED_OUT')
        ${branchFilter.branchId ? prisma.$queryRawUnsafe(`AND branch_id = '${branchFilter.branchId}'`) : prisma.$queryRawUnsafe('')}
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `;

        return NextResponse.json({
            kpi: {
                totalRevenue,
                restaurantRevenue,
                occupancyRate: Math.round(occupancyRate * 10) / 10,
                adr: Math.round(adr),
                revpar: Math.round(revpar),
                totalGuests,
                todayCheckIns,
                todayCheckOuts,
                totalRooms,
                occupiedRooms,
            },
            roomStatusBreakdown,
            recentBookings,
            monthlyRevenue,
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
