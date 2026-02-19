import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// Order status timeline with detailed stages
const ORDER_STATUS_TIMELINE = {
  PENDING: { step: 0, label: "Order Received", icon: "receipt" },
  CONFIRMED: { step: 1, label: "Order Confirmed", icon: "check-circle" },
  PREPARING: { step: 2, label: "Preparing", icon: "chef-hat" },
  QUALITY_CHECK: { step: 3, label: "Quality Check", icon: "magnifier" },
  READY: { step: 4, label: "Ready", icon: "bell" },
  OUT_FOR_DELIVERY: { step: 5, label: "Out for Delivery", icon: "truck" },
  SERVED: { step: 6, label: "Served", icon: "utensils" },
  COMPLETED: { step: 7, label: "Completed", icon: "check-double" },
  CANCELLED: { step: -1, label: "Cancelled", icon: "x-circle" },
};

// GET /api/orders/realtime - Get order tracking info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");
    const guestPhone = searchParams.get("phone"); // For guest tracking without login

    if (!orderId && !orderNumber && !guestPhone) {
      return NextResponse.json(
        { error: "Order ID, order number, or phone required" },
        { status: 400 }
      );
    }

    // Build where clause
    let whereClause: any = {};
    if (orderId) whereClause.id = orderId;
    if (orderNumber) whereClause.orderNumber = orderNumber;
    if (guestPhone) whereClause.guestPhone = guestPhone;

    // Get order with all details
    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
                preparationTime: true,
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get order status history
    const statusHistory = await prisma.orderStatusHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });

    // Calculate estimated time based on items
    const maxPrepTime = order.items.reduce(
      (max, item) => Math.max(max, item.menuItem.preparationTime || 15),
      0
    );
    
    // Add buffer time
    const estimatedCompletionTime = new Date(
      order.createdAt.getTime() + (maxPrepTime + 15) * 60 * 1000
    );

    // Calculate progress percentage
    const currentStep = ORDER_STATUS_TIMELINE[order.status as keyof typeof ORDER_STATUS_TIMELINE]?.step || 0;
    const progress = Math.round((currentStep / 7) * 100);

    // Get notifications for this order
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { message: { contains: order.orderNumber } },
          { actionUrl: { contains: order.id } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: ORDER_STATUS_TIMELINE[order.status as keyof typeof ORDER_STATUS_TIMELINE]?.label || order.status,
        progress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedCompletionTime,
        totalAmount: order.totalAmount,
        itemCount: order._count.items,
        notes: order.notes,
        deliveryType: order.type,
        tableNumber: order.tableNumber,
        guest: order.guest,
        branch: order.branch,
        items: order.items.map(item => ({
          id: item.id,
          name: item.menuItem.name,
          image: item.menuItem.image,
          quantity: item.quantity,
          price: item.price,
          status: item.status,
          notes: item.notes,
        })),
      },
      timeline: ORDER_STATUS_TIMELINE,
      statusHistory: statusHistory.map(h => ({
        status: h.status,
        statusLabel: ORDER_STATUS_TIMELINE[h.status as keyof typeof ORDER_STATUS_TIMELINE]?.label || h.status,
        note: h.note,
        timestamp: h.createdAt,
      })),
      notifications,
      tracking: {
        currentStep,
        totalSteps: 7,
        isActive: !["COMPLETED", "CANCELLED"].includes(order.status),
        canCancel: order.status === "PENDING",
        canModify: ["PENDING", "CONFIRMED"].includes(order.status),
      },
    });
  } catch (error) {
    console.error("Get order tracking error:", error);
    return NextResponse.json({ error: "Failed to get order tracking" }, { status: 500 });
  }
}

// POST /api/orders/realtime - Update order status (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      status,
      note,
      notifyCustomer,
      estimatedTime,
    } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status required" },
        { status: 400 }
      );
    }

    // Get existing order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        guest: true,
        branch: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status.toUpperCase() },
    });

    // Create status history
    const statusHistory = await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: status.toUpperCase(),
        note: note || `Order status changed to ${status}`,
        changedBy: body.changedBy || "SYSTEM",
      },
    });

    // Create notification for customer if requested
    if (notifyCustomer && order.guestId) {
      const statusInfo = ORDER_STATUS_TIMELINE[status.toUpperCase() as keyof typeof ORDER_STATUS_TIMELINE];
      
      await prisma.notification.create({
        data: {
          userId: order.guestId,
          type: "ORDER",
          title: `Order #${order.orderNumber} - ${statusInfo?.label || status}`,
          message: note || `Your order is now: ${statusInfo?.label || status}${estimatedTime ? `. Estimated: ${estimatedTime} min` : ''}`,
          actionUrl: `/order-tracking?orderId=${order.id}`,
        },
      });

      // Also create notification for branch staff
      await prisma.notification.create({
        data: {
          userId: order.branch?.managerId || "",
          type: "ORDER",
          title: `Order #${order.orderNumber} Updated`,
          message: `Order status changed to ${status}`,
          actionUrl: `/kitchen/orders/${order.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      statusHistory,
      message: "Order status updated and notification sent",
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

// PUT /api/orders/realtime - Subscribe to order updates (WebSocket alternative)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, deviceToken, email } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, guestId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    switch (action) {
      case "SUBSCRIBE":
        // In production, this would store the device token for push notifications
        // For now, we simulate subscription
        return NextResponse.json({
          success: true,
          message: `Subscribed to order #${order.orderNumber} updates`,
          pollingUrl: `/api/orders/realtime?orderId=${orderId}`,
          websocketUrl: `/ws/orders/${orderId}`,
        });

      case "UNSUBSCRIBE":
        return NextResponse.json({
          success: true,
          message: `Unsubscribed from order #${order.orderNumber}`,
        });

      case "SHARE":
        // Generate shareable link
        const shareToken = `track_${order.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // In production, store share token in database
        return NextResponse.json({
          success: true,
          shareUrl: `/order-tracking?t=${shareToken}`,
          shareCode: order.orderNumber,
          message: "Share link generated",
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Order subscription error:", error);
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
  }
}
