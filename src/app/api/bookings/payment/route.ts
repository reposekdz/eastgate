import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, roomId, checkIn, checkOut, guests, amount, method, customer, branchId } = await req.json();

    if (!bookingId || !roomId || !amount || !method || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const roomRate = amount / nights;

    const paymentData = {
      type: "booking",
      method,
      amount,
      currency: "RWF",
      customer,
      items: [{
        id: roomId,
        name: `Room Booking - ${nights} night(s)`,
        quantity: nights,
        price: roomRate,
      }],
      metadata: {
        bookingId,
        roomId,
        branchId,
        checkIn,
        checkOut,
        guests,
        nights,
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

    await createBookingRecord({
      bookingId,
      roomId,
      checkIn,
      checkOut,
      guests,
      amount,
      branchId,
      customer,
      orderId: result.orderId,
      paymentStatus: "pending",
    });

    return NextResponse.json({
      success: true,
      bookingId,
      orderId: result.orderId,
      payment: result.payment,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function createBookingRecord(data: any) {
  console.log("Booking created:", data);
}
