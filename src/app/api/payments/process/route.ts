import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { amount, method, bookingId, orderId, reference, phone, branchId } = await req.json();

    if (!amount || !method || !branchId) {
      return NextResponse.json({ error: "Amount, method, and branchId required" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentMethod: method,
        status: "completed",
        transactionId: reference || `PAY-${Date.now()}`,
        bookingId: bookingId || null,
        orderId: orderId || null,
        processedBy: decoded.userId,
        branchId,
        metadata: { processedAt: new Date().toISOString(), phone },
      },
    });

    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "paid" },
      });
    }

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "paid" },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId,
        action: "payment_processed",
        entity: "payment",
        entityId: payment.id,
        details: { amount, method, reference: payment.transactionId },
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const orderId = searchParams.get("orderId");

    const where: any = {};
    if (bookingId) where.bookingId = bookingId;
    if (orderId) where.orderId = orderId;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { id: true, bookingRef: true, guestName: true } },
      },
    });

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
