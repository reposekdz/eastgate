import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

function isStockManager(role: string): boolean {
  return ["STOCK_MANAGER", "SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(role);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = verifyToken(token, "access");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStockManager(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branchWhere = session.branchId ? { branchId: session.branchId } : {};

    const [stockItems, suppliers, purchaseOrders, inventory, expenses, categories] = await Promise.all([
      prisma.stockItem.findMany({
        where: branchWhere,
        include: { supplier: true },
        orderBy: { name: "asc" },
      }),
      prisma.supplier.findMany({
        where: { ...branchWhere, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.purchaseOrder.findMany({
        where: branchWhere,
        include: { supplier: true, items: { include: { stockItem: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.inventory.findMany({
        where: branchWhere,
        orderBy: { name: "asc" },
      }),
      prisma.expense.findMany({
        where: {
          ...branchWhere,
          category: { in: ["supplies", "inventory", "stock"] },
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { date: "desc" },
        take: 20,
      }),
      prisma.stockItem.findMany({
        where: branchWhere,
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    const lowStockItems = stockItems.filter((item) => item.quantity <= item.reorderLevel);
    const expiringItems = stockItems.filter((item) => {
      if (!item.expiryDate) return false;
      const days = Math.floor((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 30 && days >= 0;
    });
    const outOfStock = stockItems.filter((item) => item.quantity === 0);
    const totalStockValue = stockItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const monthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryList = categories.map((c) => c.category).filter(Boolean);

    const stats = {
      totalStockItems: stockItems.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      expiringCount: expiringItems.length,
      totalSuppliers: suppliers.length,
      pendingOrders: purchaseOrders.filter((po) => po.status === "pending").length,
      totalStockValue,
      monthlyExpenses,
      categories: categoryList,
    };

    return NextResponse.json({
      success: true,
      data: { stockItems, suppliers, purchaseOrders, lowStockItems, expiringItems, outOfStock, inventory, expenses, stats, categories: categoryList },
    });
  } catch (error) {
    console.error("Stock manager dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = verifyToken(token, "access");

    if (!session || !isStockManager(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, data } = body;

    if (type === "stock_item") {
      const stockItem = await prisma.stockItem.create({
        data: { ...data, branchId: session.branchId || data.branchId },
        include: { supplier: true },
      });
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          branchId: session.branchId || "",
          action: "stock_item_created",
          entity: "stock_item",
          entityId: stockItem.id,
          details: { name: stockItem.name, quantity: stockItem.quantity, category: stockItem.category },
        },
      });
      return NextResponse.json({ success: true, stockItem });
    }

    if (type === "supplier") {
      const supplier = await prisma.supplier.create({
        data: { ...data, branchId: session.branchId || data.branchId },
      });
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          branchId: session.branchId || "",
          action: "supplier_created",
          entity: "supplier",
          entityId: supplier.id,
          details: { name: supplier.name },
        },
      });
      return NextResponse.json({ success: true, supplier });
    }

    if (type === "purchase_order") {
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: { ...data, branchId: session.branchId || data.branchId, createdById: session.id },
        include: { supplier: true, items: true },
      });
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          branchId: session.branchId || "",
          action: "purchase_order_created",
          entity: "purchase_order",
          entityId: purchaseOrder.id,
          details: { orderNumber: purchaseOrder.orderNumber, totalAmount: purchaseOrder.totalAmount },
        },
      });
      return NextResponse.json({ success: true, purchaseOrder });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Stock manager create error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const session = verifyToken(token, "access");

    if (!session || !isStockManager(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, data } = body;

    if (type === "stock_item") {
      const oldItem = await prisma.stockItem.findUnique({ where: { id } });
      const stockItem = await prisma.stockItem.update({
        where: { id },
        data,
        include: { supplier: true },
      });
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          branchId: session.branchId || "",
          action: "stock_item_updated",
          entity: "stock_item",
          entityId: stockItem.id,
          details: { name: stockItem.name, oldQuantity: oldItem?.quantity, newQuantity: stockItem.quantity },
        },
      });
      return NextResponse.json({ success: true, stockItem });
    }

    if (type === "supplier") {
      const supplier = await prisma.supplier.update({ where: { id }, data });
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          branchId: session.branchId || "",
          action: "supplier_updated",
          entity: "supplier",
          entityId: supplier.id,
          details: { name: supplier.name },
        },
      });
      return NextResponse.json({ success: true, supplier });
    }

    if (type === "purchase_order") {
      const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id },
        data,
        include: { supplier: true, items: true },
      });
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          branchId: session.branchId || "",
          action: "purchase_order_updated",
          entity: "purchase_order",
          entityId: purchaseOrder.id,
          details: { orderNumber: purchaseOrder.orderNumber, status: purchaseOrder.status },
        },
      });
      return NextResponse.json({ success: true, purchaseOrder });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Stock manager update error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
