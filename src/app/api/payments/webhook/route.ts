import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-12-18.acacia",
});

// POST /api/payments/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json({ error: "No signature" }, { status: 400 });
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
        }

        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        // Handle different event types
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                // Update payment record
                await prisma.payment.update({
                    where: { transactionId: paymentIntent.id },
                    data: {
                        status: "PAID",
                        processedAt: new Date(),
                        gatewayResponse: paymentIntent as any,
                    },
                });

                // Update booking payment status if applicable
                const payment = await prisma.payment.findUnique({
                    where: { transactionId: paymentIntent.id },
                });

                if (payment?.bookingId) {
                    await prisma.booking.update({
                        where: { id: payment.bookingId },
                        data: { paymentStatus: "PAID" },
                    });
                }

                if (payment?.eventId) {
                    await prisma.event.update({
                        where: { id: payment.eventId },
                        data: { paymentStatus: "PAID" },
                    });
                }

                break;

            case "payment_intent.payment_failed":
                const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;

                await prisma.payment.update({
                    where: { transactionId: failedPaymentIntent.id },
                    data: {
                        status: "PENDING",
                        gatewayResponse: failedPaymentIntent as any,
                    },
                });

                break;

            case "charge.refunded":
                const charge = event.data.object as Stripe.Charge;

                if (charge.payment_intent) {
                    const paymentIntentId = typeof charge.payment_intent === 'string'
                        ? charge.payment_intent
                        : charge.payment_intent.id;

                    await prisma.payment.update({
                        where: { transactionId: paymentIntentId },
                        data: {
                            status: "REFUNDED",
                            refundedAt: new Date(),
                            refundAmount: charge.amount_refunded,
                        },
                    });
                }

                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
