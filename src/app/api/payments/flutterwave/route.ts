import { NextRequest, NextResponse } from "next/server";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY!;
const FLW_API = "https://api.flutterwave.com/v3";

export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, email, name, phone, metadata } = await req.json();

    if (!amount || !orderId || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const txRef = `EASTGATE-${orderId}-${Date.now()}`;

    // Create payment link with advanced features
    const response = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amount,
        currency: "RWF",
        redirect_url: `${process.env.NEXT_PUBLIC_URL}/payment/callback`,
        payment_options: "card,mobilemoneyrwanda,ussd,banktransfer",
        customer: {
          email: email,
          phonenumber: phone || "+250788000000",
          name: name || "Guest",
        },
        customizations: {
          title: "EastGate Hotel Rwanda",
          description: `Payment for Order ${orderId}`,
          logo: `${process.env.NEXT_PUBLIC_URL}/logo.png`,
        },
        meta: {
          orderId: orderId,
          branchId: metadata?.branchId || "unknown",
          customerType: metadata?.customerType || "guest",
          source: "web",
        },
        payment_plan: null,
        subaccounts: [],
      }),
    });

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "Flutterwave initialization failed");
    }

    // Log transaction
    await logFlutterwaveTransaction({
      txRef,
      orderId,
      amount,
      status: "pending",
      flwRef: data.data.id,
    });

    return NextResponse.json({
      success: true,
      link: data.data.link,
      reference: txRef,
      flwRef: data.data.id,
      amount: amount,
      currency: "RWF",
      metadata: {
        created: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });

  } catch (error: any) {
    console.error("Flutterwave payment error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Flutterwave initialization failed" 
    }, { status: 500 });
  }
}

// Verify Flutterwave payment
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Missing transaction ID" }, { status: 400 });
    }

    // Verify transaction
    const response = await fetch(`${FLW_API}/transactions/${transactionId}/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error("Transaction verification failed");
    }

    const transaction = data.data;

    // Validate transaction
    if (transaction.status !== "successful" || transaction.currency !== "RWF") {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid transaction" 
      }, { status: 400 });
    }

    // Update transaction status
    await updateFlutterwaveTransaction({
      txRef: transaction.tx_ref,
      status: "completed",
      flwRef: transaction.id,
      amount: transaction.amount,
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      txRef: transaction.tx_ref,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      paymentType: transaction.payment_type,
      customer: {
        email: transaction.customer.email,
        name: transaction.customer.name,
      },
      metadata: transaction.meta,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function logFlutterwaveTransaction(data: any) {
  console.log("Flutterwave transaction logged:", data);
}

async function updateFlutterwaveTransaction(data: any) {
  console.log("Flutterwave transaction updated:", data);
}
