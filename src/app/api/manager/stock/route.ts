import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// Stock categories
const STOCK_CATEGORIES = {
  FOOD: ["MEAT", "VEGETABLES", "FRUITS", "DAIRY", "GRAINS", "SPICES", "BEVERAGES"],
  KITCHEN: ["UTENSILS", "CONTAINERS", "CLEANING", "PACKAGING"],
  HOUSEKEEPING: ["TOILETRIES", "LINENS", "CLEANING_SUPPLIES"],
  MAINTENANCE: ["ELECTRICAL", "PLUMBING", "PAINT", "HARDWARE"],
};

// GET /api/manager/stock - Get stock/inventory for branch
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock") === "true";
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Build where clause
    let whereClause: any = {};
    
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      if (searchParams.get("branchId")) {
        whereClause.branchId = searchParams.get("branchId");
      }
    } else {
      whereClause.branchId = userBranchId;
    }

    if (category) whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (lowStock) {
      whereClause.AND = [
        { quantity: { lte: prisma.stockItem.fields.reorderLevel } },
      ];
    }

    // Get stock items
    const [items, totalCount] = await Promise.all([
      prisma.stockItem.findMany({
        where: whereClause,
        include: {
          supplier: true,
          branch: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.stockItem.count({ where: whereClause }),
    ]);

    // Get low stock alerts
    const lowStockItems = await prisma.stockItem.findMany({
      where: {
        ...whereClause,
        quantity: { lte: 10 }, // Default low stock threshold
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        reorderLevel: true,
        unit: true,
      },
    });

    // Get stats by category
    const categoryStats = await prisma.stockItem.groupBy({
      by: ['category'],
      where: whereClause,
      _count: true,
      _sum: { quantity: true, unitCost: true },
    });

    // Get total value
    const totalValue = await prisma.stockItem.aggregate({
      where: whereClause,
      _sum: { unitCost: true },
    });

    return NextResponse.json({
      success: true,
      stockItems: items,
      totalCount,
      lowStockAlerts: lowStockItems,
      stats: {
        byCategory: categoryStats,
        totalValue: totalValue._sum.unitCost || 0,
      },
      categories: STOCK_CATEGORIES,
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error("Get stock error:", error);
    return NextResponse.json({ error: "Failed to get stock" }, { status: 500 });
  }
}

// POST /api/manager/stock - Add new stock item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      category,
      quantity,
      unit,
      unitCost,
      reorderLevel,
      supplierId,
      expiryDate,
      location,
      notes,
    } = body;

    if (!name || !category || quantity === undefined || !unitCost) {
      return NextResponse.json(
        { error: "Name, category, quantity, and unit cost are required" },
        { status: 400 }
      );
    }

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || userBranchId;
    }

    if (!branchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Check for duplicate SKU
    const existing = await prisma.stockItem.findFirst({
      where: { sku, branchId },
    });

    if (existing) {
      return NextResponse.json({ error: "SKU already exists in this branch" }, { status: 400 });
    }

    // Create stock item
    const stockItem = await prisma.stockItem.create({
      data: {
        name,
        sku: sku || `SKU-${Date.now()}`,
        category: category.toUpperCase(),
        quantity: parseFloat(quantity),
        unit: unit.toUpperCase(),
        unitCost: parseFloat(unitCost),
        reorderLevel: reorderLevel || 10,
        branchId,
        supplierId,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location: location || "",
        notes: notes || "",
        status: "IN_STOCK",
      },
      include: {
        branch: { select: { id: true, name: true } },
        supplier: true,
      },
    });

    // Create stock transaction record
    await prisma.stockTransaction.create({
      data: {
        stockItemId: stockItem.id,
        type: "IN",
        quantity: parseFloat(quantity),
        notes: "Initial stock",
        performedBy: session.user.id,
        branchId,
      },
    });

    return NextResponse.json({ success: true, stockItem });
  } catch (error) {
    console.error("Create stock error:", error);
    return NextResponse.json({ error: "Failed to create stock item" }, { status: 500 });
  }
}

// PUT /api/manager/stock - Update stock
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      stockItemId,
      quantity,
      unitCost,
      reorderLevel,
      supplierId,
      expiryDate,
      location,
      notes,
      status,
    } = body;

    if (!stockItemId) {
      return NextResponse.json({ error: "Stock item ID required" }, { status: 400 });
    }

    // Get existing item
    const existing = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    // Check branch access
    if (userRole === "BRANCH_MANAGER" && existing.branchId !== userBranchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate quantity change for transaction
    const quantityChange = quantity !== undefined ? parseFloat(quantity) - existing.quantity : 0;

    // Update stock item
    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (unitCost !== undefined) updateData.unitCost = parseFloat(unitCost);
    if (reorderLevel !== undefined) updateData.reorderLevel = reorderLevel;
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status.toUpperCase();

    // Update status based on quantity
    if (quantity !== undefined) {
      if (quantity === 0) updateData.status = "OUT_OF_STOCK";
      else if (quantity <= (existing.reorderLevel || 10)) updateData.status = "LOW_STOCK";
      else updateData.status = "IN_STOCK";
    }

    const stockItem = await prisma.stockItem.update({
      where: { id: stockItemId },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
        supplier: true,
      },
    });

    // Create transaction if quantity changed
    if (quantityChange !== 0) {
      await prisma.stockTransaction.create({
        data: {
          stockItemId,
          type: quantityChange > 0 ? "IN" : "OUT",
          quantity: Math.abs(quantityChange),
          notes: `Stock ${quantityChange > 0 ? 'added' : 'removed'}: ${Math.abs(quantityChange)} ${existing.unit}`,
          performedBy: session.user.id,
          branchId: existing.branchId,
        },
      });
    }

    // Create alert if low stock
    if (stockItem.status === "LOW_STOCK") {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "ALERT",
          title: "Low Stock Alert",
          message: `${stockItem.name} is running low (${stockItem.quantity} ${stockItem.unit} remaining)`,
          read: false,
        },
      });
    }

    return NextResponse.json({ success: true, stockItem });
  } catch (error) {
    console.error("Update stock error:", error);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}

// DELETE /api/manager/stock - Remove stock item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stockItemId = searchParams.get("stockItemId");

    if (!stockItemId) {
      return NextResponse.json({ error: "Stock item ID required" }, { status: 400 });
    }

    // Check if item exists
    const existing = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.stockItem.update({
      where: { id: stockItemId },
      data: { status: "DISCONTINUED" },
    });

    return NextResponse.json({ success: true, message: "Stock item removed" });
  } catch (error) {
    console.error("Delete stock error:", error);
    return NextResponse.json({ error: "Failed to delete stock item" }, { status: 500 });
  }
}
