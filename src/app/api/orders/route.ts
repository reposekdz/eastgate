import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-advanced";
import { createOrder, updateOrderStatus, validateOrderItems } from "@/lib/ordering-system";
import { successResponse, errorResponse, validateRequestBody, generateOrderNumber } from "@/lib/validators";
import prisma from "@/lib/prisma";

/**
 * GET /api/orders
 * Fetch orders with filters - requires auth
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const guestId = searchParams.get("guestId");
    const roomId = searchParams.get("roomId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    // Users can only see their branch orders if not super admin
    if (session.role !== "SUPER_ADMIN" && session.branchId) {
      where.branchId = session.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (status) where.status = status;
    if (guestId) where.guestId = guestId;
    if (roomId) where.roomId = roomId;

    const total = await prisma.order.count({ where });
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        room: { select: { id: true, number: true, type: true } },
        guest: { select: { id: true, name: true, email: true } },
        items: {
          select: { id: true, name: true, quantity: true, unitPrice: true, status: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse("Orders retrieved successfully", {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return errorResponse("Failed to fetch orders", { error: error.message }, 500);
  }
}

/**
 * POST /api/orders
 * Create new order - requires auth
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    // Only staff can create orders (waiter, kitchen, manager, etc.)
    const allowedRoles = ["WAITER", "RESTAURANT_STAFF", "MANAGER", "SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse(
        "Unauthorized",
        { permission: "Only staff members can create orders" },
        403
      );
    }

    const { data: body, errors } = await validateRequestBody<{
      items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
      guestName?: string;
      guestId?: string;
      roomId?: string;
      tableNumber?: number;
      roomCharge?: boolean;
      notes?: string;
    }>(req, ["items"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse("Invalid items", { items: "Order must contain at least one item" }, 400);
    }

    // Validate items exist and are available
    const itemValidation = await validateOrderItems(body.items.map((i) => i.menuItemId));
    if (!itemValidation.valid) {
      return errorResponse("Invalid items", { items: itemValidation.error }, 400);
    }

    // Fetch full item details for pricing
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: body.items.map((i) => i.menuItemId) } },
      select: { id: true, name: true, price: true },
    });

    const itemMap = new Map(menuItems.map((item) => [item.id, item]));
    const orderItems = body.items.map((item) => {
      const menuItem = itemMap.get(item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        name: menuItem?.name || "Unknown",
        quantity: item.quantity,
        unitPrice: menuItem?.price || 0,
        specialInstructions: item.specialInstructions,
      };
    });

   const total = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        guestName: body.guestName,
        guestId: body.guestId,
        roomId: body.roomId,
        tableNumber: body.tableNumber,
        roomCharge: body.roomCharge || false,
        notes: body.notes,
        total,
        status: "pending",
        branchId: session.branchId,
        createdBy: session.id,
        items: {
          createMany: {
            data: orderItems.map((item) => ({
              ...item,
              status: "pending",
            })),
          },
        },
      },
      include: {
        items: {
          select: { id: true, name: true, quantity: true, unitPrice: true, status: true },
        },
      },
    });

    return successResponse("Order created successfully", { order }, 201);
  } catch (error: any) {
    console.error("Order creation error:", error);
    return errorResponse("Failed to create order", { error: error.message }, 500);
  }
}

/**
 * PUT /api/orders/:id
 * Update order status - requires auth
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      id: string;
      status: string;
      notes?: string;
    }>(req, ["id", "status"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Verify status is valid
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(body.status)) {
      return errorResponse(
        "Invalid status",
        { status: `Must be one of: ${validStatuses.join(", ")}` },
        400
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: body.id },
      include: { items: { select: { id: true, status: true } } },
    });

    if (!order) {
      return errorResponse("Order not found", { orderId: "Order does not exist" }, 404);
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: body.id },
      data: {
        status: body.status,
        notes: body.notes,
        updatedBy: session.id,
      },
      include: {
        items: {
          select: { id: true, name: true, quantity: true, unitPrice: true, status: true },
        },
      },
    });

    return successResponse("Order updated successfully", { order: updatedOrder });
  } catch (error: any) {
    console.error("Order update error:", error);
    return errorResponse("Failed to update order", { error: error.message }, 500);
  }
}

/**
 * DELETE /api/orders/:id
 * Cancel order - requires auth
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return errorResponse("Missing parameter", { id: "Order ID is required" }, 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { select: { id: true, status: true } } },
    });

    if (!order) {
      return errorResponse("Order not found", { orderId: "Order does not exist" }, 404);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.status)) {
      return errorResponse(
        "Cannot cancel order",
        { status: `Order with status "${order.status}" cannot be cancelled` },
        400
      );
    }

    // Cancel the order and all items
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "cancelled",
        items: {
          updateMany: {
            where: { orderId: orderId },
            data: { status: "cancelled" },
          },
        },
      },
      include: {
        items: {
          select: { id: true, name: true, quantity: true, unitPrice: true, status: true },
        },
      },
    });

    return successResponse("Order cancelled successfully", { order: cancelledOrder });
  } catch (error: any) {
    console.error("Order cancellation error:", error);
    return errorResponse("Failed to cancel order", { error: error.message }, 500);
  }
}
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update order status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, performedBy } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "id and status are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status, performedBy },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Cancel order
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("Order cancellation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
