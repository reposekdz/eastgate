import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// Role check helper
function isWaiter(role: string): boolean {
  return ["WAITER", "SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(role);
}

// GET - Waiter dashboard data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    if (!isWaiter(userRole)) {
      return NextResponse.json({ error: "Forbidden - Waiter access only" }, { status: 403 });
    }

    const branchWhere = userBranchId ? { branchId: userBranchId } : {};

    // Get active orders for waiter's branch
    const activeOrders = await prisma.order.findMany({
      where: {
        ...branchWhere,
        status: { in: ["pending", "preparing", "ready"] },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get today's orders
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

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: branchWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Calculate tips (assuming 10% of completed orders)
    const todayRevenue = await prisma.order.aggregate({
      where: {
        ...branchWhere,
        status: "completed",
        createdAt: { gte: today },
      },
      _sum: {
        total: true,
      },
    });

    const estimatedTips = (todayRevenue._sum.total || 0) * 0.1;

    return NextResponse.json({
      success: true,
      data: {
        activeOrders,
        todayStats: {
          totalOrders: todayOrders,
          completedOrders: completedToday,
          revenue: todayRevenue._sum.total || 0,
          estimatedTips,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Waiter dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// PUT - Update order status (serve, cancel)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isWaiter(userRole)) {
      return NextResponse.json({ error: "Forbidden - Waiter access only" }, { status: 403 });
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

    let updateData: any = {};

    switch (action) {
      case "serve":
        updateData = { status: "served" };
        break;
      case "cancel":
        updateData = { status: "cancelled" };
        break;
      case "ready":
        updateData = { status: "ready" };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Log waiter action in activity logs
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: `order_${action}`,
        entity: "order",
        entityId: orderId,
        details: { action, performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Waiter order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
