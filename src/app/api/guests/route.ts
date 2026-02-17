import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/guests - Get all guests
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const search = searchParams.get("search");
        const loyaltyTier = searchParams.get("loyaltyTier");

        const filters: any = {};

        // Branch filter
        if (session.user.role === "RECEPTIONIST" || session.user.role === "BRANCH_MANAGER") {
            filters.branchId = session.user.branchId;
        } else if (branchId) {
            filters.branchId = branchId;
        }

        // Search by name, email, or phone
        if (search) {
            filters.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
            ];
        }

        if (loyaltyTier) {
            filters.loyaltyTier = loyaltyTier;
        }

        const guests = await prisma.guest.findMany({
            where: filters,
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        bookings: true,
                        reviews: true,
                    },
                },
            },
            orderBy: {
                lastVisit: "desc",
            },
        });

        return NextResponse.json(guests);
    } catch (error) {
        console.error("Error fetching guests:", error);
        return NextResponse.json(
            { error: "Failed to fetch guests" },
            { status: 500 }
        );
    }
}

// POST /api/guests - Create new guest
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Check if guest already exists
        const existingGuest = await prisma.guest.findUnique({
            where: { email: body.email },
        });

        if (existingGuest) {
            return NextResponse.json(
                { error: "Guest with this email already exists" },
                { status: 400 }
            );
        }

        const guest = await prisma.guest.create({
            data: {
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                phone: body.phone,
                nationality: body.nationality,
                dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
                gender: body.gender,
                idType: body.idType,
                idNumber: body.idNumber,
                idExpiry: body.idExpiry ? new Date(body.idExpiry) : undefined,
                address: body.address,
                city: body.city,
                country: body.country,
                postalCode: body.postalCode,
                preferences: body.preferences,
                specialRequests: body.specialRequests,
                newsletter: body.newsletter || false,
                marketingConsent: body.marketingConsent || false,
                branchId: body.branchId || session.user.branchId,
            },
        });

        return NextResponse.json(guest, { status: 201 });
    } catch (error) {
        console.error("Error creating guest:", error);
        return NextResponse.json(
            { error: "Failed to create guest" },
            { status: 500 }
        );
    }
}
