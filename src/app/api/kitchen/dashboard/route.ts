import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

// Role check helper
function isKitchenStaff(role: string): boolean {
  return ["CHEF", "KITCHEN_STAFF", "KITCHEN", "SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(role);
}

// GET - Kitchen dashboard data
export async function GET(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = verifyToken(token, "access");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.role;
    const userBranchId = session.branchId;

    if (!isKitchenStaff(userRole)) {
      return NextResponse.json({ error: "Forbidden - Kitchen staff access only" }, { status: 403 });
    }

    const branchWhere = userBranchId ? { branchId: userBranchId } : {};

    // Get pending orders (kitchen needs to see pending orders)
    const pendingOrders = await prisma.order.findMany({
      where: {
        ...branchWhere,
        status: "pending",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get preparing orders
    const preparingOrders = await prisma.order.findMany({
      where: {
        ...branchWhere,
        status: "preparing",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get ready orders (ready to serve)
    const readyOrders = await prisma.order.findMany({
      where: {
        ...branchWhere,
        status: "ready",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.count({
      where: {
        ...branchWhere,
        createdAt: { gte: today },
      },
    });

    const completedToday = await prisma.order.count({
      where: {
        ...branchWhere,
        status: "completed",
        createdAt: { gte: today },
      },
    });

    // Get menu items for quick reference
    const menuItems = await prisma.menuItem.findMany({
      where: {
        ...branchWhere,
        available: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        available: true,
      },
    });

    // Calculate estimated preparation time (based on order complexity)
    const avgPrepTime = 15; // minutes - this could be calculated based on items

    return NextResponse.json({
      success: true,
      data: {
        pendingOrders,
        preparingOrders,
        readyOrders,
        todayStats: {
          totalOrders: todayOrders,
          completedOrders: completedToday,
          pendingCount: pendingOrders.length,
          preparingCount: preparingOrders.length,
          readyCount: readyOrders.length,
        },
        menuItems,
        avgPrepTime,
      },
    });
  } catch (error) {
    console.error("Kitchen dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch kitchen data" },
      { status: 500 }
    );
  }
}

// PUT - Update order status (start preparing, mark ready, complete)
export async function PUT(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = verifyToken(token, "access");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.role;

    if (!isKitchenStaff(userRole)) {
      return NextResponse.json({ error: "Forbidden - Kitchen staff access only" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, action } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { error: "orderId and action are required" },
        { status: 400 }
      );
    }

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let updateData: { status: string } = { status: "" };

    switch (action) {
      case "start":
        // Kitchen starts preparing
        updateData = { status: "preparing" };
        break;
      case "ready":
        // Food ready for serving
        updateData = { status: "ready" };
        break;
      case "complete":
        // Order completed
        updateData = { status: "completed" };
        break;
      case "cancel":
        // Cancel order
        updateData = { status: "cancelled" };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Kitchen order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// POST - Bulk update orders (for kitchen efficiency)
export async function POST(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = verifyToken(token, "access");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.role;

    if (!isKitchenStaff(userRole)) {
      return NextResponse.json({ error: "Forbidden - Kitchen staff access only" }, { status: 403 });
    }

    const body = await req.json();
    const { orderIds, action } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds array is required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    let updateData: { status: string } = { status: "" };

    switch (action) {
      case "start":
        updateData = { status: "preparing" };
        break;
      case "ready":
        updateData = { status: "ready" };
        break;
      case "complete":
        updateData = { status: "completed" };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update all orders in bulk
    const updatedOrders = await Promise.all(
      orderIds.map(async (orderId: string) => {
        return await prisma.order.update({
          where: { id: orderId },
          data: updateData,
        });
      })
    );

    return NextResponse.json({
      success: true,
      updatedCount: updatedOrders.length,
      orders: updatedOrders,
    });
  } catch (error) {
    console.error("Kitchen bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update orders" },
      { status: 500 }
    );
  }
}
