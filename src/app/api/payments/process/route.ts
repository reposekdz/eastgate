import { NextRequest, NextResponse } from "next/server";
import { createTransaction, createOrder as saveOrder, updateOrder } from "@/lib/payment-db";
import { sendPaymentConfirmation, sendSMS } from "@/lib/payment-utils";
import { createRevenue } from "@/lib/revenue-db";

const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;
const PAYPAL_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const FLW_SECRET = process.env.FLW_SECRET_KEY!;

interface PaymentRequest {
  type: "booking" | "order" | "menu" | "event" | "spa";
  method: "stripe" | "paypal" | "flutterwave" | "mtn" | "airtel" | "bank";
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name: string;
    phone: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata: {
    branchId: string;
    roomId?: string;
    tableId?: string;
    checkIn?: string;
    checkOut?: string;
    [key: string]: any;
  };
}

export async function POST(req: NextRequest) {
  try {
    const data: PaymentRequest = await req.json();
    const { type, method, amount, currency = "RWF", customer, items, metadata } = data;

    if (!type || !method || !amount || !customer?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const orderId = `${type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create order record
    const order = await saveOrder({
      orderId,
      type,
      status: "pending",
      paymentStatus: "pending",
      amount,
      currency,
      items: items.map(item => ({
        ...item,
        total: item.quantity * item.price
      })),
      customer: {
        id: `cust_${Date.now()}`,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      },
      branchId: metadata.branchId,
      metadata,
    });

    let paymentResult;

    switch (method) {
      case "stripe":
        paymentResult = await processStripe({ orderId, amount, currency, customer, metadata });
        break;
      case "paypal":
        paymentResult = await processPayPal({ orderId, amount, currency, customer, items, metadata });
        break;
      case "flutterwave":
        paymentResult = await processFlutterwave({ orderId, amount, currency, customer, metadata });
        break;
      case "mtn":
        paymentResult = await processMTN({ orderId, amount, customer, metadata });
        break;
      case "airtel":
        paymentResult = await processAirtel({ orderId, amount, customer, metadata });
        break;
      case "bank":
        paymentResult = await processBankTransfer({ orderId, amount, customer, metadata });
        break;
      default:
        throw new Error("Invalid payment method");
    }

    // Create transaction record
    const transactionId = (paymentResult as any).paymentIntentId || (paymentResult as any).orderId || (paymentResult as any).reference || `txn_${Date.now()}`;
    
    await createTransaction({
      orderId,
      type,
      provider: method,
      amount,
      currency,
      status: "pending",
      transactionId,
      customerId: order.customer.id,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      branchId: metadata.branchId,
      metadata: paymentResult,
    });

    // Create revenue record
    const tax = amount * 0.18;
    const discount = metadata.discount || 0;
    const commission = getCommission(method, amount);
    const transactionIdForRevenue = (paymentResult as any).paymentIntentId || (paymentResult as any).orderId || (paymentResult as any).reference || `txn_${Date.now()}`;
    
    await createRevenue({
      branchId: metadata.branchId,
      date: new Date(),
      type,
      category: getCategoryFromType(type) as "rooms" | "food" | "beverage" | "events" | "spa" | "other",
      amount,
      currency,
      paymentMethod: method,
      orderId,
      transactionId: transactionIdForRevenue,
      customerId: order.customer.id,
      status: "pending",
      tax,
      discount,
      netAmount: amount - tax - discount,
      commission,
      metadata: paymentResult,
    });

    await updateOrderPayment(orderId, paymentResult);

    return NextResponse.json({
      success: true,
      orderId,
      payment: paymentResult,
      type,
      amount,
      currency,
    });

  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processStripe(data: any) {
  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SK}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: (data.amount * 100).toString(),
      currency: data.currency.toLowerCase(),
      "metadata[orderId]": data.orderId,
      "metadata[branchId]": data.metadata.branchId,
      receipt_email: data.customer.email,
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Stripe failed");

  return {
    provider: "stripe",
    clientSecret: result.client_secret,
    paymentIntentId: result.id,
    status: result.status,
  };
}

async function processPayPal(data: any) {
  const auth = Buffer.from(`${PAYPAL_ID}:${PAYPAL_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const { access_token } = await tokenRes.json();

  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: data.orderId,
        amount: {
          currency_code: data.currency,
          value: data.amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: data.currency,
              value: data.amount.toFixed(2),
            },
          },
        },
        items: data.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: data.currency,
            value: item.price.toFixed(2),
          },
        })),
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
      },
    }),
  });

  const order = await orderRes.json();
  if (!orderRes.ok) throw new Error(order.message || "PayPal failed");

  return {
    provider: "paypal",
    orderId: order.id,
    approvalUrl: order.links.find((l: any) => l.rel === "approve")?.href,
    status: order.status,
  };
}

