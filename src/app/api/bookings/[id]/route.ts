import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/bookings/[id] - Get specific booking
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: {
                guest: true,
                room: {
                    include: {
                        branch: true,
                    },
                },
                payments: true,
                services: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Check access permissions
        if (
            session.user.role !== "SUPER_ADMIN" &&
            session.user.role !== "SUPER_MANAGER" &&
            booking.branchId !== session.user.branchId
        ) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Error fetching booking:", error);
        return NextResponse.json(
            { error: "Failed to fetch booking" },
            { status: 500 }
        );
    }
}

// PATCH /api/bookings/[id] - Update booking
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { status, paymentStatus, actualCheckIn, actualCheckOut, notes } = body;

        // Get existing booking
        const existingBooking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: { room: true },
        });

        if (!existingBooking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Check permissions
        if (
            session.user.role !== "SUPER_ADMIN" &&
            session.user.role !== "SUPER_MANAGER" &&
            existingBooking.branchId !== session.user.branchId
        ) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Update booking
        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: {
                ...(status && { status }),
                ...(paymentStatus && { paymentStatus }),
                ...(actualCheckIn && { actualCheckIn: new Date(actualCheckIn) }),
                ...(actualCheckOut && { actualCheckOut: new Date(actualCheckOut) }),
                ...(notes && { notes }),
            },
            include: {
                guest: true,
                room: true,
            },
        });

        // Update room status based on booking status
        if (status === "CHECKED_IN") {
            await prisma.room.update({
                where: { id: existingBooking.roomId },
                data: {
                    status: "OCCUPIED",
                    currentGuestId: existingBooking.guestId,
                },
            });
        } else if (status === "CHECKED_OUT") {
            await prisma.room.update({
                where: { id: existingBooking.roomId },
                data: {
                    status: "CLEANING",
                    currentGuestId: null,
                },
            });
        } else if (status === "CANCELLED") {
            await prisma.room.update({
                where: { id: existingBooking.roomId },
                data: { status: "AVAILABLE" },
            });
        }

        return NextResponse.json(updatedBooking);
    } catch (error) {
        console.error("Error updating booking:", error);
        return NextResponse.json(
            { error: "Failed to update booking" },
            { status: 500 }
        );
    }
}
