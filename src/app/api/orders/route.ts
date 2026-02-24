import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// GET - Fetch orders with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const userBranchId = session.user.branchId as string;
    const userRole = session.user.role as string;

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole) && userBranchId) {
      where.branchId = userBranchId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // Get statistics
    const stats = await prisma.order.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      orders,
      stats,
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      tableNumber,
      guestName,
      items,
      total,
      roomCharge,
      notes,
      roomId,
    } = body;

    if (!tableNumber || !items || !total) {
      return NextResponse.json(
        { error: "tableNumber, items, and total are required" },
        { status: 400 }
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        tableNumber: parseInt(tableNumber),
        guestName,
        items,
        total: parseFloat(total),
        roomCharge: roomCharge || false,
        notes,
        performedBy: session.user.name || session.user.email || "Unknown",
        branchId: session.user.branchId || "",
        roomId,
        status: "pending",
      },
    });

    // Log order creation
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "order_created",
        entity: "order",
        entityId: order.id,
        details: { tableNumber, total, itemCount: items.length },
      },
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// PUT - Update order
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Log update
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "order_updated",
        entity: "order",
        entityId: orderId,
        details: { status, performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete order
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow cancellation of pending orders
    if (existingOrder.status !== "pending") {
      return NextResponse.json(
        { error: "Can only cancel pending orders" },
        { status: 400 }
      );
    }

    // Delete order
    await prisma.order.delete({
      where: { id: orderId },
    });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "order_cancelled",
        entity: "order",
        entityId: orderId,
        details: { performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Order deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
