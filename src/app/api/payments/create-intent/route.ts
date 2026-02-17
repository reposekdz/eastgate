import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-12-18.acacia",
});

// POST /api/payments/create-intent - Create Stripe payment intent
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { amount, currency = "rwf", bookingId, eventId, description } = body;

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Amount in smallest currency unit (cents/francs)
            currency: currency.toLowerCase(),
            metadata: {
                bookingId: bookingId || "",
                eventId: eventId || "",
                userId: session.user.id,
            },
            description: description || "EastGate Hotel Payment",
        });

        // Create payment record in database
        const payment = await prisma.payment.create({
            data: {
                transactionId: paymentIntent.id,
                amount,
                currency: currency.toUpperCase(),
                method: "STRIPE",
                status: "PENDING",
                bookingId,
                eventId,
                description,
                gatewayResponse: {
                    clientSecret: paymentIntent.client_secret,
                    status: paymentIntent.status,
                },
            },
        });

        return NextResponse.json({
            paymentId: payment.id,
            clientSecret: paymentIntent.client_secret,
            transactionId: paymentIntent.id,
        });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        return NextResponse.json(
            { error: "Failed to create payment intent" },
            { status: 500 }
        );
    }
}
