import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/branches/[id] - Get branch details with comprehensive analytics
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const branch = await prisma.branch.findUnique({
            where: { id: params.id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                        avatar: true,
                        phone: true,
                    },
                },
                rooms: {
                    select: {
                        id: true,
                        number: true,
                        type: true,
                        status: true,
                        floor: true,
                        price: true,
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                        orders: true,
                        guests: true,
                        events: true,
                    },
                },
            },
        });

        if (!branch) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

        // Calculate detailed analytics
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Monthly revenue
        const monthlyBookings = await prisma.booking.findMany({
            where: {
                branchId: params.id,
                createdAt: { gte: monthStart },
                status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
            },
            select: { finalAmount: true },
        });

        const monthlyOrders = await prisma.order.findMany({
            where: {
                branchId: params.id,
                createdAt: { gte: monthStart },
                status: "COMPLETED",
            },
            select: { total: true },
        });

        const monthlyRevenue =
            monthlyBookings.reduce((sum: number, b: { finalAmount: number }) => sum + b.finalAmount, 0) +
            monthlyOrders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

        // Room statistics
        const roomStats = await prisma.room.groupBy({
            by: ["status"],
            where: { branchId: params.id },
            _count: { status: true },
        });

        // Today's activity
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayCheckIns = await prisma.booking.count({
            where: {
                branchId: params.id,
                checkInDate: { gte: todayStart, lte: todayEnd },
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
        });

        const todayCheckOuts = await prisma.booking.count({
            where: {
                branchId: params.id,
                checkOutDate: { gte: todayStart, lte: todayEnd },
                status: "CHECKED_IN",
            },
        });

        const todayOrders = await prisma.order.count({
            where: {
                branchId: params.id,
                createdAt: { gte: todayStart },
            },
        });

        // Staff statistics
        const staffByRole = await prisma.user.groupBy({
            by: ["role"],
            where: { branchId: params.id, status: "ACTIVE" },
            _count: { role: true },
        });

        return NextResponse.json({
            ...branch,
            analytics: {
                monthlyRevenue,
                roomStats: roomStats.reduce((acc: any, stat: any) => {
                    acc[stat.status] = stat._count.status;
                    return acc;
                }, {}),
                todayActivity: {
                    checkIns: todayCheckIns,
                    checkOuts: todayCheckOuts,
                    orders: todayOrders,
                },
                staffByRole: staffByRole.reduce((acc: any, stat: any) => {
                    acc[stat.role] = stat._count.role;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error("Error fetching branch:", error);
        return NextResponse.json(
            { error: "Failed to fetch branch" },
            { status: 500 }
        );
    }
}

// PATCH /api/branches/[id] - Update branch
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUPER_MANAGER") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const updateSchema = z.object({
            name: z.string().min(3).optional(),
            location: z.string().min(5).optional(),
            city: z.string().optional(),
            province: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().email().optional(),
            managerName: z.string().optional(),
            amenities: z.array(z.string()).optional(),
            description: z.string().optional(),
            status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
            totalRooms: z.number().int().positive().optional(),
        });

        const body = await request.json();
        const validatedData = updateSchema.parse(body);

        const branch = await prisma.branch.update({
            where: { id: params.id },
            data: validatedData,
        });

        return NextResponse.json(branch);
    } catch (error) {
        console.error("Error updating branch:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update branch" },
            { status: 500 }
        );
    }
}

// DELETE /api/branches/[id] - Delete branch (Super Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Check if branch has active bookings or orders
        const activeBookings = await prisma.booking.count({
            where: {
                branchId: params.id,
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
            },
        });

        if (activeBookings > 0) {
            return NextResponse.json(
                { error: "Cannot delete branch with active bookings" },
                { status: 400 }
            );
        }

        await prisma.branch.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Branch deleted successfully" });
    } catch (error) {
        console.error("Error deleting branch:", error);
        return NextResponse.json(
            { error: "Failed to delete branch" },
            { status: 500 }
        );
    }
}
