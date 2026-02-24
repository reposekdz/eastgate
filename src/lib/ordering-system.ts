/**
 * Advanced Ordering System
 * Order management, kitchen display, inventory tracking, and fulfillment
 */

import prisma from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/validators";

// ============================================
// ORDER CONSTANTS
// ============================================

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderType {
  DINE_IN = "dine_in",
  ROOM_SERVICE = "room_service",
  TAKEAWAY = "takeaway",
  DELIVERY = "delivery",
}

export enum OrderPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

// ============================================
// ORDER INTERFACES
// ============================================

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  specialRequests?: string;
  preparationNotes?: string;
  status?: "pending" | "preparing" | "ready";
}

export interface OrderRequest {
  guestId?: string;
  guestName: string;
  guestPhone?: string;
  tableNumber?: number;
  roomNumber?: string;
  type: OrderType;
  items: OrderItem[];
  specialRequests?: string;
  deliveryAddress?: string;
  priority?: OrderPriority;
  branchId: string;
  createdBy: string; // Staff ID
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  avgPrepTime: number;
  avgOrderValue: number;
  topItems: Array<{ name: string; count: number }>;
}

// ============================================
// ORDER CREATION & MANAGEMENT
// ============================================

/**
 * Create order
 */
export async function createOrder(request: OrderRequest): Promise<any> {
  try {
    // Validate items and calculate total
    const orderItems = await validateOrderItems(request.items, request.branchId);
    const total = calculateOrderTotal(orderItems);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        guestName: request.guestName,
        guestId: request.guestId,
        tableNumber: request.tableNumber,
        type: request.type,
        items: orderItems,
        total,
        status: OrderStatus.PENDING,
        priority: request.priority || OrderPriority.NORMAL,
        specialRequests: request.specialRequests,
        branchId: request.branchId,
        createdBy: request.createdBy,
        createdAt: new Date(),
      },
    });

    // Send kitchen order
    await sendToKitchen(order);

    // Send notifications
    await notifyStaff(order, "new_order");

    return order;
  } catch (error) {
    console.error("Order creation error:", error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<any> {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date(),
        ...(notes && { notes }),
      },
    });

    // Notify relevant parties
    await notifyStaff(order, "order_status_changed");

    return order;
  } catch (error) {
    console.error("Order status update error:", error);
    throw error;
  }
}

/**
 * Update item status within order
 */
export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  status: "pending" | "preparing" | "ready"
): Promise<any> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Update item in items array
    const updatedItems = (order.items as OrderItem[]).map((item: any) => {
      if (item.id === itemId) {
        return { ...item, status };
      }
      return item;
    });

    // Check if all items are ready
    const allReady = updatedItems.every((item: any) => item.status === "ready");

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        items: updatedItems,
        status: allReady ? OrderStatus.READY : order.status,
        updatedAt: new Date(),
      },
    });

    // Notify if order is ready
    if (allReady) {
      await notifyStaff(updatedOrder, "order_ready");
    }

    return updatedOrder;
  } catch (error) {
    console.error("Order item status update error:", error);
    throw error;
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  refundAmount?: number
): Promise<any> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Check if order can be cancelled
    if ([OrderStatus.SERVED, OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status as any)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Release inventory if order was preparing
    if (order.status === OrderStatus.PREPARING) {
      await releaseOrderInventory(order);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason: reason,
        refundAmount: refundAmount || 0,
        updatedAt: new Date(),
      },
    });

    // Notify kitchen to stop preparation
    await notifyKitchenCancel(updatedOrder);

    return updatedOrder;
  } catch (error) {
    console.error("Order cancellation error:", error);
    throw error;
  }
}

// ============================================
// ORDER VALIDATION & CALCULATION
// ============================================

/**
 * Validate menu items and build order items
 */
