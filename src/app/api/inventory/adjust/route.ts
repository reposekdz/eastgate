import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { itemId, quantity, type, reason, orderId } = await req.json();

    if (!itemId || quantity === undefined || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.inventory.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const newQuantity = type === "add" ? item.quantity + quantity : item.quantity - quantity;
    if (newQuantity < 0) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.inventory.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      }),
      prisma.activityLog.create({
        data: {
          userId: decoded.userId,
          branchId: item.branchId,
          action: "inventory_adjust",
          entity: "inventory",
          entityId: itemId,
          details: { itemName: item.name, quantity, type, newQuantity },
        },
      }),
    ]);

    if (newQuantity <= item.reorderLevel) {
      await prisma.notification.create({
        data: {
          branchId: item.branchId,
          userId: decoded.userId,
          type: "warning",
          title: `Low Stock Alert: ${item.name}`,
          message: `Only ${newQuantity} ${item.unit} remaining. Reorder level: ${item.reorderLevel}`,
        },
      });
    }

    return NextResponse.json({ success: true, newQuantity });
  } catch (error) {
    console.error("Inventory adjust error:", error);
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
