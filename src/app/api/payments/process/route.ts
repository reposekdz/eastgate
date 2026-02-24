import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// Default currency - RWF
const DEFAULT_CURRENCY = "RWF";

// Payment method descriptions in 10 languages
const paymentMethodLabels: Record<string, Record<string, string>> = {
  stripe_card: {
    en: "Credit/Debit Card",
    rw: "Karita / Debi",
    fr: "Carte de crédit/débit",
    sw: "Kadi ya mkopo / dhahabu",
    es: "Tarjeta de crédito/débito",
    de: "Kredit-/Debitkarte",
    zh: "信用卡/借记卡",
    ar: "بطاقة ائتمان / خصم",
    pt: "Cartão de crédito/débito",
    ja: "クレジットカード/デビットカード",
  },
  flutterwave: {
    en: "Mobile Money (Africa)",
    rw: "Mobile Money (Africa)",
    fr: "Mobile Money (Afrique)",
    sw: "Mobile Money (Africa)",
    es: "Mobile Money (África)",
    de: "Mobile Money (Afrika)",
    zh: "移动支付 (非洲)",
    ar: "المال المحمول (أفريقيا)",
    pt: "Mobile Money (África)",
    ja: "モバイル머니 (アフリカ)",
  },
  paypal: {
    en: "PayPal",
    rw: "PayPal",
    fr: "PayPal",
    sw: "PayPal",
    es: "PayPal",
    de: "PayPal",
    zh: "PayPal",
    ar: "باي بال",
    pt: "PayPal",
    ja: "PayPal",
  },
  bank_transfer: {
    en: "Bank Transfer",
    rw: "Transferi mu Banki",
    fr: "Virement bancaire",
    sw: "Mkopo wa benki",
    es: "Transferencia bancaria",
    de: "Banküberweisung",
    zh: "银行转账",
    ar: "تحويل مصرفي",
    pt: "Transferência bancária",
    ja: "銀行振込",
  },
};

// POST - Process real payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      paymentMethod,
      customerEmail,
      customerName,
      description,
      bookingId,
      orderId,
      branchId,
    } = body;

    // Validate required fields
    if (!amount || !paymentMethod || !customerEmail) {
      return NextResponse.json(
        { error: "amount, paymentMethod, and customerEmail are required" },
        { status: 400 }
      );
    }

    // Remove cash option - not allowed for online payment
    if (paymentMethod === "cash") {
      return NextResponse.json(
        { error: "Cash payment not available for online bookings" },
        { status: 400 }
      );
    }

    // Determine branch ID
    const finalBranchId = branchId || session.user.branchId || "";

    // Process based on payment method
    let paymentResult: any = null;
    let transactionId = "";
    let status = "pending";
    let redirectUrl = "";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

    switch (paymentMethod) {
      case "stripe_card":
        // Process Stripe payment
        if (!stripeSecretKey || stripeSecretKey.includes("sk_test")) {
          return NextResponse.json(
            { error: "Stripe payment not configured. Please contact support." },
            { status: 400 }
          );
        }

        try {
          const stripe = require("stripe")(stripeSecretKey);
          
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100), // Convert to cents
            currency: "usd", // Stripe uses USD/RWF for international
            metadata: {
              customerEmail,
              customerName: customerName || "",
              description: description || "",
              bookingId: bookingId || "",
              orderId: orderId || "",
              branchId: finalBranchId,
              originalAmount: amount,
              originalCurrency: DEFAULT_CURRENCY,
            },
            receipt_email: customerEmail,
          });

          paymentResult = {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            requiresAction: paymentIntent.status === "requires_action",
          };
          transactionId = paymentIntent.id;
          status = paymentIntent.status;
          
          if (paymentIntent.status === "requires_action") {
            redirectUrl = `/payment/confirm?id=${paymentIntent.id}`;
          }
        } catch (stripeError: any) {
          console.error("Stripe error:", stripeError.message);
          return NextResponse.json(
            { error: `Payment failed: ${stripeError.message}` },
            { status: 400 }
          );
        }
        break;

      case "flutterwave":
        // Process Flutterwave payment for African currencies
        if (!flutterwaveSecretKey) {
          return NextResponse.json(
            { error: "Mobile money payment not configured. Please contact support." },
            { status: 400 }
          );
        }

        try {
          const Flutterwave = require("flutterwave-node-v3");
          const flw = new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY, flutterwaveSecretKey);

          const txRef = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const flwResponse = await flw.Payments.create({
            tx_ref: txRef,
            amount: parseFloat(amount).toString(),
            currency: "RWF", // Use RWF for Flutterwave
            redirect_url: `${process.env.NEXTAUTH_URL}/payment/callback`,
            meta: {
              customerEmail,
              customerName: customerName || "",
              bookingId: bookingId || "",
              orderId: orderId || "",
              branchId: finalBranchId,
            },
            customer: {
              email: customerEmail,
              name: customerName || "",
            },
          });

          paymentResult = {
            link: flwResponse.data.link,
            txRef: txRef,
            provider: "flutterwave",
          };
          transactionId = txRef;
          redirectUrl = flwResponse.data.link;
          status = flwResponse.data.status === "success" ? "completed" : "pending";
        } catch (flwError: any) {
          console.error("Flutterwave error:", flwError.message);
          return NextResponse.json(
            { error: `Payment failed: ${flwError.message}` },
            { status: 400 }
          );
        }
        break;

      case "paypal":
        // Process PayPal payment
        if (!paypalClientId || !paypalClientSecret) {
          return NextResponse.json(
            { error: "PayPal payment not configured. Please contact support." },
            { status: 400 }
          );
        }

        try {
          const paypal = require("@paypal/checkout-server-sdk");
          
          const environment = process.env.PAYPAL_MODE === "live"
            ? new paypal.core.LiveEnvironment(paypalClientId, paypalClientSecret)
            : new paypal.core.SandboxEnvironment(paypalClientId, paypalClientSecret);
          
          const client = new paypal.core.PayPalHttpClient(environment);

          const request = new paypal.orders.OrdersCreateRequest();
          request.prefer("return=representation");
          request.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
              amount: {
                currency_code: "USD",
                value: (parseFloat(amount) * 0.00072).toFixed(2), // Convert RWF to USD
              },
              description: description || "EastGate Hotel Payment",
            }],
            payer: {
              email_address: customerEmail,
            },
          });

          const order = await client.execute(request);
          
          paymentResult = {
            orderId: order.result.id,
            approvalUrl: order.result.links?.find((l: any) => l.rel === "approve")?.href,
          };
          transactionId = order.result.id;
          redirectUrl = paymentResult.approvalUrl;
          status = order.result.status === "COMPLETED" ? "completed" : "pending";
        } catch (paypalError: any) {
          console.error("PayPal error:", paypalError.message);
          return NextResponse.json(
            { error: `Payment failed: ${paypalError.message}` },
            { status: 400 }
          );
        }
        break;

      case "bank_transfer":
        // Generate bank transfer instructions
        paymentResult = {
          type: "bank_transfer",
          bankDetails: {
            bankName: "Bank of Kigali",
            accountName: "EastGate Hotels Ltd",
            accountNumber: "1002345678901",
            swiftCode: "BKIGORWRWF",
          },
          reference: `BT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          instructions: {
            en: "Please transfer the exact amount. Include your booking reference in the payment description. Payment must be received within 48 hours to confirm your booking.",
            rw: "Mucyo mwashaka kugira nibwo mwishyura. F Include numero y'ibicuruzwa mu description. Payment igomba kugera mu masaha 48 kugira ngo  ibicuruzwa bikurikirane.",
          },
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        };
        transactionId = paymentResult.reference;
        status = "pending";
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported payment method: ${paymentMethod}` },
          { status: 400 }
        );
    }

    // Record payment in database
    const payment = await prisma.payment.create({
      data: {
        bookingId: bookingId || null,
        orderId: orderId || null,
        amount: parseFloat(amount),
        status: status === "completed" ? "completed" : "pending",
        paymentMethod,
        transactionId,
        branchId: finalBranchId,
      },
    });

    // Log payment activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: finalBranchId,
        action: "payment_initiated",
        entity: "payment",
        entityId: payment.id,
        details: {
          amount,
          currency: DEFAULT_CURRENCY,
          paymentMethod,
          status,
          transactionId,
          customerEmail,
        },
      },
    });

    // Update booking status if payment completed
    if (status === "completed" && bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "confirmed",
          paymentMethod,
        },
      });
    }

    return NextResponse.json({
      success: true,
      currency: DEFAULT_CURRENCY,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: DEFAULT_CURRENCY,
        status: payment.status,
        paymentMethod,
        transactionId,
      },
      paymentDetails: paymentResult,
      redirectUrl,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Failed to process payment. Please try again." },
      { status: 500 }
    );
  }
}

