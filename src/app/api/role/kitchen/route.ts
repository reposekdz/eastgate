import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/role/kitchen - Kitchen dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["CHEF", "KITCHEN_STAFF", "BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!userBranchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingOrders, preparingOrders, readyOrders, completedToday] = await Promise.all([
      prisma.order.findMany({
        where: { branchId: userBranchId, status: "PENDING", createdAt: { gte: today, lt: tomorrow } },
        include: { items: { include: { menuItem: true } }, guest: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.findMany({
        where: { branchId: userBranchId, status: "PREPARING", createdAt: { gte: today, lt: tomorrow } },
        include: { items: { include: { menuItem: true } }, guest: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.findMany({
        where: { branchId: userBranchId, status: "READY", createdAt: { gte: today, lt: tomorrow } },
        include: { items: { include: { menuItem: true } }, guest: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.order.count({
        where: { branchId: userBranchId, status: "COMPLETED", createdAt: { gte: today, lt: tomorrow } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      dashboard: {
        orders: { pending: pendingOrders, preparing: preparingOrders, ready: readyOrders },
        stats: { pendingCount: pendingOrders.length, preparingCount: preparingOrders.length, readyCount: readyOrders.length, completedToday },
      },
    });
  } catch (error) {
    console.error("Kitchen error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/role/kitchen - Kitchen actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["CHEF", "KITCHEN_STAFF", "BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId } = body;

    if (action === "START_PREPARING" && orderId) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "PREPARING", sentToKitchen: new Date() },
      });
      
      await prisma.orderStatusHistory.create({
        data: { orderId, status: "PREPARING", note: "Started preparing", changedBy: session.user.id },
      });

      return NextResponse.json({ success: true, order });
    }

    if (action === "MARK_READY" && orderId) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "READY", preparedAt: new Date() },
      });
      
      await prisma.orderStatusHistory.create({
        data: { orderId, status: "READY", note: "Order ready", changedBy: session.user.id },
      });

      return NextResponse.json({ success: true, order });
    }

    if (action === "SERVE_ORDER" && orderId) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "SERVED", servedAt: new Date() },
      });

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Kitchen action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
