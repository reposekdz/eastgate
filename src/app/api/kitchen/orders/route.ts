import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const where: any = { paymentStatus: "paid" };
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    else where.status = { in: ["pending", "preparing"] };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "Order ID and status are required" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
