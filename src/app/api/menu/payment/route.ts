import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cart, amount, method, customer, branchId, deliveryAddress, deliveryType } = await req.json();

    if (!cart?.length || !amount || !method || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderId = `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const paymentData = {
      type: "menu",
      method,
      amount,
      currency: "RWF",
      customer,
      items: cart.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      metadata: {
        orderId,
        branchId,
        deliveryAddress,
        deliveryType,
        itemCount: cart.length,
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

    await createMenuOrder({
      orderId,
      cart,
      amount,
      customer,
      branchId,
      deliveryAddress,
      deliveryType,
      paymentOrderId: result.orderId,
      paymentStatus: "pending",
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

async function createMenuOrder(data: any) {
  console.log("Menu order created:", data);
}
