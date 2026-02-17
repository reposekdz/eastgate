import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const orderSchema = z.object({
    tableNumber: z.number().optional(),
    roomNumber: z.string().optional(),
    guestName: z.string().optional(),
    guestId: z.string().optional(),
    roomCharge: z.boolean().default(false),
    items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number().min(1),
        price: z.number(),
        notes: z.string().optional(),
        modifications: z.array(z.string()).default([]),
    })),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    specialRequests: z.string().optional(),
    branchId: z.string(),
});

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");
        const status = searchParams.get("status");
        const today = searchParams.get("today");

        const filters: any = {};

        // Branch filter
        if (session.user.role === "WAITER" || session.user.role === "RESTAURANT_STAFF" || session.user.role === "BRANCH_MANAGER") {
            filters.branchId = session.user.branchId;
        } else if (branchId) {
            filters.branchId = branchId;
        }

        if (status) filters.status = status;

        // Today's orders only
        if (today === "true") {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            filters.createdAt = { gte: startOfDay, lte: endOfDay };
        }

        const orders = await prisma.order.findMany({
            where: filters,
            include: {
                items: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                nameKinyarwanda: true,
                                category: true,
                                images: true,
                            },
                        },
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = orderSchema.parse(body);

        // Calculate totals
        const subtotal = validatedData.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // Get branch to calculate tax
        const branch = await prisma.branch.findUnique({
            where: { id: validatedData.branchId },
        });

        if (!branch) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

        const taxRate = branch.taxRate || 0.18;
        const tax = Math.round(subtotal * taxRate);
        const total = subtotal + tax;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}`;

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                tableNumber: validatedData.tableNumber,
                roomNumber: validatedData.roomNumber,
                guestName: validatedData.guestName,
                guestId: validatedData.guestId,
                roomCharge: validatedData.roomCharge,
                subtotal,
                tax,
                total,
                status: "PENDING",
                priority: validatedData.priority,
                branchId: validatedData.branchId,
                createdById: session.user.id,
                specialRequests: validatedData.specialRequests,
                sentToKitchen: new Date(),
                items: {
                    create: validatedData.items.map(item => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        price: item.price,
                        subtotal: item.price * item.quantity,
                        notes: item.notes,
                        modifications: item.modifications,
                        status: "PENDING",
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                branch: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // TODO: Send notification to kitchen
        // TODO: Send notification to waiter

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
