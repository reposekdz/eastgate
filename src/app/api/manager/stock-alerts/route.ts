import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/stock-alerts - Get all stock alerts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get("type"); // LOW_STOCK, OUT_OF_STOCK, EXPIRING, ALL
    const branchId = searchParams.get("branchId");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Determine branch access
    let branchFilter: any = {};
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      if (branchId) branchFilter = { id: branchId };
      else if (userBranchId) branchFilter = { id: userBranchId };
    } else {
      branchFilter = { id: userBranchId };
    }

    const branches = await prisma.branch.findMany({
      where: branchFilter.id ? branchFilter : {},
      select: { id: true, name: true },
    });

    const branchIds = branches.map(b => b.id);

    // Get low stock items
    let lowStockWhere: any = {
      branchId: { in: branchIds },
    };

    if (alertType === "LOW_STOCK") {
      lowStockWhere = {
        ...lowStockWhere,
        status: "LOW_STOCK",
      };
    } else if (alertType === "OUT_OF_STOCK") {
      lowStockWhere = {
        ...lowStockWhere,
        status: "OUT_OF_STOCK",
      };
    }

    const [lowStockItems, outOfStockItems, expiringItems, totalStockCount] = await Promise.all([
      // Low stock items
      prisma.stockItem.findMany({
        where: {
          ...lowStockWhere,
          OR: [
            { status: "LOW_STOCK" },
            { quantity: { lte: 10 } },
          ],
        },
        include: {
          branch: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { quantity: "asc" },
      }),

      // Out of stock items
      prisma.stockItem.findMany({
        where: {
          branchId: { in: branchIds },
          OR: [
            { status: "OUT_OF_STOCK" },
            { quantity: 0 },
          ],
        },
        include: {
          branch: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { name: "asc" },
      }),

      // Expiring soon (within 7 days)
      prisma.stockItem.findMany({
        where: {
          branchId: { in: branchIds },
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          branch: { select: { id: true, name: true } },
        },
        orderBy: { expiryDate: "asc" },
      }),

      // Total stock count
      prisma.stockItem.count({
        where: {
          branchId: { in: branchIds },
          status: { not: "DISCONTINUED" },
        },
      }),
    ]);

    // Get critical alerts (items below 20% of reorder level)
    const criticalAlerts = lowStockItems.filter(
      item => item.quantity <= (item.reorderLevel * 0.2)
    );

    // Get category breakdown
    const categoryBreakdown = await prisma.stockItem.groupBy({
      by: ["category"],
      where: {
        branchId: { in: branchIds },
        status: { not: "DISCONTINUED" },
      },
      _count: true,
      _sum: { quantity: true, unitCost: true },
    });

    // Calculate total inventory value
    const totalValue = await prisma.stockItem.aggregate({
      where: {
        branchId: { in: branchIds },
        status: { not: "DISCONTINUED" },
      },
      _sum: {
        unitCost: true,
      },
    });

    // Create notifications for new alerts
    const now = new Date();
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        type: "STOCK",
        createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) }, // Last hour
      },
    });

    // If there are new critical alerts and no recent notification, create one
    if (criticalAlerts.length > 0 && recentNotifications.length === 0) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "STOCK",
          title: "Critical Stock Alert",
          message: `${criticalAlerts.length} items are critically low and need immediate attention`,
          read: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      alerts: {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        expiring: expiringItems,
        critical: criticalAlerts,
      },
      summary: {
        totalStockItems: totalStockCount,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        expiringCount: expiringItems.length,
        criticalCount: criticalAlerts.length,
        totalInventoryValue: totalValue._sum.unitCost || 0,
      },
      byCategory: categoryBreakdown.map(cat => ({
        category: cat.category,
        itemCount: cat._count,
        totalQuantity: cat._sum.quantity || 0,
        totalValue: cat._sum.unitCost || 0,
      })),
      branches,
    });
  } catch (error) {
    console.error("Get stock alerts error:", error);
    return NextResponse.json({ error: "Failed to get stock alerts" }, { status: 500 });
  }
}

// POST /api/manager/stock-alerts - Acknowledge/resolve alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // CREATE_PURCHASE_ORDER, DISMISS

    const body = await request.json();
    const { stockItemIds, notes } = body;

    if (!stockItemIds || !Array.isArray(stockItemIds)) {
      return NextResponse.json({ error: "Stock item IDs required" }, { status: 400 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (action === "CREATE_PURCHASE_ORDER") {
      // Get stock items
      const stockItems = await prisma.stockItem.findMany({
        where: {
          id: { in: stockItemIds },
          branchId: userBranchId || undefined,
        },
      });

      if (stockItems.length === 0) {
        return NextResponse.json({ error: "No valid stock items found" }, { status: 404 });
      }

      // Group by supplier
      const supplierMap = new Map();
      stockItems.forEach(item => {
        if (item.supplierId) {
          if (!supplierMap.has(item.supplierId)) {
            supplierMap.set(item.supplierId, []);
          }
          supplierMap.get(item.supplierId).push({
            stockItemId: item.id,
            name: item.name,
            quantity: item.reorderQuantity || item.reorderLevel,
            unitCost: item.unitCost,
          });
        }
      });

      // Create purchase orders for each supplier
      const purchaseOrders = [];
      for (const [supplierId, items] of supplierMap) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: supplierId },
        });

        if (!supplier) continue;

        const orderTotal = items.reduce(
          (sum: number, item: any) => sum + item.quantity * item.unitCost,
          0
        );

        const po = await prisma.purchaseOrder.create({
          data: {
            orderNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            supplierId,
            status: "PENDING",
            items: JSON.stringify(items),
            subtotal: orderTotal,
            totalAmount: orderTotal,
            branchId: userBranchId || stockItems[0].branchId,
            createdById: session.user.id,
            notes: notes || `Auto-generated from low stock alert`,
          },
        });

        purchaseOrders.push(po);
      }

      return NextResponse.json({
        success: true,
        message: `${purchaseOrders.length} purchase order(s) created`,
        purchaseOrders,
      });
    }

    // Dismiss action - create notification that alert was reviewed
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "STOCK",
        title: "Stock Alert Reviewed",
        message: `${stockItemIds.length} stock alert(s) reviewed`,
        read: false,
      },
    });

    return NextResponse.json({ success: true, message: "Alert dismissed" });
  } catch (error) {
    console.error("Stock alert action error:", error);
    return NextResponse.json({ error: "Failed to process alert action" }, { status: 500 });
  }
}
