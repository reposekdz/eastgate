/**
 * Advanced Payments API
 * Multi-gateway payment processing, webhook handling, and reconciliation
 */

import { NextRequest, NextResponse } from "next/server";
import {
  successResponse,
  errorResponse,
  validateRequestBody,
  validateAmount,
  generateInvoiceNumber,
} from "@/lib/validators";
import { extractToken } from "@/lib/middleware-advanced";
import {
  processPayment,
  PaymentMethod,
  PaymentStatus,
  processRefund,
  generateInvoice,
  createPaymentRecord,
  updatePaymentStatus,
  getPaymentByTransactionId,
} from "@/lib/payment-system";
import { verifyToken } from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

// ============================================
// POST /api/payments/process
// Process payment with selected gateway
// ============================================

export async function handleProcessPayment(req: NextRequest) {
  try {
    const { data: body, errors } = await validateRequestBody<{
      amount: number;
      currency: string;
      method: string;
      email: string;
      fullName: string;
      bookingId?: string;
      orderId?: string;
    }>(req, ["amount", "currency", "method", "email", "fullName"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Validate amount
    const amountValidation = validateAmount(body.amount);
    if (!amountValidation.valid) {
      return errorResponse("Validation failed", amountValidation.errors, 400);
    }

    // Get user context
    const token = extractToken(req);
    const session = token ? verifyToken(token) : null;
    const branchId = session?.branchId || req.headers.get("x-branch-id") || "default";

    // Process payment
    const paymentResponse = await processPayment({
      amount: body.amount,
      currency: body.currency,
      method: body.method as PaymentMethod,
      email: body.email,
      fullName: body.fullName,
      description: `Payment for booking/order`,
      bookingId: body.bookingId,
      orderId: body.orderId,
      branchId,
    });

    return successResponse(paymentResponse, 201);
  } catch (error) {
    console.error("Payment processing error:", error);
    return errorResponse(`Payment processing failed: ${error}`, [], 500);
  }
}

// ============================================
// GET /api/payments/:transactionId
// Get payment details
// ============================================

export async function handleGetPayment(
  req: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const payment = await getPaymentByTransactionId(params.transactionId);

    if (!payment) {
      return errorResponse("Payment not found", [], 404);
    }

    // Verify user access
    const token = extractToken(req);
    if (token) {
      const session = verifyToken(token);
      if (session && payment.branchId !== session.branchId) {
        return errorResponse("Access denied", [], 403);
      }
    }

    return successResponse({ payment });
  } catch (error) {
    console.error("Payment fetch error:", error);
    return errorResponse("Failed to fetch payment", [], 500);
  }
}

// ============================================
// POST /api/payments/refund
// Process refund
// ============================================

export async function handleProcessRefund(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return errorResponse("Authentication required", [], 401);
    }

    const session = verifyToken(token);
    if (!session) {
      return errorResponse("Invalid token", [], 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      paymentId: string;
      amount?: number;
      reason: string;
      notes?: string;
    }>(req, ["paymentId", "reason"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Process refund
    const refundResult = await processRefund({
      paymentId: body.paymentId,
      amount: body.amount,
      reason: body.reason as any,
      notes: body.notes,
    });

    return successResponse({
      message: "Refund processed successfully",
      refund: refundResult,
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    return errorResponse(`Refund failed: ${error}`, [], 500);
  }
}

// ============================================
// POST /api/payments/webhook
// Handle payment gateway webhooks
// ============================================

export async function handlePaymentWebhook(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature based on gateway
    const gateway = body.gateway || "unknown";
    const verified = verifyWebhookSignature(gateway, req, body);

    if (!verified) {
      return errorResponse("Webhook signature verification failed", [], 401);
    }

    // Update payment status based on webhook event
    const transactionId = body.transactionId || body.tx_ref || body.resource?.id;
    const status = mapWebhookStatusToPaymentStatus(
      body.status || body.event,
      gateway
    );

    if (transactionId && status) {
      await updatePaymentStatus(transactionId, status, body);
    }

    // Return success to prevent webhook retry
    return successResponse({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return successResponse({ received: true }); // Still return success to avoid retries
  }
}

// ============================================
// GET /api/payments/invoices/:invoiceNumber
// Get invoice
// ============================================

export async function handleGetInvoice(
  req: NextRequest,
  { params }: { params: { invoiceNumber: string } }
) {
  try {
    // TODO: Fetch invoice from database
    // For now, return sample
    const invoice = {
      number: params.invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billTo: {
        name: "Guest Name",
        email: "guest@example.com",
      },
      items: [
        {
          description: "Room Booking",
          quantity: 1,
          unitPrice: 100000,
          total: 100000,
        },
      ],
      subtotal: 100000,
      tax: 18000,
      total: 118000,
      status: "paid",
    };

    return successResponse({ invoice });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return errorResponse("Failed to fetch invoice", [], 500);
  }
}

// ============================================
// GET /api/payments/reconcile
// Reconcile payments (admin only)
// ============================================

export async function handleReconcilePayments(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return errorResponse("Authentication required", [], 401);
    }

    const session = verifyToken(token);
    if (!session || session.role !== "SUPER_ADMIN") {
      return errorResponse("Admin access required", [], 403);
    }

    const { startDate, endDate } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    // TODO: Implement full reconciliation
    const reconciliation = {
      period: `${startDate} to ${endDate}`,
      totalProcessed: 0,
      totalRevenue: 0,
      gateways: {
        stripe: { count: 0, amount: 0 },
        flutterwave: { count: 0, amount: 0 },
        paypal: { count: 0, amount: 0 },
      },
      discrepancies: [],
    };

    return successResponse({ reconciliation });
  } catch (error) {
    console.error("Reconciliation error:", error);
    return errorResponse("Reconciliation failed", [], 500);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  gateway: string,
  req: NextRequest,
  body: any
): boolean {
  // Implement gateway-specific signature verification
  switch (gateway) {
    case "stripe":
      // Verify Stripe signature
      const stripeSignature = req.headers.get("stripe-signature");
      // TODO: Implement Stripe signature verification
      return true;

    case "flutterwave":
      // Verify Flutterwave signature
      // TODO: Implement Flutterwave signature verification
      return true;

    case "paypal":
      // Verify PayPal signature
      // TODO: Implement PayPal signature verification
      return true;

    default:
      return false;
  }
}

/**
 * Map webhook status to payment status
 */
function mapWebhookStatusToPaymentStatus(
  webhookStatus: string,
  gateway: string
): string | null {
  switch (gateway) {
    case "stripe":
      switch (webhookStatus) {
        case "succeeded":
          return PaymentStatus.COMPLETED;
        case "payment_intent.succeeded":
          return PaymentStatus.COMPLETED;
        case "charge.failed":
          return PaymentStatus.FAILED;
        default:
          return null;
      }

    case "flutterwave":
      switch (webhookStatus) {
        case "successful":
          return PaymentStatus.COMPLETED;
        case "failed":
          return PaymentStatus.FAILED;
        case "cancelled":
          return PaymentStatus.CANCELLED;
        default:
          return null;
      }

    case "paypal":
      switch (webhookStatus) {
        case "COMPLETED":
          return PaymentStatus.COMPLETED;
        case "FAILED":
          return PaymentStatus.FAILED;
        case "CANCELLED":
          return PaymentStatus.CANCELLED;
        default:
          return null;
      }

    default:
      return null;
  }
}
