import { NextRequest, NextResponse } from "next/server";

// Lazy load Stripe to avoid build-time initialization errors
const getStripe = async () => {
    const { default: Stripe } = await import("stripe");
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
        return null;
    }
    return new Stripe(apiKey, {
        apiVersion: "2025-01-27.acacia",
    });
};

export async function POST(req: NextRequest) {
    try {
        const stripe = await getStripe();
        if (!stripe) {
            return NextResponse.json(
                { error: "Payment provider not configured" },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { amount, currency = "rwf", customerEmail, description, metadata } = body;

        // Validate amount
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            );
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            description: description || "Eastgate Hotel Payment",
            receipt_email: customerEmail,
            metadata: metadata || {},
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error("Stripe payment error:", error);
        return NextResponse.json(
            { error: "Failed to create payment intent" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const stripe = await getStripe();
        if (!stripe) {
            return NextResponse.json(
                { error: "Payment provider not configured" },
                { status: 503 }
            );
        }

        const { searchParams } = new URL(req.url);
        const paymentIntentId = searchParams.get("paymentIntentId");

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: "Payment intent ID is required" },
                { status: 400 }
            );
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return NextResponse.json({
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
        });
    } catch (error) {
        console.error("Stripe retrieval error:", error);
        return NextResponse.json(
            { error: "Failed to retrieve payment status" },
            { status: 500 }
        );
    }
}
