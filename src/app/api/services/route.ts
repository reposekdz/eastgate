import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/services - Get all service requests
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
        const department = searchParams.get("department");

        const filters: any = {};

        // Branch filter
        if (session.user.role === "RECEPTIONIST" || session.user.role === "BRANCH_MANAGER" || session.user.role === "HOUSEKEEPING" || session.user.role === "MAINTENANCE") {
            filters.branchId = session.user.branchId;
        } else if (branchId) {
            filters.branchId = branchId;
        }

        if (status) filters.status = status;
        if (type) filters.type = type;
        if (department) filters.department = department;

        const services = await prisma.service.findMany({
            where: filters,
            include: {
                booking: {
                    select: {
                        guest: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json(
            { error: "Failed to fetch services" },
            { status: 500 }
        );
    }
}

// POST /api/services - Create new service request
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceSchema = z.object({
            type: z.enum(["HOUSEKEEPING", "MAINTENANCE", "ROOM_SERVICE", "SPA", "LAUNDRY", "CONCIERGE", "WAKE_UP_CALL", "OTHER"]),
            description: z.string().min(3),
            priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
            roomNumber: z.string().optional(),
            bookingId: z.string().optional(),
            branchId: z.string().optional(),
            scheduledFor: z.string().datetime().optional(),
        });

        const body = await request.json();
        const validatedData = serviceSchema.parse(body);

        const branchId = validatedData.branchId || session.user.branchId;
        if (!branchId) {
            return NextResponse.json(
                { error: "Branch ID is required" },
                { status: 400 }
            );
        }

        const service = await prisma.service.create({
            data: {
                type: validatedData.type,
                description: validatedData.description,
                priority: validatedData.priority,
                status: "REQUESTED",
                roomNumber: validatedData.roomNumber,
                bookingId: validatedData.bookingId,
                branchId,
                requestedAt: new Date(),
                scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
            },
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error) {
        console.error("Error creating service request:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create service request" },
            { status: 500 }
        );
    }
}

// PATCH /api/services - Update service request status
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, status, assignedToId, notes } = body;

        if (!id) {
            return NextResponse.json({ error: "Service ID required" }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (assignedToId) updateData.assignedToId = assignedToId;
        if (notes) updateData.notes = notes;

        const service = await prisma.service.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            ...service,
            room: { number: service.roomNumber },
        });
    } catch (error) {
        console.error("Error updating service:", error);
        return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
    }
}