async function validateOrderItems(
  items: OrderItem[],
  branchId: string
): Promise<OrderItem[]> {
  const validatedItems: OrderItem[] = [];

  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
    });

    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`);
    }

    if (!menuItem.available) {
      throw new Error(`Menu item not available: ${menuItem.name}`);
    }

    validatedItems.push({
      ...item,
      name: menuItem.name,
      unitPrice: menuItem.price,
    });
  }

  return validatedItems;
}

/**
 * Calculate order total
 */
function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

// ============================================
// KITCHEN MANAGEMENT
// ============================================

/**
 * Send order to kitchen
 */
export async function sendToKitchen(order: any): Promise<void> {
  try {
    // Create kitchen order display record
    const kitchenOrder = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
      priority: order.priority,
      createdAt: new Date(),
      estimatedTime: calculateEstimatedPrepTime(order.items),
    };

    // TODO: Implement WebSocket broadcast to kitchen
    console.log("Sending to kitchen:", kitchenOrder);

    // Update order status
    await updateOrderStatus(order.id, OrderStatus.CONFIRMED);
  } catch (error) {
    console.error("Kitchen notification error:", error);
  }
}

/**
 * Calculate estimated preparation time
 */
function calculateEstimatedPrepTime(items: OrderItem[]): number {
  let maxTime = 0;

  for (const item of items) {
    // Assume prepTime is in minutes
    const itemTime = (item as any).prepTime || 15;
    if (itemTime > maxTime) {
      maxTime = itemTime;
    }
  }

  return maxTime;
}

/**
 * Notify kitchen to cancel order
 */
async function notifyKitchenCancel(order: any): Promise<void> {
  // TODO: Implement WebSocket broadcast
  console.log("Cancelling kitchen order:", order.id);
}

/**
 * Get kitchen display orders
 */
export async function getKitchenDisplay(branchId: string): Promise<any[]> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        branchId,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
        },
      },
      orderBy: {
        priority: "desc",
        createdAt: "asc",
      },
    });

    return orders;
  } catch (error) {
    console.error("Kitchen display error:", error);
    throw error;
  }
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

/**
 * Release order inventory (when cancelled)
 */
async function releaseOrderInventory(order: any): Promise<void> {
  // TODO: Implement inventory release logic
  console.log("Releasing inventory for order:", order.id);
}

/**
 * Get inventory availability for items
 */
export async function checkInventoryAvailability(
  items: OrderItem[],
  branchId: string
): Promise<{ available: boolean; unavailableItems: string[] }> {
  const unavailableItems: string[] = [];

  for (const item of items) {
    // TODO: Check inventory levels
    // const inventory = await getInventoryForItem(item.menuItemId, branchId);
    // if (inventory < item.quantity) {
    //   unavailableItems.push(item.name);
    // }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  };
}

// ============================================
// NOTIFICATIONS & COMMUNICATIONS
// ============================================

/**
 * Notify staff about order events
 */
export async function notifyStaff(order: any, eventType: string): Promise<void> {
  const messages: Record<string, string> = {
    new_order: `New order ${order.orderNumber} from ${order.guestName}`,
    order_status_changed: `Order ${order.orderNumber} status: ${order.status}`,
    order_ready: `Order ${order.orderNumber} is ready to serve`,
    order_cancelled: `Order ${order.orderNumber} has been cancelled`,
  };

  console.log(messages[eventType] || `Order event: ${eventType}`);

  // TODO: Implement with real notifications (WebSocket, emails, SMS)
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

/**
 * Get order statistics
 */
export async function getOrderStatistics(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<OrderStats> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        branchId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length;
    const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;

    // Calculate average order prep time
    let totalPrepTime = 0;
    orders.forEach((order) => {
      // TODO: Calculate from actual timestamps
    });
    const avgPrepTime = totalPrepTime / (completedOrders || 1);

    // Calculate average order value
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalRevenue / (totalOrders || 1);

    // Get top items
    const itemCounts: Record<string, number> = {};
    orders.forEach((order) => {
      (order.items as OrderItem[]).forEach((item) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      avgPrepTime,
      avgOrderValue,
      topItems,
    };
  } catch (error) {
    console.error("Order statistics error:", error);
    throw error;
  }
}

/**
 * Get daily order summary
 */
export async function getDailyOrderSummary(
  branchId: string,
  date: Date
): Promise<any> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getOrderStatistics(branchId, startOfDay, endOfDay);
}
