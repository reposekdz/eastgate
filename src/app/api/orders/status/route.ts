import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { orderId, status, notes } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        orderNumber: true, 
        guestName: true, 
        guestEmail: true, 
        guestPhone: true, 
        status: true, 
        branchId: true,
        roomId: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status, updatedAt: new Date() },
    });

    // Create notification for guest
    const statusMessages: Record<string, string> = {
      preparing: "Your order is being prepared by our kitchen",
      ready: "Your order is ready! It will be served shortly",
      served: "Your order has been served. Enjoy your meal!",
      cancelled: "Your order has been cancelled",
    };

    if (order.guestEmail || order.guestPhone) {
      await prisma.notification.create({
        data: {
          title: `Order ${order.orderNumber} - ${status.toUpperCase()}`,
          message: statusMessages[status] || `Order status updated to ${status}`,
          type: status === "ready" ? "success" : status === "cancelled" ? "error" : "info",
          userId: order.guestEmail,
          branchId: order.branchId,
        },
      });
    }

    // Notify waiter when order is ready
    if (status === "ready") {
      const waiter = await prisma.staff.findFirst({
        where: {
          branchId: order.branchId,
          role: "waiter",
          status: "active",
        },
      });

      if (waiter) {
        await prisma.notification.create({
          data: {
            title: `Order ${order.orderNumber} Ready`,
            message: `Order for ${order.guestName} is ready to serve`,
            type: "success",
            userId: waiter.id,
            branchId: order.branchId,
          },
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: order.branchId,
        action: "order_status_update",
        entity: "order",
        entityId: orderId,
        details: { 
          orderNumber: order.orderNumber, 
          oldStatus: order.status, 
          newStatus: status, 
          notes 
        },
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

// GET - Track order status for guests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");
    const guestEmail = searchParams.get("guestEmail");

    if (!orderNumber && !guestEmail) {
      return NextResponse.json({ error: "Order number or guest email required" }, { status: 400 });
    }

    const where: any = {};
    if (orderNumber) where.orderNumber = orderNumber;
    if (guestEmail) where.guestEmail = guestEmail;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: true,
        total: true,
        tableNumber: true,
        roomCharge: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Track order error:", error);
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 });
  }
}
