import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, amount, method, customer, branchId, tableId, roomId, orderType } = await req.json();

    if (!orderId || !items?.length || !amount || !method || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paymentData = {
      type: "order",
      method,
      amount,
      currency: "RWF",
      customer,
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      metadata: {
        orderId,
        branchId,
        tableId,
        roomId,
        orderType,
        itemCount: items.length,
      },
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Payment failed");
    }

    await updateOrderPayment({
      orderId,
      paymentOrderId: result.orderId,
      paymentStatus: "pending",
      paymentMethod: method,
    });

    return NextResponse.json({
      success: true,
      orderId,
      paymentOrderId: result.orderId,
      payment: result.payment,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function updateOrderPayment(data: any) {
  console.log("Order payment updated:", data);
}
