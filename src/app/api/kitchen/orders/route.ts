import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth-advanced/jwt";

const prisma = new PrismaClient();

const VALID_ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

/**
 * GET /api/kitchen/orders
 * Fetch all kitchen orders for current branch
 * Requires: CHEF or KITCHEN_STAFF role
 * Query: ?branchId=xxx&status=preparing&priority=high
 */
export async function GET(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Verify user role
    const user = await prisma.staff.findUnique({
      where: { id: decoded.userId },
      include: { role: true, branch: true },
    });

    if (!user || !["CHEF", "KITCHEN_STAFF", "MANAGER", "ADMIN"].includes(user.role?.name || "")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || user.branchId;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: any = {
      paymentStatus: "paid",
      status: { in: ["pending", "confirmed", "preparing", "ready"] },
      items: {
        some: {
          menuItem: {
            OR: [
              { category: "FOOD" },
              { category: "BEVERAGE" },
            ],
          },
        },
      },
    };

    if (branchId && branchId !== "undefined") {
      where.branchId = branchId;
    }

    if (status && VALID_ORDER_STATUSES.includes(status)) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                preparationTime: true,
                ingredients: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        booking: {
          select: {
            roomNumber: true,
            guestName: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // pending first
        { createdAt: "asc" }, // older first
      ],
    });

    // Add computed fields
    const enrichedOrders = orders.map((order) => ({
      ...order,
      itemCount: order.items.length,
      maxPreparationTime: Math.max(
        ...order.items.map((item) => item.menuItem?.preparationTime || 0),
        0
      ),
      estimatedCompletionTime: new Date(
        new Date(order.createdAt).getTime() +
          Math.max(...order.items.map((item) => item.menuItem?.preparationTime || 0), 0) * 60 * 1000
      ),
    }));

    return NextResponse.json(
      {
        success: true,
        orders: enrichedOrders,
        total: enrichedOrders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/kitchen/orders
 * Update kitchen order status
 * Requires: CHEF or KITCHEN_STAFF role
 * Body: { orderId, status, notes? }
 */
export async function PUT(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing or invalid Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Verify user role
    const user = await prisma.staff.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || !["CHEF", "KITCHEN_STAFF", "MANAGER", "ADMIN"].includes(user.role?.name || "")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, status, notes } = body;

    // Validate input
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user's branch
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { booking: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (user.branchId && order.branchId !== user.branchId && user.role?.name !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Order belongs to different branch" },
        { status: 403 }
      );
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        notes: notes || order.notes,
        updatedAt: new Date(),
        ...(status === "ready" && { readyAt: new Date() }),
        ...(status === "completed" && { completedAt: new Date() }),
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { name: true, preparationTime: true },
            },
          },
        },
        booking: {
          select: { roomNumber: true, guestName: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Order status updated to ${status}`,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
