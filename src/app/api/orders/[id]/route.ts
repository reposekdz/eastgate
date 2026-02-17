import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Role Check
        const allowedRoles = [
            "SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER",
            "WAITER", "RESTAURANT_STAFF", "CHEF", "KITCHEN_STAFF"
        ];

        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const { status, paymentStatus, paymentMethod } = body;

        const updateData: any = {};
        if (status) {
            updateData.status = status;

            // Track status transitions
            if (status === "PREPARING") updateData.sentToKitchen = new Date();
            if (status === "READY") updateData.preparedAt = new Date();
            if (status === "SERVED") updateData.servedAt = new Date();
        }

        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (paymentMethod) updateData.paymentMethod = paymentMethod;

        const order = await prisma.order.update({
            where: { id: params.id },
            data: updateData,
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}
