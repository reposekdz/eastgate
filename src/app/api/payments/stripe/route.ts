import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, cardNumber, cardName, expiry, cvv, email, metadata } = await req.json();

    // Validation
    if (!amount || !orderId || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Fraud detection
    const fraudScore = await detectFraud({ amount, email, cardNumber });
    if (fraudScore > 0.8) {
      return NextResponse.json({ success: false, error: "Transaction flagged for review" }, { status: 403 });
    }

    // Create customer
    const customer = await stripe.customers.create({
      email,
      name: cardName,
      metadata: { orderId, branchId: metadata?.branchId || "unknown" },
    });

    // Create payment method
    const [expMonth, expYear] = expiry.split("/");
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardNumber,
        exp_month: parseInt(expMonth),
        exp_year: parseInt(`20${expYear}`),
        cvc: cvv,
      },
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });

    // Create payment intent with advanced features
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "rwf",
      customer: customer.id,
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        orderId,
        branchId: metadata?.branchId || "unknown",
        customerType: metadata?.customerType || "guest",
      },
      description: `EastGate Hotel - Order ${orderId}`,
      receipt_email: email,
      statement_descriptor: "EASTGATE HOTEL",
      capture_method: "automatic",
      setup_future_usage: "off_session", // Save for future payments
    });

    // Log transaction
    await logTransaction({
      transactionId: paymentIntent.id,
      orderId,
      amount,
      method: "stripe",
      status: paymentIntent.status,
      customerId: customer.id,
      fraudScore,
    });

    // Send webhook notification
    await sendWebhook({
      event: "payment.success",
      data: { orderId, transactionId: paymentIntent.id, amount },
    });

    return NextResponse.json({
      success: true,
      transactionId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerId: customer.id,
      receipt: paymentIntent.latest_charge ? `https://dashboard.stripe.com/charges/${paymentIntent.latest_charge}` : null,
      message: "Payment processed successfully",
      metadata: {
        processingTime: Date.now(),
        fraudScore,
        paymentMethod: "card",
      },
    });

  } catch (error: any) {
    console.error("Stripe payment error:", error);
    
    // Handle specific Stripe errors
    if (error.type === "StripeCardError") {
      return NextResponse.json({ 
        success: false, 
        error: "Card declined: " + error.message,
        code: error.code 
      }, { status: 402 });
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message || "Payment processing failed" 
    }, { status: 500 });
  }
}

// Fraud detection algorithm
async function detectFraud(data: any): Promise<number> {
  let score = 0;
  
  // Check amount anomalies
  if (data.amount > 1000000) score += 0.3;
  
  // Check email validity
  if (!data.email.includes("@")) score += 0.4;
  
  // Check card number patterns
  if (data.cardNumber?.startsWith("0000")) score += 0.5;
  
  return Math.min(score, 1);
}

// Transaction logging
async function logTransaction(data: any) {
  // In production: Save to database
  console.log("Transaction logged:", data);
}

// Webhook notification
async function sendWebhook(data: any) {
  // In production: Send to webhook endpoint
  console.log("Webhook sent:", data);
}
