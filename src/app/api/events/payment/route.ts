import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { eventId, eventType, venue, date, duration, guests, services, amount, method, customer, branchId } = await req.json();

    if (!eventId || !eventType || !amount || !method || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paymentData = {
      type: "event",
      method,
      amount,
      currency: "RWF",
      customer,
      items: [
        {
          id: venue,
          name: `${eventType} - ${venue}`,
          quantity: duration,
          price: amount / duration,
        },
        ...services.map((service: any) => ({
          id: service.id,
          name: service.name,
          quantity: service.quantity || 1,
          price: service.price,
        })),
      ],
      metadata: {
        eventId,
        eventType,
        venue,
        date,
        duration,
        guests,
        branchId,
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

    await createEventBooking({
      eventId,
      eventType,
      venue,
      date,
      duration,
      guests,
      services,
      amount,
      customer,
      branchId,
      paymentOrderId: result.orderId,
      paymentStatus: "pending",
    });

    return NextResponse.json({
      success: true,
      eventId,
      paymentOrderId: result.orderId,
      payment: result.payment,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function createEventBooking(data: any) {
  console.log("Event booking created:", data);
}
