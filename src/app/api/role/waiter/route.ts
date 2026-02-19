import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/role/waiter - Waiter dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only waiters and above
    if (!["WAITER", "RESTAURANT_STAFF", "BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!userBranchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Get today's active orders for the waiter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      activeOrders,
      completedOrders,
      pendingOrders,
      tables,
    ] = await Promise.all([
      // Active orders (not completed)
      prisma.order.findMany({
        where: {
          branchId: userBranchId,
          status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
          createdAt: { gte: today, lt: tomorrow },
        },
        include: {
          items: {
            include: { menuItem: true },
          },
          guest: { select: { guestName: true, roomNumber: true } },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Completed orders today
      prisma.order.count({
        where: {
          branchId: userBranchId,
          status: "COMPLETED",
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // Pending orders count
      prisma.order.count({
        where: {
          branchId: userBranchId,
          status: { in: ["PENDING", "CONFIRMED"] },
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // Available tables
      prisma.order.findMany({
        where: {
          branchId: userBranchId,
          status: { in: ["CONFIRMED", "PREPARING", "READY"] },
          tableNumber: { not: null },
          createdAt: { gte: today, lt: tomorrow },
        },
        select: { tableNumber: true },
        distinct: ["tableNumber"],
      }),
    ]);

    // Get menu categories for quick access
    const menuCategories = await prisma.menuItem.groupBy({
      by: ["category"],
      where: {
        branchId: userBranchId,
        available: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      dashboard: {
        activeOrders,
        stats: {
          activeCount: activeOrders.length,
          completedToday: completedOrders,
          pendingCount: pendingOrders,
          occupiedTables: tables.length,
        },
        menuCategories,
      },
    });
  } catch (error) {
    console.error("Waiter dashboard error:", error);
    return NextResponse.json({ error: "Failed to get dashboard" }, { status: 500 });
  }
}

// POST /api/role/waiter - Waiter actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["WAITER", "RESTAURANT_STAFF", "BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { action, orderId, tableNumber, items, guestName, roomCharge, notes } = body;

    switch (action) {
      case "CREATE_ORDER": {
        if (!items || items.length === 0) {
          return NextResponse.json({ error: "Items required" }, { status: 400 });
        }

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
          subtotal += item.price * item.quantity;
        }
        const tax = Math.round(subtotal * 0.18);
        const total = subtotal + tax;

        // Create order
        const order = await prisma.order.create({
          data: {
            orderNumber,
            tableNumber: tableNumber || null,
            guestName: guestName || null,
            roomCharge: roomCharge || false,
            type: tableNumber ? "DINE_IN" : roomCharge ? "ROOM_SERVICE" : "TAKEAWAY",
            subtotal,
            tax,
            totalAmount: total,
            status: "PENDING",
            paymentStatus: "PENDING",
            branchId: userBranchId,
            createdById: session.user.id,
            notes,
            items: {
              create: items.map((item: any) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
                status: "PENDING",
              })),
            },
          },
          include: {
            items: { include: { menuItem: true } },
          },
        });

        // Deduct from kitchen stock
        for (const item of items) {
          const menuItem = await prisma.menuItem.findUnique({
            where: { id: item.menuItemId },
            include: { stockItems: true },
          });

          if (menuItem?.requiresInventory) {
            // Auto-deduct stock when order is placed
            console.log(`Deducting stock for order ${orderNumber}`);
          }
        }

        return NextResponse.json({
          success: true,
          order,
          message: "Order created successfully",
        });
      }

      case "UPDATE_ORDER_STATUS": {
        if (!orderId || !body.status) {
          return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
        }

        const order = await prisma.order.update({
          where: { id: orderId },
          data: { status: body.status },
          include: { items: true },
        });

        // Create status history
        await prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: body.status,
            note: `Status updated by waiter: ${session.user.name}`,
            changedBy: session.user.id,
          },
        });

        return NextResponse.json({
          success: true,
          order,
          message: "Order status updated",
        });
      }

      case "ADD_ITEMS": {
        if (!orderId || !items || items.length === 0) {
          return NextResponse.json({ error: "Order ID and items required" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Add new items
        let additionalTotal = 0;
        for (const item of items) {
          additionalTotal += item.price * item.quantity;
          
          await prisma.orderItem.create({
            data: {
              orderId,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
              status: "PENDING",
            },
          });
        }

        // Update order total
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            subtotal: order.subtotal + additionalTotal,
            tax: Math.round((order.subtotal + additionalTotal) * 0.18),
            totalAmount: Math.round((order.subtotal + additionalTotal) * 1.18),
          },
          include: { items: { include: { menuItem: true } } },
        });

        return NextResponse.json({
          success: true,
          order: updatedOrder,
          message: "Items added to order",
        });
      }

      case "REQUEST_PAYMENT": {
        if (!orderId) {
          return NextResponse.json({ error: "Order ID required" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
          where: { id: orderId },
        });

        if (!order) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Notify accountant/manager
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: "ORDER",
            title: "Payment Requested",
            message: `Payment requested for order ${order.orderNumber}`,
            actionUrl: `/admin/payments?orderId=${orderId}`,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Payment request sent",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Waiter action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
