import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateOrder, getOrder, updateTransaction, getTransactionByOrderId } from "@/lib/payment-db";
import { sendPaymentNotification } from "@/lib/africas-talking";
import { generateReceipt, sendReceiptEmail } from "@/lib/receipt-generator";
import { createRevenue } from "@/lib/revenue-db";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    switch (provider) {
      case "stripe":
        return await handleStripeWebhook(req);
      case "paypal":
        return await handlePayPalWebhook(req);
      case "flutterwave":
        return await handleFlutterwaveWebhook(req);
      default:
        return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleStripeWebhook(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")!;
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = await req.text();

  try {
    const event = verifyStripeSignature(body, signature, secret);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess({
          orderId: event.data.object.metadata.orderId,
          provider: "stripe",
          amount: event.data.object.amount / 100,
          currency: event.data.object.currency.toUpperCase(),
          transactionId: event.data.object.id,
          customer: event.data.object.receipt_email,
        });
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure({
          orderId: event.data.object.metadata.orderId,
          provider: "stripe",
          reason: event.data.object.last_payment_error?.message,
        });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

async function handlePayPalWebhook(req: NextRequest) {
  const body = await req.json();
  const headers = {
    "auth-algo": req.headers.get("paypal-auth-algo")!,
    "cert-url": req.headers.get("paypal-cert-url")!,
    "transmission-id": req.headers.get("paypal-transmission-id")!,
    "transmission-sig": req.headers.get("paypal-transmission-sig")!,
    "transmission-time": req.headers.get("paypal-transmission-time")!,
  };

  const verified = await verifyPayPalWebhook(body, headers);
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (body.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      await handlePaymentSuccess({
        orderId: body.resource.purchase_units[0].reference_id,
        provider: "paypal",
        amount: parseFloat(body.resource.purchase_units[0].amount.value),
        currency: body.resource.purchase_units[0].amount.currency_code,
        transactionId: body.resource.id,
        customer: body.resource.payer.email_address,
      });
      break;

    case "PAYMENT.CAPTURE.DENIED":
      await handlePaymentFailure({
        orderId: body.resource.purchase_units[0].reference_id,
        provider: "paypal",
        reason: "Payment denied",
      });
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleFlutterwaveWebhook(req: NextRequest) {
  const signature = req.headers.get("verif-hash")!;
  const secret = process.env.FLW_SECRET_KEY!;

  if (signature !== secret) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = await req.json();

  if (body.event === "charge.completed" && body.data.status === "successful") {
    await handlePaymentSuccess({
      orderId: body.data.tx_ref.split("-")[1],
      provider: "flutterwave",
      amount: body.data.amount,
      currency: body.data.currency,
      transactionId: body.data.id,
      customer: body.data.customer.email,
    });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(data: any) {
  console.log("Payment succeeded:", data);

  const order = await getOrder(data.orderId);
  if (!order) {
    console.error("Order not found:", data.orderId);
    return;
  }

  await updateOrder(data.orderId, {
    status: "confirmed",
    paymentStatus: "paid",
    metadata: { ...order.metadata, payment: data },
  });

  const transaction = await getTransactionByOrderId(data.orderId);
  if (transaction) {
    await updateTransaction(transaction.id, {
      status: "completed",
      completedAt: new Date(),
      transactionId: data.transactionId,
    });
  }

  const tax = order.amount * 0.18;
  const discount = order.metadata?.discount || 0;
  const commission = order.amount * 0.029;
  
  await createRevenue({
    branchId: order.branchId,
    date: new Date(),
    type: order.type,
    category: getCategoryFromType(order.type),
    amount: order.amount,
    currency: order.currency,
    paymentMethod: data.provider,
    orderId: data.orderId,
    transactionId: data.transactionId,
    customerId: order.customer?.id || "unknown",
    status: "completed",
    tax,
    discount,
    netAmount: order.amount - tax - discount,
    commission,
    metadata: data,
  });

  const receiptData = {
    orderId: data.orderId,
    transactionId: data.transactionId,
    date: new Date(),
    type: order.type,
    customer: order.customer,
    items: order.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    })),
    subtotal: order.amount / 1.18,
    tax: order.amount - (order.amount / 1.18),
    discount: discount,
    total: order.amount,
    currency: order.currency,
    paymentMethod: data.provider,
    branchId: order.branchId,
    metadata: order.metadata,
  };

  const receiptHtml = await generateReceipt(receiptData);
  await sendReceiptEmail(order.customer.email, receiptHtml, data.orderId);

  await sendPaymentNotification({
    phone: order.customer.phone,
    orderId: data.orderId,
    amount: data.amount,
    currency: data.currency,
    status: "success",
  });

  await processOrderFulfillment(data.orderId);
}

async function handlePaymentFailure(data: any) {
  console.log("Payment failed:", data);

  const order = await getOrder(data.orderId);
  if (order) {
    await updateOrder(data.orderId, {
      paymentStatus: "failed",
      metadata: { ...order.metadata, failureReason: data.reason },
    });
  }

  const transaction = await getTransactionByOrderId(data.orderId);
  if (transaction) {
    await updateTransaction(transaction.id, {
      status: "failed",
      metadata: { ...transaction.metadata, failureReason: data.reason },
    });
  }

  await sendPaymentFailureNotification(data);
}

async function processOrderFulfillment(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) return;

  console.log("Processing fulfillment for:", orderId, "Type:", order.type);
  
  switch (order.type) {
    case "booking":
      console.log("Confirming room booking...");
      break;
    case "order":
      console.log("Sending order to kitchen...");
      break;
    case "menu":
      console.log("Processing delivery...");
      break;
    case "event":
      console.log("Confirming event booking...");
      break;
    case "spa":
      console.log("Scheduling spa appointment...");
      break;
  }
}

async function sendPaymentFailureNotification(data: any) {
  const order = await getOrder(data.orderId);
  if (order) {
    await sendPaymentNotification({
      phone: order.customer.phone,
      orderId: data.orderId,
      amount: order.amount,
      currency: order.currency,
      status: "failed",
    });
  }
}

type RevenueCategory = "rooms" | "food" | "beverage" | "events" | "spa" | "other";

function getCategoryFromType(type: string): RevenueCategory {
  const mapping: Record<string, RevenueCategory> = {
    booking: "rooms",
    order: "food",
    menu: "food",
    event: "events",
    spa: "spa",
    service: "other",
  };
  return mapping[type] || "other";
}

function verifyStripeSignature(body: string, signature: string, secret: string) {
  const timestamp = signature.split(",")[0].split("=")[1];
  const sig = signature.split(",")[1].split("=")[1];
  const payload = `${timestamp}.${body}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (expectedSig !== sig) {
    throw new Error("Invalid signature");
  }

  return JSON.parse(body);
}

async function verifyPayPalWebhook(body: any, headers: any): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const { access_token } = await tokenRes.json();

  const verifyRes = await fetch("https://api-m.paypal.com/v1/notifications/verify-webhook-signature", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["auth-algo"],
      cert_url: headers["cert-url"],
      transmission_id: headers["transmission-id"],
      transmission_sig: headers["transmission-sig"],
      transmission_time: headers["transmission-time"],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    }),
  });

  const result = await verifyRes.json();
  return result.verification_status === "SUCCESS";
}
