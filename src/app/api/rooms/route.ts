import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/rooms - Get all rooms with filters
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const floor = searchParams.get("floor");
        const available = searchParams.get("available");
        const search = searchParams.get("q");

        const filters: any = {};

        // Search functionality
        if (search) {
            filters.OR = [
                { number: { contains: search, mode: "insensitive" } },
                { type: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        // Branch filter
        if (session.user.role === "RECEPTIONIST" || session.user.role === "BRANCH_MANAGER") {
            filters.branchId = session.user.branchId;
        } else if (branchId) {
            filters.branchId = branchId;
        }

        if (status) filters.status = status;
        if (type) filters.type = type;
        if (floor) filters.floor = parseInt(floor);

        // Get available rooms for specific dates
        if (available === "true") {
            const checkIn = searchParams.get("checkIn");
            const checkOut = searchParams.get("checkOut");

            if (checkIn && checkOut) {
                // Get all rooms
                const allRooms = await prisma.room.findMany({
                    where: filters,
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                location: true,
                            },
                        },
                        currentGuest: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                });

                // Get conflicting bookings
                const conflictingBookings = await prisma.booking.findMany({
                    where: {
                        status: {
                            in: ["CONFIRMED", "CHECKED_IN"],
                        },
                        OR: [
                            {
                                AND: [
                                    { checkInDate: { lte: new Date(checkIn) } },
                                    { checkOutDate: { gt: new Date(checkIn) } },
                                ],
                            },
                            {
                                AND: [
                                    { checkInDate: { lt: new Date(checkOut) } },
                                    { checkOutDate: { gte: new Date(checkOut) } },
                                ],
                            },
                            {
                                AND: [
                                    { checkInDate: { gte: new Date(checkIn) } },
                                    { checkOutDate: { lte: new Date(checkOut) } },
                                ],
                            },
                        ],
                    },
                    select: {
                        roomId: true,
                    },
                });

                const bookedRoomIds = new Set(conflictingBookings.map(b => b.roomId));
                const availableRooms = allRooms.filter(room =>
                    !bookedRoomIds.has(room.id) &&
                    room.status !== "MAINTENANCE" &&
                    room.status !== "OUT_OF_SERVICE"
                );

                return NextResponse.json(availableRooms);
            }
        }

        const rooms = await prisma.room.findMany({
            where: filters,
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                    },
                },
                currentGuest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        loyaltyTier: true,
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                    },
                },
            },
            orderBy: [
                { floor: "asc" },
                { number: "asc" },
            ],
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json(
            { error: "Failed to fetch rooms" },
            { status: 500 }
        );
    }
}

// POST /api/rooms - Create new room (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUPER_MANAGER") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();

        const room = await prisma.room.create({
            data: {
                number: body.number,
                floor: body.floor,
                type: body.type,
                price: body.price,
                description: body.description,
                maxOccupancy: body.maxOccupancy || 2,
                size: body.size,
                view: body.view,
                amenities: body.amenities || [],
                images: body.images || [],
                branchId: body.branchId,
                status: "AVAILABLE",
            },
            include: {
                branch: true,
            },
        });

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json(
            { error: "Failed to create room" },
            { status: 500 }
        );
    }
}
