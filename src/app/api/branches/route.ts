import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/branches - Get all branches with analytics
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeAnalytics = searchParams.get("analytics") === "true";
        const includeStats = searchParams.get("stats") === "true";

        // Filter by branch for non-admin users
        const filters: any = {};
        if (session.user.role === "RECEPTIONIST" || session.user.role === "WAITER" || session.user.role === "HOUSEKEEPING") {
            filters.id = session.user.branchId;
        }

        const branches = await prisma.branch.findMany({
            where: filters,
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
                ...(includeStats && {
                    _count: {
                        select: {
                            rooms: true,
                            bookings: true,
                            orders: true,
                            guests: true,
                            events: true,
                        },
                    },
                }),
            },
            orderBy: {
                name: "asc",
            },
        });

        // Add real-time analytics if requested
        if (includeAnalytics) {
            const branchesWithAnalytics = await Promise.all(
                branches.map(async (branch: any) => {
                    // Get occupancy rate
                    const totalRooms = await prisma.room.count({
                        where: { branchId: branch.id },
                    });

                    const occupiedRooms = await prisma.room.count({
                        where: {
                            branchId: branch.id,
                            status: "OCCUPIED",
                        },
                    });

                    // Get today's revenue
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);

                    const todayBookings = await prisma.booking.findMany({
                        where: {
                            branchId: branch.id,
                            createdAt: { gte: todayStart },
                            status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
                        },
                        select: { finalAmount: true },
                    });

                    const todayOrders = await prisma.order.findMany({
                        where: {
                            branchId: branch.id,
                            createdAt: { gte: todayStart },
                            status: "COMPLETED",
                        },
                        select: { total: true },
                    });

                    const todayRevenue =
                        todayBookings.reduce((sum: number, b: { finalAmount: number }) => sum + b.finalAmount, 0) +
                        todayOrders.reduce((sum: number, o: { total: number }) => sum + o.total, 0);

                    return {
                        ...branch,
                        analytics: {
                            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
                            todayRevenue,
                            totalRooms,
                            occupiedRooms,
                            availableRooms: totalRooms - occupiedRooms,
                        },
                    };
                })
            );

            return NextResponse.json(branchesWithAnalytics);
        }

        return NextResponse.json(branches);
    } catch (error) {
        console.error("Error fetching branches:", error);
        return NextResponse.json(
            { error: "Failed to fetch branches" },
            { status: 500 }
        );
    }
}

// POST /api/branches - Create new branch (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const branchSchema = z.object({
            name: z.string().min(3),
            location: z.string().min(5),
            city: z.string().min(2),
            province: z.string().min(2),
            phone: z.string(),
            email: z.string().email(),
            totalRooms: z.number().int().positive(),
            managerName: z.string().optional(),
            amenities: z.array(z.string()).optional(),
            description: z.string().optional(),
        });

        const body = await request.json();
        const validatedData = branchSchema.parse(body);

        const branch = await prisma.branch.create({
            data: {
                name: validatedData.name,
                location: validatedData.location,
                city: validatedData.city,
                province: validatedData.province,
                phone: validatedData.phone,
                email: validatedData.email,
                totalRooms: validatedData.totalRooms,
                managerName: validatedData.managerName,
                amenities: validatedData.amenities || [],
                description: validatedData.description,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error) {
        console.error("Error creating branch:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create branch" },
            { status: 500 }
        );
    }
}
