import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, services, date, time, therapist, amount, method, customer, branchId } = await req.json();

    if (!appointmentId || !services?.length || !amount || !method || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const paymentData = {
      type: "spa",
      method,
      amount,
      currency: "RWF",
      customer,
      items: services.map((service: any) => ({
        id: service.id,
        name: service.name,
        quantity: service.duration / 60,
        price: service.price,
      })),
      metadata: {
        appointmentId,
        date,
        time,
        therapist,
        branchId,
        serviceCount: services.length,
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

    await createSpaAppointment({
      appointmentId,
      services,
      date,
      time,
      therapist,
      amount,
      customer,
      branchId,
      paymentOrderId: result.orderId,
      paymentStatus: "pending",
    });

    return NextResponse.json({
      success: true,
      appointmentId,
      paymentOrderId: result.orderId,
      payment: result.payment,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function createSpaAppointment(data: any) {
  console.log("Spa appointment created:", data);
}
