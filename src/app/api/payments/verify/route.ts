import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const provider = searchParams.get("provider");
    const transactionId = searchParams.get("transactionId");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    let status;

    if (provider && transactionId) {
      status = await verifyPaymentWithProvider(provider, transactionId);
    } else {
      status = await getOrderStatus(orderId);
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: status.status,
      payment: status.payment,
      details: status.details,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function verifyPaymentWithProvider(provider: string, transactionId: string) {
  switch (provider) {
    case "stripe":
      return await verifyStripePayment(transactionId);
    case "paypal":
      return await verifyPayPalPayment(transactionId);
    case "flutterwave":
      return await verifyFlutterwavePayment(transactionId);
    case "mtn":
      return await verifyMTNPayment(transactionId);
    case "airtel":
      return await verifyAirtelPayment(transactionId);
    default:
      throw new Error("Invalid provider");
  }
}

async function verifyStripePayment(paymentIntentId: string) {
  const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    },
  });

  const intent = await response.json();

  return {
    status: intent.status === "succeeded" ? "paid" : "pending",
    payment: {
      provider: "stripe",
      transactionId: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
      method: intent.payment_method_types[0],
    },
    details: {
      created: new Date(intent.created * 1000).toISOString(),
      receiptUrl: intent.charges?.data[0]?.receipt_url,
    },
  };
}

async function verifyPayPalPayment(orderId: string) {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const { access_token } = await tokenRes.json();

  const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}`, {
    headers: {
      "Authorization": `Bearer ${access_token}`,
    },
  });

  const order = await response.json();

  return {
    status: order.status === "COMPLETED" ? "paid" : "pending",
    payment: {
      provider: "paypal",
      transactionId: order.id,
      amount: parseFloat(order.purchase_units[0].amount.value),
      currency: order.purchase_units[0].amount.currency_code,
    },
    details: {
      created: order.create_time,
      payer: order.payer.email_address,
    },
  };
}

async function verifyFlutterwavePayment(transactionId: string) {
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: {
      "Authorization": `Bearer ${process.env.FLW_SECRET_KEY}`,
    },
  });

  const result = await response.json();
  const tx = result.data;

  return {
    status: tx.status === "successful" ? "paid" : "pending",
    payment: {
      provider: "flutterwave",
      transactionId: tx.id,
      amount: tx.amount,
      currency: tx.currency,
      method: tx.payment_type,
    },
    details: {
      created: tx.created_at,
      reference: tx.tx_ref,
    },
  };
}

async function verifyMTNPayment(referenceId: string) {
  const response = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.MTN_API_KEY}`,
      "X-Target-Environment": "mtnrwanda",
      "Ocp-Apim-Subscription-Key": process.env.MTN_SUBSCRIPTION_KEY!,
    },
  });

  const result = await response.json();

  return {
    status: result.status === "SUCCESSFUL" ? "paid" : "pending",
    payment: {
      provider: "mtn",
      transactionId: referenceId,
      amount: parseFloat(result.amount),
      currency: result.currency,
    },
    details: {
      created: result.created,
      phone: result.payer.partyId,
    },
  };
}

async function verifyAirtelPayment(transactionId: string) {
  const authRes = await fetch("https://openapiuat.airtel.africa/auth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AIRTEL_CLIENT_ID,
      client_secret: process.env.AIRTEL_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  const { access_token } = await authRes.json();

  const response = await fetch(`https://openapiuat.airtel.africa/standard/v1/payments/${transactionId}`, {
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "X-Country": "RW",
      "X-Currency": "RWF",
    },
  });

  const result = await response.json();

  return {
    status: result.data.transaction.status === "TS" ? "paid" : "pending",
    payment: {
      provider: "airtel",
      transactionId: result.data.transaction.id,
      amount: parseFloat(result.data.transaction.amount),
      currency: "RWF",
    },
    details: {
      created: result.data.transaction.created_at,
    },
  };
}

async function getOrderStatus(orderId: string) {
  console.log("Fetching order status:", orderId);
  return {
    status: "pending",
    payment: null,
    details: {},
  };
}
