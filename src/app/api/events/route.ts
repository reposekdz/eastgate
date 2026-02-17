import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/events - Get all events
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const status = searchParams.get("status");
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const filters: any = {};

        // Branch filter
        if (session.user.role === "RECEPTIONIST" || session.user.role === "BRANCH_MANAGER" || session.user.role === "EVENT_MANAGER") {
            filters.branchId = session.user.branchId;
        } else if (branchId) {
            filters.branchId = branchId;
        }

        if (status) filters.status = status;

        if (from || to) {
            filters.startDate = {};
            if (from) filters.startDate.gte = new Date(from);
            if (to) filters.startDate.lte = new Date(to);
        }

        const events = await prisma.event.findMany({
            where: filters,
            include: {
                branch: {
                    select: { name: true },
                },
                createdBy: {
                    select: { name: true },
                },
            },
            orderBy: {
                startDate: "asc",
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventSchema = z.object({
            name: z.string().min(3),
            type: z.enum(["CONFERENCE", "WEDDING", "MEETING", "PARTY", "OTHER"]),
            startDate: z.string().datetime(),
            endDate: z.string().datetime(),
            attendees: z.number().int().positive(),
            description: z.string().optional(),
            requirements: z.string().optional(),
            totalAmount: z.number().positive(),
            clientName: z.string().min(2),
            clientEmail: z.string().email(),
            clientPhone: z.string(),
            branchId: z.string().optional(),
        });

        const body = await request.json();
        const validatedData = eventSchema.parse(body);

        const branchId = validatedData.branchId || session.user.branchId;
        if (!branchId) {
            return NextResponse.json(
                { error: "Branch ID is required" },
                { status: 400 }
            );
        }

        const event = await prisma.event.create({
            data: {
                name: validatedData.name,
                type: validatedData.type,
                startDate: new Date(validatedData.startDate),
                endDate: new Date(validatedData.endDate),
                attendees: validatedData.attendees,
                description: validatedData.description,
                requirements: validatedData.requirements,
                totalAmount: validatedData.totalAmount,
                status: "CONFIRMED",
                paymentStatus: "PENDING",
                clientName: validatedData.clientName,
                clientEmail: validatedData.clientEmail,
                clientPhone: validatedData.clientPhone,
                branchId,
                createdById: session.user.id,
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
        );
    }
}
