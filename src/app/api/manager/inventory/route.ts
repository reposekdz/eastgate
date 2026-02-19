import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

/**
 * GET /api/manager/inventory
 * Advanced inventory management with predictive restocking
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const targetBranchId = request.nextUrl.searchParams.get("branchId") || branchId;

    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const branchWhere = targetBranchId ? { branchId: targetBranchId } : {};

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch inventory data
    const [menuItems, orders, stockLevels] = await Promise.all([
      // Menu items with usage data
      prisma.menuItem.findMany({
        where: {
          ...branchWhere,
          requiresInventory: true,
        },
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: { gte: thirtyDaysAgo },
              },
            },
          },
        },
      }),

      // Recent orders for usage analysis
      prisma.order.findMany({
        where: {
          ...branchWhere,
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      }),

      // Stock levels (if you have an InventoryStock table)
      // This would be a new table in your schema
      // For now, we'll calculate from menu items
      prisma.menuItem.findMany({
        where: {
          ...branchWhere,
          requiresInventory: true,
        },
        select: {
          id: true,
          name: true,
          cost: true,
          available: true,
          lowStockAlert: true,
        },
      }),
    ]);

    // Calculate usage statistics
    const inventoryAnalysis = menuItems.map((item: any) => {
      const totalOrdered = item.orderItems.reduce(
        (sum: number, orderItem: any) => sum + orderItem.quantity,
        0
      );
      const dailyAverage = totalOrdered / 30;
      const weeklyAverage = dailyAverage * 7;
      const monthlyProjection = dailyAverage * 30;

      // Predict restock date (assuming 100 units current stock)
      const estimatedCurrentStock = 100; // This should come from actual inventory
      const daysUntilDepletion = estimatedCurrentStock / dailyAverage;
      const restockDate = new Date(now.getTime() + daysUntilDepletion * 24 * 60 * 60 * 1000);

      // Calculate reorder level
      const leadTimeDays = 3; // Days to receive new stock
      const safetyStockDays = 5; // Extra buffer
      const reorderLevel = dailyAverage * (leadTimeDays + safetyStockDays);

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        cost: item.cost,
        usage: {
          total30Days: totalOrdered,
          dailyAverage: Math.round(dailyAverage * 10) / 10,
          weeklyAverage: Math.round(weeklyAverage * 10) / 10,
          monthlyProjection: Math.round(monthlyProjection),
        },
        stock: {
          current: estimatedCurrentStock,
          reorderLevel: Math.round(reorderLevel),
          daysUntilRestock: Math.round(daysUntilDepletion * 10) / 10,
          restockDate: restockDate,
          status: daysUntilDepletion < 7 ? "critical" : 
                  daysUntilDepletion < 14 ? "warning" : "good",
        },
        financials: {
          costPerUnit: item.cost || 0,
          monthlyCost: (item.cost || 0) * monthlyProjection,
          inventoryValue: (item.cost || 0) * estimatedCurrentStock,
        },
        alerts: [
          ...(daysUntilDepletion < 7 ? [{
            type: "critical",
            message: `Critical: Only ${Math.round(daysUntilDepletion)} days of stock remaining`,
          }] : []),
          ...(item.lowStockAlert ? [{
            type: "warning",
            message: "Low stock alert enabled",
          }] : []),
          ...(!item.available ? [{
            type: "error",
            message: "Item currently unavailable",
          }] : []),
        ],
      };
    });

    // Sort by urgency
    inventoryAnalysis.sort((a, b) => a.stock.daysUntilRestock - b.stock.daysUntilRestock);

    // Generate purchase orders suggestions
    const purchaseOrderSuggestions = inventoryAnalysis
      .filter(item => item.stock.daysUntilRestock < 14)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        recommendedQuantity: Math.ceil(item.usage.monthlyProjection * 1.2), // 20% buffer
        estimatedCost: Math.ceil(item.usage.monthlyProjection * 1.2) * item.financials.costPerUnit,
        urgency: item.stock.status,
        restockBy: item.stock.restockDate,
      }));

    // Calculate inventory value and costs
    const inventorySummary = {
      totalItems: inventoryAnalysis.length,
      totalInventoryValue: inventoryAnalysis.reduce(
        (sum, item) => sum + item.financials.inventoryValue,
        0
      ),
      monthlyInventoryCost: inventoryAnalysis.reduce(
        (sum, item) => sum + item.financials.monthlyCost,
        0
      ),
      criticalItems: inventoryAnalysis.filter(item => item.stock.status === "critical").length,
      warningItems: inventoryAnalysis.filter(item => item.stock.status === "warning").length,
      goodItems: inventoryAnalysis.filter(item => item.stock.status === "good").length,
    };

    // Waste analysis (items that are rarely ordered)
    const wasteAnalysis = inventoryAnalysis
      .filter(item => item.usage.dailyAverage < 0.5)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        dailyUsage: item.usage.dailyAverage,
        currentStock: item.stock.current,
        wasteRisk: "high",
        recommendation: "Consider removing from menu or reducing stock",
        potentialSavings: item.financials.costPerUnit * item.stock.current * 0.5,
      }));

    // Best sellers
    const bestSellers = inventoryAnalysis
      .filter(item => item.usage.dailyAverage > 5)
      .sort((a, b) => b.usage.dailyAverage - a.usage.dailyAverage)
      .slice(0, 10)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        dailyAverage: item.usage.dailyAverage,
        monthlyRevenue: item.usage.monthlyProjection * 1500, // Estimate
        importance: "high",
      }));

    return NextResponse.json({
      success: true,
      summary: inventorySummary,
      inventory: inventoryAnalysis,
      purchaseOrders: {
        suggested: purchaseOrderSuggestions,
        totalCost: purchaseOrderSuggestions.reduce(
          (sum, po) => sum + po.estimatedCost,
          0
        ),
        urgent: purchaseOrderSuggestions.filter(po => po.urgency === "critical").length,
      },
      insights: {
        wasteAnalysis,
        bestSellers,
        recommendations: [
          ...(wasteAnalysis.length > 0 ? [{
            type: "cost_saving",
            title: "Reduce Waste",
            message: `${wasteAnalysis.length} items have low usage. Review for potential removal.`,
            potentialSavings: wasteAnalysis.reduce((sum, item) => sum + item.potentialSavings, 0),
          }] : []),
          ...(purchaseOrderSuggestions.filter(po => po.urgency === "critical").length > 0 ? [{
            type: "urgent_action",
            title: "Urgent Restocking Required",
            message: `${purchaseOrderSuggestions.filter(po => po.urgency === "critical").length} items need immediate restocking`,
          }] : []),
          ...(bestSellers.length > 0 ? [{
            type: "optimization",
            title: "Focus on Best Sellers",
            message: `Your top ${bestSellers.length} items generate significant revenue. Ensure adequate stock.`,
          }] : []),
        ],
      },
      timestamp: now,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/inventory
 * Create or update inventory items
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const inventorySchema = z.object({
      action: z.enum(["update_stock", "create_po", "adjust_level", "mark_waste"]),
      menuItemId: z.string(),
      data: z.object({
        quantity: z.number().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
      }),
    });

    const body = await request.json();
    const validatedData = inventorySchema.parse(body);

    let result;

    switch (validatedData.action) {
      case "update_stock":
        // Update stock level for menu item
        result = await prisma.menuItem.update({
          where: { id: validatedData.menuItemId },
          data: {
            // In a real system, you'd update an inventory table
            // For now, we'll just mark available/unavailable
            available: validatedData.data.quantity! > 0,
            lowStockAlert: validatedData.data.quantity! < 20,
          },
        });

        // Create audit log
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: "Inventory Updated",
            message: `Stock level updated for ${result.name}`,
            type: "SYSTEM",
          },
        });
        break;

      case "adjust_level":
        // Adjust stock level with reason
        result = await prisma.menuItem.update({
          where: { id: validatedData.menuItemId },
          data: {
            available: true,
          },
        });

        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: "Stock Adjusted",
            message: `${result.name}: ${validatedData.data.reason}`,
            type: "INFO",
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action: validatedData.action,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
