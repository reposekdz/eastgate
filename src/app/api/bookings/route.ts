import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema
const bookingSchema = z.object({
    guestId: z.string().optional(),
    guestInfo: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        nationality: z.string().optional(),
        idType: z.string().optional(),
        idNumber: z.string().optional(),
    }).optional(),
    roomId: z.string(),
    checkInDate: z.string(),
    checkOutDate: z.string(),
    adults: z.number().min(1),
    children: z.number().default(0),
    addOns: z.array(z.string()).default([]),
    specialRequests: z.string().optional(),
    paymentMethod: z.enum([
        "CASH",
        "VISA",
        "MASTERCARD",
        "AMEX",
        "STRIPE",
        "PAYPAL",
        "MTN_MOBILE",
        "AIRTEL_MONEY",
        "BANK_TRANSFER",
    ]).optional(),
    source: z.enum([
        "WEBSITE",
        "PHONE",
        "WALK_IN",
        "BOOKING_COM",
        "EXPEDIA",
        "AGENT",
        "CORPORATE",
    ]).default("WEBSITE"),
});

// GET /api/bookings - Get all bookings with optional filters
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const status = searchParams.get("status");
        const guestId = searchParams.get("guestId");
        const roomId = searchParams.get("roomId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build filters based on user role
        const filters: any = {};

        // Branch filter based on role
        if (session.user.role === "RECEPTIONIST" || session.user.role === "BRANCH_MANAGER") {
            filters.branchId = session.user.branchId;
        } else if (branchId && (session.user.role === "SUPER_ADMIN" || session.user.role === "SUPER_MANAGER")) {
            filters.branchId = branchId;
        }

        if (status) filters.status = status;
        if (guestId) filters.guestId = guestId;
        if (roomId) filters.roomId = roomId;

        if (startDate || endDate) {
            filters.checkInDate = {};
            if (startDate) filters.checkInDate.gte = new Date(startDate);
            if (endDate) filters.checkInDate.lte = new Date(endDate);
        }

        const bookings = await prisma.booking.findMany({
            where: filters,
            include: {
                guest: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        loyaltyTier: true,
                    },
                },
                room: {
                    select: {
                        id: true,
                        number: true,
                        type: true,
                        floor: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        status: true,
                        processedAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: 500 }
        );
    }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const body = await request.json();

        // Validate request body
        const validatedData = bookingSchema.parse(body);

        // Calculate nights and pricing
        const checkIn = new Date(validatedData.checkInDate);
        const checkOut = new Date(validatedData.checkOutDate);
        const nights = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get room details
        const room = await prisma.room.findUnique({
            where: { id: validatedData.roomId },
            include: { branch: true },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check room availability
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                roomId: validatedData.roomId,
                status: {
                    in: ["CONFIRMED", "CHECKED_IN"],
                },
                OR: [
                    {
                        AND: [
                            { checkInDate: { lte: checkIn } },
                            { checkOutDate: { gt: checkIn } },
                        ],
                    },
                    {
                        AND: [
                            { checkInDate: { lt: checkOut } },
                            { checkOutDate: { gte: checkOut } },
                        ],
                    },
                    {
                        AND: [
                            { checkInDate: { gte: checkIn } },
                            { checkOutDate: { lte: checkOut } },
                        ],
                    },
                ],
            },
        });

        if (conflictingBooking) {
            return NextResponse.json(
                { error: "Room is not available for selected dates" },
                { status: 400 }
            );
        }

        // Calculate pricing
        const roomRate = room.price;
        const totalAmount = roomRate * nights;
        const taxRate = room.branch.taxRate || 0.18;
        const taxAmount = Math.round(totalAmount * taxRate);
        const finalAmount = totalAmount + taxAmount;

        // Handle guest creation or lookup
        let guest;
        if (validatedData.guestId) {
            guest = await prisma.guest.findUnique({
                where: { id: validatedData.guestId },
            });
        } else if (validatedData.guestInfo) {
            // Check if guest exists by email
            guest = await prisma.guest.findUnique({
                where: { email: validatedData.guestInfo.email },
            });

            if (!guest) {
                // Create new guest
                guest = await prisma.guest.create({
                    data: {
                        firstName: validatedData.guestInfo.firstName,
                        lastName: validatedData.guestInfo.lastName,
                        email: validatedData.guestInfo.email,
                        phone: validatedData.guestInfo.phone,
                        nationality: validatedData.guestInfo.nationality || "",
                        idType: validatedData.guestInfo.idType,
                        idNumber: validatedData.guestInfo.idNumber,
                        branchId: room.branchId,
                    },
                });
            }
        }

        if (!guest) {
            return NextResponse.json(
                { error: "Guest information required" },
                { status: 400 }
            );
        }

        // Generate booking number
        const bookingNumber = `BK-${Date.now()}`;

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                bookingNumber,
                guestId: guest.id,
                roomId: validatedData.roomId,
                branchId: room.branchId,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                nights,
                adults: validatedData.adults,
                children: validatedData.children,
                roomRate,
                totalAmount,
                taxAmount,
                finalAmount,
                status: "CONFIRMED",
                paymentStatus: "PENDING",
                paymentMethod: validatedData.paymentMethod,
                addOns: validatedData.addOns,
                specialRequests: validatedData.specialRequests,
                source: validatedData.source,
                createdById: session?.user?.id,
            },
            include: {
                guest: true,
                room: {
                    include: {
                        branch: true,
                    },
                },
            },
        });

        // Update room status to reserved
        await prisma.room.update({
            where: { id: validatedData.roomId },
            data: { status: "RESERVED" },
        });

        // Update guest statistics
        await prisma.guest.update({
            where: { id: guest.id },
            data: {
                totalStays: { increment: 1 },
                totalSpent: { increment: finalAmount },
                loyaltyPoints: { increment: Math.floor(finalAmount / 1000) },
                lastVisit: new Date(),
            },
        });

        // TODO: Send confirmation email
        // TODO: Create notification

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating booking:", error);
        return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
        );
    }
}
