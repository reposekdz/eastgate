import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/guests/[id] - Get specific guest with details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const guest = await prisma.guest.findUnique({
            where: { id },
            include: {
                bookings: {
                    include: {
                        room: {
                            select: {
                                number: true,
                                type: true,
                            },
                        },
                        branch: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 10,
                },
                reviews: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 5,
                },
                branch: true,
            },
        });

        if (!guest) {
            return NextResponse.json({ error: "Guest not found" }, { status: 404 });
        }

        return NextResponse.json(guest);
    } catch (error) {
        console.error("Error fetching guest:", error);
        return NextResponse.json(
            { error: "Failed to fetch guest" },
            { status: 500 }
        );
    }
}

// PATCH /api/guests/[id] - Update guest
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const guest = await prisma.guest.update({
            where: { id },
            data: {
                ...(body.firstName && { firstName: body.firstName }),
                ...(body.lastName && { lastName: body.lastName }),
                ...(body.phone && { phone: body.phone }),
                ...(body.address && { address: body.address }),
                ...(body.city && { city: body.city }),
                ...(body.country && { country: body.country }),
                ...(body.preferences && { preferences: body.preferences }),
                ...(body.specialRequests !== undefined && { specialRequests: body.specialRequests }),
                ...(body.loyaltyTier && { loyaltyTier: body.loyaltyTier }),
                ...(body.newsletter !== undefined && { newsletter: body.newsletter }),
                ...(body.marketingConsent !== undefined && { marketingConsent: body.marketingConsent }),
            },
        });

        return NextResponse.json(guest);
    } catch (error) {
        console.error("Error updating guest:", error);
        return NextResponse.json(
            { error: "Failed to update guest" },
            { status: 500 }
        );
    }
}
