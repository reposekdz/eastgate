import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payments/public
 * Create real payment with Stripe/PayPal/Flutterwave
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      amount,
      currency = "RWF",
      method = "stripe_card",
      email,
      fullName,
      phone,
      description,
      branchId,
    } = body;

    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid booking or amount" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        currency,
        status: "pending",
        paymentMethod: method,
        branchId: branchId || "kigali-main",
        notes: description || `Payment for booking ${bookingId}`,
      },
    });

    // Route to appropriate payment gateway
    if (method.includes("stripe")) {
      // Stripe Payment
      const stripeRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/payments/stripe/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          email,
          metadata: { bookingId, paymentId: payment.id, branchId },
        }),
      });
      const stripeData = await stripeRes.json();
      
      if (!stripeData.success) {
        throw new Error(stripeData.error || "Stripe initialization failed");
      }

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        gateway: "stripe",
        clientSecret: stripeData.clientSecret,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        amount,
        currency,
      });
    } 
    else if (method.includes("paypal")) {
      // PayPal Payment
      const paypalRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/payments/paypal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          orderId: bookingId,
          email,
          metadata: { bookingId, paymentId: payment.id, branchId },
        }),
      });
      const paypalData = await paypalRes.json();
      
      if (!paypalData.success) {
        throw new Error(paypalData.error || "PayPal initialization failed");
      }

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        gateway: "paypal",
        approvalUrl: paypalData.approvalUrl,
        orderId: paypalData.orderId,
        amount,
        currency: "USD",
      });
    }
    else if (method.includes("flutterwave")) {
      // Flutterwave Payment
      const flwRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/payments/flutterwave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          orderId: bookingId,
          email,
          name: fullName,
          phone,
          metadata: { bookingId, paymentId: payment.id, branchId },
        }),
      });
      const flwData = await flwRes.json();
      
      if (!flwData.success) {
        throw new Error(flwData.error || "Flutterwave initialization failed");
      }

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        gateway: "flutterwave",
        paymentUrl: flwData.link,
        reference: flwData.reference,
        amount,
        currency,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid payment method" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Public payment creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/public
 * Update payment status after gateway confirmation
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, status, transactionId, gatewayRef } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing paymentId or status" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "completed", "failed", "refunded", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId: transactionId || `txn_${Date.now()}`,
        gatewayRef: gatewayRef || null,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingRef: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    // Update booking if payment completed
    if (status === "completed" && payment.bookingId) {
      const booking = payment.booking;
      if (booking) {
        const totalPaid = (booking.paidAmount || 0) + payment.amount;
        const bookingStatus = totalPaid >= booking.totalAmount ? "confirmed" : "pending";

        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paidAmount: totalPaid,
            paymentStatus: "paid",
            status: bookingStatus,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      message: "Payment updated successfully",
    });
  } catch (error: unknown) {
    console.error("Public payment update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update payment";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
