import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";

/**
 * GET /api/orders
 * Fetch orders with advanced filtering and real-time data
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const guestId = searchParams.get("guestId");
    const roomId = searchParams.get("roomId");
    const tableNumber = searchParams.get("tableNumber");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (guestId) where.guestId = guestId;
    if (roomId) where.roomId = roomId;
    if (tableNumber) where.tableNumber = parseInt(tableNumber);

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
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
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        where: branchId ? { branchId } : {},
        _count: true,
      }),
    ]);

    // Calculate statistics
    const stats = {
      total,
      pending: statusCounts.find((s) => s.status === "pending")?._count || 0,
      preparing: statusCounts.find((s) => s.status === "preparing")?._count || 0,
      ready: statusCounts.find((s) => s.status === "ready")?._count || 0,
      served: statusCounts.find((s) => s.status === "served")?._count || 0,
      cancelled: statusCounts.find((s) => s.status === "cancelled")?._count || 0,
    };

    return successResponse({
      orders,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return errorResponse("Failed to fetch orders", [], 500);
  }
}

/**
 * POST /api/orders
 * Create new order with validation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      guestName,
      guestId,
      roomId,
      tableNumber,
      roomCharge,
      notes,
      branchId,
      performedBy,
    } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(
        "Validation failed",
        [{
          field: "items",
          message: "Order must contain at least one item",
          code: "REQUIRED"
        }],
        400
      );
    }

    if (!branchId) {
      return errorResponse(
        "Validation failed",
        [{
          field: "branchId",
          message: "Branch ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    // Validate menu items exist and calculate total
    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        available: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return errorResponse(
        "Invalid items",
        [{
          field: "items",
          message: "Some menu items are not available",
          code: "INVALID"
        }],
        400
      );
    }

    // Calculate total
    const itemMap = new Map(menuItems.map((item) => [item.id, item]));
    let total = 0;
    const orderItems = items.map((item: any) => {
      const menuItem = itemMap.get(item.menuItemId);
      const itemTotal = (menuItem?.price || 0) * item.quantity;
      total += itemTotal;
      return {
        menuItemId: item.menuItemId,
        name: menuItem?.name || "Unknown",
        quantity: item.quantity,
        price: menuItem?.price || 0,
        notes: item.notes || "",
      };
    });

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, "0")}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        guestName: guestName || "Walk-in Customer",
        guestId,
        roomId,
        tableNumber: tableNumber ? parseInt(tableNumber) : null,
        roomCharge: roomCharge || false,
        notes: notes || "",
        total,
        status: "pending",
        branchId,
        performedBy,
        items: orderItems,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        room: {
          select: { id: true, number: true, type: true },
        },
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse({ order }, 201);
  } catch (error: any) {
    console.error("Order creation error:", error);
    return errorResponse("Failed to create order", [], 500);
  }
}

/**
 * PUT /api/orders
 * Update order status
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, performedBy, notes } = body;

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Order ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    if (!status) {
      return errorResponse(
        "Validation failed",
        [{
          field: "status",
          message: "Status is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    // Validate status
    const validStatuses = ["pending", "preparing", "ready", "served", "cancelled"];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        "Invalid status",
        [{
          field: "status",
          message: `Must be one of: ${validStatuses.join(", ")}`,
          code: "INVALID"
        }],
        400
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return errorResponse("Order not found", [{
        field: "id",
        message: "Order does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    const updateData: any = { status };
    if (performedBy) updateData.performedBy = performedBy;
    if (notes) updateData.notes = notes;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: { id: true, name: true },
        },
        room: {
          select: { id: true, number: true, type: true },
        },
        guest: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse({ order });
  } catch (error: any) {
    console.error("Order update error:", error);
    return errorResponse("Failed to update order", [], 500);
  }
}

/**
 * DELETE /api/orders
 * Cancel order
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Order ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return errorResponse("Order not found", [{
        field: "id",
        message: "Order does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "preparing"];
    if (!cancellableStatuses.includes(existingOrder.status)) {
      return errorResponse(
        "Cannot cancel order",
        [{
          field: "status",
          message: `Order with status "${existingOrder.status}" cannot be cancelled`,
          code: "INVALID_STATUS"
        }],
        400
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: "cancelled" },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse({ order });
  } catch (error: any) {
    console.error("Order cancellation error:", error);
    return errorResponse("Failed to cancel order", [], 500);
  }
}
