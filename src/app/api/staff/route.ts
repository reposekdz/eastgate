import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/staff - Get all staff members
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const role = searchParams.get("role");
        const status = searchParams.get("status");

        const filters: any = {};

        // Branch filter
        if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUPER_MANAGER") {
            filters.branchId = session.user.branchId;
        } else if (branchId) {
            filters.branchId = branchId;
        }

        if (role) filters.role = role;
        if (status) filters.status = status;
        else filters.status = "ACTIVE"; // Default to active staff

        // Exclude guests from staff list if user table is shared
        filters.role = { not: "GUEST" }; // Assuming GUEST is a role to exclude if applicable, though guests are usually in Guest table. 
        // In our schema Users are staff/admins. Guests are in Guest table.
        // But let's be safe and assume all Users are staff/admin.

        const staff = await prisma.user.findMany({
            where: filters,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                status: true,
                branch: {
                    select: { name: true },
                },
                _count: {
                    select: {
                        assignedServices: { where: { status: "IN_PROGRESS" } },
                        createdBookings: true,
                    }
                }
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(staff);
    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json(
            { error: "Failed to fetch staff" },
            { status: 500 }
        );
    }
}

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only Admins and Managers can create staff
        if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const staffSchema = z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            role: z.enum([
                "RECEPTIONIST", "WAITER", "HOUSEKEEPING", "CHEF",
                "SECURITY", "MAINTENANCE", "ACCOUNTANT", "EVENT_MANAGER",
                "BRANCH_MANAGER"
            ]),
            phone: z.string().optional(),
            branchId: z.string().optional(),
        });

        const body = await request.json();
        const validatedData = staffSchema.parse(body);

        const branchId = validatedData.branchId || session.user.branchId;

        // Branch Manager can only create staff for their branch
        if (session.user.role === "BRANCH_MANAGER" && branchId !== session.user.branchId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const user = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
                role: validatedData.role,
                phone: validatedData.phone,
                branchId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating staff:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create staff" },
            { status: 500 }
        );
    }
}
