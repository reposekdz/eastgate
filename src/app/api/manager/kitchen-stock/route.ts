import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// Kitchen stock categories
const KITCHEN_CATEGORIES = {
  PRODUCE: ["VEGETABLES", "FRUITS", "HERBS"],
  PROTEINS: ["CHICKEN", "BEEF", "PORK", "FISH", "EGGS"],
  DAIRY: ["MILK", "CHEESE", "BUTTER", "CREAM", "YOGURT"],
  DRY_GOODS: ["RICE", "PASTA", "FLOUR", "SUGAR", "SPICES", "OILS"],
  BEVERAGES: ["JUICE", "SODA", "WATER", "COFFEE", "TEA"],
};

// GET /api/manager/kitchen-stock - Get kitchen stock
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock") === "true";
    const expiring = searchParams.get("expiring") === "true";
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Determine branch
    let branchFilter: any = {};
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      if (searchParams.get("branchId")) {
        branchFilter = { id: searchParams.get("branchId") };
      } else if (userBranchId) {
        branchFilter = { id: userBranchId };
      }
    } else {
      branchFilter = { id: userBranchId };
    }

    // Get branch
    const branch = await prisma.branch.findFirst({
      where: branchFilter,
      select: { id: true, name: true },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Build where clause for kitchen stock (food categories)
    let whereClause: any = {
      branchId: branch.id,
      category: {
        in: ["FOOD", "PRODUCE", "PROTEINS", "DAIRY", "DRY_GOODS", "BEVERAGES"],
      },
    };

    if (category) whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (lowStock) {
      whereClause.AND = [
        { quantity: { lte: 10 } },
      ];
    }
    if (expiring) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      whereClause.expiryDate = {
        lte: sevenDaysFromNow,
        gte: new Date(),
      };
    }

    // Get kitchen stock items
    const [items, totalCount] = await Promise.all([
      prisma.stockItem.findMany({
        where: whereClause,
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.stockItem.count({ where: whereClause }),
    ]);

    // Get low stock alerts for kitchen
    const lowStockItems = await prisma.stockItem.findMany({
      where: {
        branchId: branch.id,
        category: {
          in: ["FOOD", "PRODUCE", "PROTEINS", "DAIRY", "DRY_GOODS", "BEVERAGES"],
        },
        OR: [
          { quantity: { lte: 5 } },
          { status: "LOW_STOCK" },
          { status: "OUT_OF_STOCK" },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        unit: true,
        reorderLevel: true,
        expiryDate: true,
      },
    });

    // Get expiring items (within 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const expiringItems = await prisma.stockItem.findMany({
      where: {
        branchId: branch.id,
        category: {
          in: ["FOOD", "PRODUCE", "PROTEINS", "DAIRY", "BEVERAGES"],
        },
        expiryDate: {
          lte: threeDaysFromNow,
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        unit: true,
        expiryDate: true,
      },
      orderBy: { expiryDate: "asc" },
    });

    // Get recent transactions
    const recentTransactions = await prisma.stockTransaction.findMany({
      where: {
        stockItem: {
          branchId: branch.id,
          category: {
            in: ["FOOD", "PRODUCE", "PROTEINS", "DAIRY", "DRY_GOODS", "BEVERAGES"],
          },
        },
      },
      include: {
        stockItem: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculate category stats
    const categoryStats = await prisma.stockItem.groupBy({
      by: ["category"],
      where: {
        branchId: branch.id,
        category: {
          in: ["FOOD", "PRODUCE", "PROTEINS", "DAIRY", "DRY_GOODS", "BEVERAGES"],
        },
      },
      _count: true,
      _sum: { quantity: true, unitCost: true },
    });

    // Calculate total value
    const totalValue = await prisma.stockItem.aggregate({
      where: {
        branchId: branch.id,
        category: {
          in: ["FOOD", "PRODUCE", "PROTEINS", "DAIRY", "DRY_GOODS", "BEVERAGES"],
        },
      },
      _sum: { unitCost: true },
    });

    return NextResponse.json({
      success: true,
      kitchenStock: items,
      totalCount,
      branch: { id: branch.id, name: branch.name },
      alerts: {
        lowStock: lowStockItems,
        expiring: expiringItems,
        critical: lowStockItems.filter(i => i.quantity <= 3),
      },
      recentTransactions,
      stats: {
        byCategory: categoryStats,
        totalValue: totalValue._sum.unitCost || 0,
        totalItems: totalCount,
        lowStockCount: lowStockItems.length,
        expiringCount: expiringItems.length,
      },
      categories: KITCHEN_CATEGORIES,
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error("Get kitchen stock error:", error);
    return NextResponse.json({ error: "Failed to get kitchen stock" }, { status: 500 });
  }
}

// POST /api/manager/kitchen-stock - Add/use kitchen stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "CHEF", "KITCHEN_STAFF"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      action, // ADD_STOCK, USE_STOCK, WASTE, ADJUST
      name,
      sku,
      category,
      quantity,
      unit,
      unitCost,
      reorderLevel,
      supplierId,
      expiryDate,
      notes,
      menuItemId, // If used for specific menu item
    } = body;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    const branchId = userBranchId || body.branchId;

    // Handle different actions
    switch (action) {
      case "ADD_STOCK": {
        if (!name || !category || quantity === undefined || !unitCost) {
          return NextResponse.json(
            { error: "Name, category, quantity, and unit cost are required" },
            { status: 400 }
          );
        }

        // Check if item exists
        const existing = await prisma.stockItem.findFirst({
          where: {
            branchId,
            OR: [
              { sku: sku || undefined },
              { name: { equals: name, mode: "insensitive" } },
            ],
          },
        });

        if (existing) {
          // Update existing stock
          const updated = await prisma.stockItem.update({
            where: { id: existing.id },
            data: {
              quantity: { increment: parseFloat(quantity) },
              unitCost: parseFloat(unitCost),
              expiryDate: expiryDate ? new Date(expiryDate) : existing.expiryDate,
              status: "IN_STOCK",
            },
          });

          // Create transaction
          await prisma.stockTransaction.create({
            data: {
              stockItemId: existing.id,
              type: "IN",
              quantity: parseFloat(quantity),
              quantityBefore: existing.quantity,
              quantityAfter: updated.quantity,
              unitCost: parseFloat(unitCost),
              totalCost: parseFloat(quantity) * parseFloat(unitCost),
              notes: notes || "Stock added",
              performedBy: session.user.id,
              branchId,
            },
          });

          return NextResponse.json({ success: true, stockItem: updated, isExisting: true });
        }

        // Create new item
        const stockItem = await prisma.stockItem.create({
          data: {
            name,
            sku: sku || `KIT-${Date.now()}`,
            category: category.toUpperCase(),
            quantity: parseFloat(quantity),
            unit: unit.toUpperCase(),
            unitCost: parseFloat(unitCost),
            reorderLevel: reorderLevel || 10,
            branchId,
            supplierId,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: "IN_STOCK",
          },
        });

        // Create transaction
        await prisma.stockTransaction.create({
          data: {
            stockItemId: stockItem.id,
            type: "IN",
            quantity: parseFloat(quantity),
            quantityAfter: parseFloat(quantity),
            unitCost: parseFloat(unitCost),
            totalCost: parseFloat(quantity) * parseFloat(unitCost),
            notes: notes || "New stock item added",
            performedBy: session.user.id,
            branchId,
          },
        });

        return NextResponse.json({ success: true, stockItem, isExisting: false });
      }

      case "USE_STOCK": {
        const { stockItemId, useQuantity, orderId } = body;

        if (!stockItemId || !useQuantity) {
          return NextResponse.json({ error: "Stock item ID and quantity required" }, { status: 400 });
        }

        const item = await prisma.stockItem.findUnique({
          where: { id: stockItemId },
        });

        if (!item) {
          return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
        }

        if (item.quantity < parseFloat(useQuantity)) {
          return NextResponse.json(
            { error: `Insufficient stock. Available: ${item.quantity} ${item.unit}` },
            { status: 400 }
          );
        }

        const newQuantity = item.quantity - parseFloat(useQuantity);

        // Update stock
        const updated = await prisma.stockItem.update({
          where: { id: stockItemId },
          data: {
            quantity: newQuantity,
            status: newQuantity <= (item.reorderLevel || 10) ? "LOW_STOCK" : "IN_STOCK",
          },
        });

        // Create transaction
        await prisma.stockTransaction.create({
          data: {
            stockItemId,
            type: "OUT",
            quantity: parseFloat(useQuantity),
            quantityBefore: item.quantity,
            quantityAfter: newQuantity,
            unitCost: item.unitCost,
            totalCost: parseFloat(useQuantity) * item.unitCost,
            reference: orderId ? `Order: ${orderId}` : undefined,
            notes: notes || "Stock used",
            performedBy: session.user.id,
            branchId: item.branchId,
          },
        });

        // Create low stock alert
        if (updated.status === "LOW_STOCK") {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              type: "STOCK",
              title: "Kitchen Stock Low",
              message: `${updated.name} is running low (${updated.quantity} ${updated.unit})`,
              read: false,
            },
          });
        }

        return NextResponse.json({ success: true, stockItem: updated });
      }

      case "WASTAGE": {
        const { stockItemId, wasteQuantity, reason } = body;

        if (!stockItemId || !wasteQuantity) {
          return NextResponse.json({ error: "Stock item ID and quantity required" }, { status: 400 });
        }

        const item = await prisma.stockItem.findUnique({
          where: { id: stockItemId },
        });

        if (!item) {
          return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
        }

        const newQuantity = Math.max(0, item.quantity - parseFloat(wasteQuantity));

        // Update stock
        const updated = await prisma.stockItem.update({
          where: { id: stockItemId },
          data: {
            quantity: newQuantity,
            status: newQuantity === 0 ? "OUT_OF_STOCK" : newQuantity <= (item.reorderLevel || 10) ? "LOW_STOCK" : "IN_STOCK",
          },
        });

        // Create transaction
        await prisma.stockTransaction.create({
          data: {
            stockItemId,
            type: "WASTAGE",
            quantity: parseFloat(wasteQuantity),
            quantityBefore: item.quantity,
            quantityAfter: newQuantity,
            unitCost: item.unitCost,
            totalCost: parseFloat(wasteQuantity) * item.unitCost,
            notes: reason || "Wasted/Spoiled",
            performedBy: session.user.id,
            branchId: item.branchId,
          },
        });

        return NextResponse.json({ success: true, stockItem: updated, wasted: wasteQuantity });
      }

      case "ADJUST": {
        const { stockItemId, newQuantity, adjustmentReason } = body;

        if (!stockItemId || newQuantity === undefined) {
          return NextResponse.json({ error: "Stock item ID and new quantity required" }, { status: 400 });
        }

        const item = await prisma.stockItem.findUnique({
          where: { id: stockItemId },
        });

        if (!item) {
          return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
        }

        // Update stock
        const updated = await prisma.stockItem.update({
          where: { id: stockItemId },
          data: {
            quantity: parseFloat(newQuantity),
            status: parseFloat(newQuantity) === 0 ? "OUT_OF_STOCK" : parseFloat(newQuantity) <= (item.reorderLevel || 10) ? "LOW_STOCK" : "IN_STOCK",
          },
        });

        // Create transaction
        await prisma.stockTransaction.create({
          data: {
            stockItemId,
            type: "ADJUSTMENT",
            quantity: parseFloat(newQuantity) - item.quantity,
            quantityBefore: item.quantity,
            quantityAfter: parseFloat(newQuantity),
            notes: adjustmentReason || "Inventory adjustment",
            performedBy: session.user.id,
            branchId: item.branchId,
          },
        });

        return NextResponse.json({ success: true, stockItem: updated });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Kitchen stock error:", error);
    return NextResponse.json({ error: "Failed to process kitchen stock" }, { status: 500 });
  }
}

// PUT /api/manager/kitchen-stock - Update kitchen stock
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "CHEF"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { stockItemId, expiryDate, reorderLevel, supplierId, notes } = body;

    if (!stockItemId) {
      return NextResponse.json({ error: "Stock item ID required" }, { status: 400 });
    }

    const updateData: any = {};
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
    if (reorderLevel !== undefined) updateData.reorderLevel = reorderLevel;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (notes !== undefined) updateData.notes = notes;

    const stockItem = await prisma.stockItem.update({
      where: { id: stockItemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, stockItem });
  } catch (error) {
    console.error("Update kitchen stock error:", error);
    return NextResponse.json({ error: "Failed to update kitchen stock" }, { status: 500 });
  }
}