async function processFlutterwave(data: any) {
  const txRef = `${data.orderId}-${Date.now()}`;
  
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FLW_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: data.amount,
      currency: data.currency,
      redirect_url: `${process.env.NEXT_PUBLIC_URL}/payment/callback`,
      payment_options: "card,mobilemoneyrwanda,ussd,banktransfer",
      customer: {
        email: data.customer.email,
        phonenumber: data.customer.phone,
        name: data.customer.name,
      },
      customizations: {
        title: "EastGate Hotel Rwanda",
        description: `Payment for ${data.orderId}`,
        logo: `${process.env.NEXT_PUBLIC_URL}/logo.png`,
      },
      meta: data.metadata,
    }),
  });

  const result = await response.json();
  if (result.status !== "success") throw new Error(result.message || "Flutterwave failed");

  return {
    provider: "flutterwave",
    link: result.data.link,
    reference: txRef,
    status: "pending",
  };
}

async function processMTN(data: any) {
  const apiKey = process.env.MTN_API_KEY!;
  const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY!;

  const response = await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "X-Reference-Id": data.orderId,
      "X-Target-Environment": "mtnrwanda",
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: data.amount.toString(),
      currency: "RWF",
      externalId: data.orderId,
      payer: {
        partyIdType: "MSISDN",
        partyId: data.customer.phone.replace(/\D/g, ""),
      },
      payerMessage: `Payment for ${data.orderId}`,
      payeeNote: "EastGate Hotel Rwanda",
    }),
  });

  if (!response.ok) throw new Error("MTN Mobile Money failed");

  return {
    provider: "mtn",
    reference: data.orderId,
    status: "pending",
    phone: data.customer.phone,
  };
}

async function processAirtel(data: any) {
  const clientId = process.env.AIRTEL_CLIENT_ID!;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET!;

  const authRes = await fetch("https://openapiuat.airtel.africa/auth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  const { access_token } = await authRes.json();

  const response = await fetch("https://openapiuat.airtel.africa/merchant/v1/payments/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json",
      "X-Country": "RW",
      "X-Currency": "RWF",
    },
    body: JSON.stringify({
      reference: data.orderId,
      subscriber: {
        country: "RW",
        currency: "RWF",
        msisdn: data.customer.phone.replace(/\D/g, ""),
      },
      transaction: {
        amount: data.amount,
        country: "RW",
        currency: "RWF",
        id: data.orderId,
      },
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Airtel Money failed");

  return {
    provider: "airtel",
    reference: data.orderId,
    transactionId: result.data?.transaction?.id,
    status: "pending",
  };
}

async function processBankTransfer(data: any) {
  const reference = `BANK-${data.orderId}`;
  
  await sendBankInstructions({
    email: data.customer.email,
    reference,
    amount: data.amount,
    orderId: data.orderId,
  });

  return {
    provider: "bank",
    reference,
    status: "pending",
    instructions: {
      bankName: "Bank of Kigali",
      accountName: "EastGate Hotel Rwanda Ltd",
      accountNumber: "0001234567890",
      swiftCode: "BKIGRWRW",
      reference,
    },
  };
}

async function updateOrderPayment(orderId: string, payment: any) {
  await updateOrder(orderId, {
    paymentStatus: payment.status === "succeeded" ? "paid" : "pending",
    metadata: { payment },
  });
  console.log("Order payment updated:", { orderId, payment });
}

async function sendBankInstructions(data: any) {
  await sendPaymentConfirmation({
    email: data.email,
    orderId: data.orderId,
    amount: data.amount,
    currency: "RWF",
    transactionId: data.reference,
    type: "bank_transfer",
  });
  console.log("Bank instructions sent:", data);
}

function getCommission(method: string, amount: number): number {
  const rates: Record<string, number> = {
    stripe: 0.029,
    paypal: 0.034,
    flutterwave: 0.028,
    mtn: 0.015,
    airtel: 0.015,
    bank: 0,
  };
  return amount * (rates[method] || 0);
}

function getCategoryFromType(type: string): string {
  const mapping: Record<string, string> = {
    booking: "rooms",
    order: "food",
    menu: "food",
    event: "events",
    spa: "spa",
    service: "other",
  };
  return mapping[type] || "other";
}