// GET - Get payment status and available methods
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const transactionId = searchParams.get("transactionId");
    const bookingId = searchParams.get("bookingId");

    // Get payment by ID, transaction, or booking
    let payment = null;

    if (paymentId) {
      payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    } else if (transactionId) {
      payment = await prisma.payment.findFirst({ where: { transactionId } });
    } else if (bookingId) {
      payment = await prisma.payment.findFirst({ where: { bookingId } });
    }

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get available payment methods based on configuration
    const availableMethods = [];
    
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("sk_test")) {
      availableMethods.push({
        id: "stripe_card",
        name: paymentMethodLabels.stripe_card.en,
        icon: "credit-card",
      });
    }
    
    if (process.env.FLUTTERWAVE_SECRET_KEY) {
      availableMethods.push({
        id: "flutterwave",
        name: paymentMethodLabels.flutterwave.en,
        icon: "smartphone",
      });
    }
    
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      availableMethods.push({
        id: "paypal",
        name: paymentMethodLabels.paypal.en,
        icon: "wallet",
      });
    }

    // Bank transfer always available
    availableMethods.push({
      id: "bank_transfer",
      name: paymentMethodLabels.bank_transfer.en,
      icon: "building",
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: DEFAULT_CURRENCY,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
      },
      availablePaymentMethods: availableMethods,
    });
  } catch (error) {
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

// PUT - Update payment status (webhook/confirm)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId, status, paymentId } = body;

    if (!paymentId && !transactionId) {
      return NextResponse.json(
        { error: "paymentId or transactionId is required" },
        { status: 400 }
      );
    }

    let payment;
    
    if (paymentId) {
      payment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status },
      });
    } else {
      const existingPayment = await prisma.payment.findFirst({ where: { transactionId } });
      if (!existingPayment) {
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status },
      });
    }

    // If payment completed, update associated booking
    if (status === "completed" && payment.bookingId) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "confirmed" },
      });
    }

    // Log status update
    await prisma.activityLog.create({
      data: {
        branchId: payment.branchId,
        action: "payment_updated",
        entity: "payment",
        entityId: payment.id,
        details: { status, transactionId: payment.transactionId },
      },
    });

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Payment update error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
