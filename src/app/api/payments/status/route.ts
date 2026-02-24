import { NextRequest, NextResponse } from "next/server";
import { getOrder, getTransactionByOrderId } from "@/lib/payment-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const transaction = await getTransactionByOrderId(orderId);

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        type: order.type,
        status: order.status,
        paymentStatus: order.paymentStatus,
        amount: order.amount,
        currency: order.currency,
        customer: order.customer,
        items: order.items,
        branchId: order.branchId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      transaction: transaction ? {
        transactionId: transaction.transactionId,
        provider: transaction.provider,
        status: transaction.status,
        completedAt: transaction.completedAt,
      } : null,
      timeline: generateTimeline(order, transaction),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateTimeline(order: any, transaction: any) {
  const timeline = [
    {
      status: "created",
      timestamp: order.createdAt,
      message: "Order created",
      completed: true,
    },
    {
      status: "payment_initiated",
      timestamp: order.createdAt,
      message: "Payment initiated",
      completed: true,
    },
  ];

  if (order.paymentStatus === "paid") {
    timeline.push({
      status: "payment_completed",
      timestamp: transaction?.completedAt || order.updatedAt,
      message: "Payment completed successfully",
      completed: true,
    });
    timeline.push({
      status: "confirmed",
      timestamp: order.updatedAt,
      message: "Order confirmed",
      completed: true,
    });
  } else if (order.paymentStatus === "failed") {
    timeline.push({
      status: "payment_failed",
      timestamp: order.updatedAt,
      message: "Payment failed",
      completed: true,
    });
  } else {
    timeline.push({
      status: "payment_pending",
      timestamp: new Date(),
      message: "Awaiting payment confirmation",
      completed: false,
    });
  }

  return timeline;
}
