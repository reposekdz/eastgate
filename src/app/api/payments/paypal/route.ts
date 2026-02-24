import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API = process.env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, email, metadata } = await req.json();

    if (!amount || !orderId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create order with advanced features
    const order = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: orderId,
          description: `EastGate Hotel - Order ${orderId}`,
          custom_id: metadata?.branchId || "unknown",
          soft_descriptor: "EASTGATE",
          amount: {
            currency_code: "USD",
            value: (amount / 1000).toFixed(2), // Convert RWF to USD
            breakdown: {
              item_total: { currency_code: "USD", value: (amount / 1000).toFixed(2) },
            },
          },
          items: [{
            name: "Hotel Booking",
            description: "Room reservation and services",
            unit_amount: { currency_code: "USD", value: (amount / 1000).toFixed(2) },
            quantity: "1",
            category: "DIGITAL_GOODS",
          }],
        }],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              brand_name: "EastGate Hotel Rwanda",
              locale: "en-US",
              landing_page: "LOGIN",
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${process.env.NEXT_PUBLIC_URL}/payment/callback?order=${orderId}`,
              cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel?order=${orderId}`,
            },
          },
        },
        application_context: {
          brand_name: "EastGate Hotel",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = await order.json();

    if (!order.ok) {
      throw new Error(orderData.message || "PayPal order creation failed");
    }

    // Log transaction
    await logPayPalTransaction({
      orderId,
      paypalOrderId: orderData.id,
      amount,
      status: "pending",
    });

    // Get approval URL
    const approvalUrl = orderData.links.find((link: any) => link.rel === "approve")?.href;

    return NextResponse.json({
      success: true,
      approvalUrl,
      orderId: orderData.id,
      status: orderData.status,
      amount: amount,
      currency: "USD",
      metadata: {
        created: orderData.create_time,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours
      },
    });

  } catch (error: any) {
    console.error("PayPal payment error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "PayPal initialization failed" 
    }, { status: 500 });
  }
}

// Capture PayPal payment
export async function PUT(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const accessToken = await getPayPalAccessToken();

    const capture = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureData = await capture.json();

    return NextResponse.json({
      success: true,
      transactionId: captureData.id,
      status: captureData.status,
      captureId: captureData.purchase_units[0].payments.captures[0].id,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

async function logPayPalTransaction(data: any) {
  console.log("PayPal transaction logged:", data);
}
