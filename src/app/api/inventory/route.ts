import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock") === "true";

    const where: any = {};
    if (branchId && branchId !== "all") where.branchId = branchId;
    if (category) where.category = category;
    if (lowStock) where.quantity = { lte: prisma.raw("reorderLevel") };

    const inventory = await prisma.inventory.findMany({
      where,
      include: { branch: { select: { name: true } } },
      orderBy: { quantity: "asc" },
    });

    const alerts = inventory.filter(item => item.quantity <= item.reorderLevel);
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return NextResponse.json({
      success: true,
      data: inventory,
      alerts: alerts.map(a => ({
        id: a.id,
        name: a.name,
        quantity: a.quantity,
        reorderLevel: a.reorderLevel,
        branchName: a.branch.name,
      })),
      stats: {
        totalItems: inventory.length,
        lowStockItems: alerts.length,
        totalValue: Math.round(totalValue),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchId, name, category, quantity, unitPrice, reorderLevel, supplier } = body;

    const item = await prisma.inventory.create({
      data: { branchId, name, category, quantity, unitPrice, reorderLevel, supplier },
    });

    await prisma.activityLog.create({
      data: {
        userId: body.userId,
        branchId,
        action: "create_inventory",
        entity: "inventory",
        entityId: item.id,
        details: { name, quantity, unitPrice },
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, quantity, action } = body;

    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    const newQuantity = action === "add" ? item.quantity + quantity : item.quantity - quantity;

    const updated = await prisma.inventory.update({
      where: { id },
      data: { quantity: Math.max(0, newQuantity), lastRestocked: action === "add" ? new Date() : item.lastRestocked },
    });

    if (updated.quantity <= updated.reorderLevel) {
      await prisma.notification.create({
        data: {
          userId: body.userId,
          branchId: updated.branchId,
          type: "inventory_alert",
          title: "Low Stock Alert",
          message: `${updated.name} is running low (${updated.quantity} remaining)`,
          priority: "high",
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
