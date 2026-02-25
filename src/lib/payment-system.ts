/**
 * Advanced Payment System
 * Multi-gateway support, refund management, invoicing, and reconciliation
 */

import prisma from "@/lib/prisma";
import { generateTransactionId, generateInvoiceNumber, formatCurrency } from "@/lib/validators";

// ============================================
// PAYMENT CONSTANTS
// ============================================

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PARTIAL_REFUND = "partial_refund",
}

export enum PaymentMethod {
  STRIPE = "stripe",
  FLUTTERWAVE = "flutterwave",
  PAYPAL = "paypal",
  BANK_TRANSFER = "bank_transfer",
  CASH = "cash",
  MOBILE_MONEY = "mobile_money",
}

export enum RefundReason {
  GUEST_REQUEST = "guest_request",
  BOOKING_CANCELLATION = "booking_cancellation",
  ORDER_CANCELLATION = "order_cancellation",
  DUPLICATE_CHARGE = "duplicate_charge",
  SERVICE_ISSUE = "service_issue",
  OTHER = "other",
}

// ============================================
// PAYMENT INTERFACES
// ============================================

export interface PaymentRequest {
  amount: number;
  currency: string;
  method: PaymentMethod;
  email: string;
  fullName: string;
  description: string;
  bookingId?: string;
  orderId?: string;
  guestId?: string;
  branchId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  timestamp: Date;
  redirectUrl?: string;
  error?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund
  reason: RefundReason;
  notes?: string;
}

export interface PaymentWebhookPayload {
  event: string;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

// ============================================
// PAYMENT PROCESSING
// ============================================

/**
 * Process payment with gateway routing
 */
export async function processPayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  try {
    // Validate request
    if (request.amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const transactionId = generateTransactionId();

    // Create payment record first
    const payment = await prisma.payment.create({
      data: {
        transactionId,
        bookingId: request.bookingId,
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
        paymentMethod: request.method,
        status: "pending",
        branchId: request.branchId,
        notes: request.description,
      },
    });

    // Route to appropriate gateway
    let result: PaymentResponse;
    switch (request.method) {
      case PaymentMethod.STRIPE:
        result = await processStripePayment(request, transactionId);
        break;
      case PaymentMethod.FLUTTERWAVE:
        result = await processFlutterwavePayment(request, transactionId);
        break;
      case PaymentMethod.PAYPAL:
        result = await processPayPalPayment(request, transactionId);
        break;
      case PaymentMethod.BANK_TRANSFER:
        result = await processBankTransfer(request, transactionId);
        break;
      case PaymentMethod.CASH:
        result = await processCashPayment(request, transactionId);
        break;
      case PaymentMethod.MOBILE_MONEY:
        result = await processMobileMoneyPayment(request, transactionId);
        break;
      default:
        throw new Error(`Unsupported payment method: ${request.method}`);
    }

    // Update payment with gateway reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayRef: result.id,
        status: result.status,
      },
    });

    return result;
  } catch (error) {
    console.error("Payment processing error:", error);
    throw error;
  }
}

/**
 * Process Stripe payment
 */
async function processStripePayment(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(request.amount * 100), // Convert to cents
      currency: request.currency.toLowerCase(),
      description: request.description,
      receipt_email: request.email,
      metadata: {
        transactionId,
        bookingId: request.bookingId,
        orderId: request.orderId,
        guestId: request.guestId,
        ...request.metadata,
      },
    });

    // Create payment record
    await createPaymentRecord({
      transactionId,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.PROCESSING,
      amount: request.amount,
      currency: request.currency,
      email: request.email,
      fullName: request.fullName,
      bookingId: request.bookingId,
      orderId: request.orderId,
      guestId: request.guestId,
      branchId: request.branchId,
      externalId: paymentIntent.id,
      metadata: request.metadata,
    });

    return {
      id: paymentIntent.id,
      transactionId,
      status: PaymentStatus.PROCESSING,
      amount: request.amount,
      currency: request.currency,
      method: PaymentMethod.STRIPE,
      timestamp: new Date(),
      redirectUrl: `https://payment.stripe.com/pay/${paymentIntent.client_secret}`,
    };
  } catch (error) {
    throw new Error(`Stripe payment failed: ${error}`);
  }
}

/**
 * Process Flutterwave payment
 */
async function processFlutterwavePayment(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  try {
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: transactionId,
        amount: request.amount,
        currency: request.currency,
        customer: {
          email: request.email,
          name: request.fullName,
        },
        customizations: {
          title: request.description,
        },
        meta: {
          bookingId: request.bookingId,
          orderId: request.orderId,
          guestId: request.guestId,
          ...request.metadata,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Flutterwave API error: ${data.message}`);
    }

    // Create payment record
    await createPaymentRecord({
      transactionId,
      method: PaymentMethod.FLUTTERWAVE,
      status: PaymentStatus.PROCESSING,
      amount: request.amount,
      currency: request.currency,
      email: request.email,
      fullName: request.fullName,
      bookingId: request.bookingId,
      orderId: request.orderId,
      guestId: request.guestId,
      branchId: request.branchId,
      externalId: data.data.link,
      metadata: request.metadata,
    });

    return {
      id: data.data.link,
      transactionId,
      status: PaymentStatus.PROCESSING,
      amount: request.amount,
      currency: request.currency,
      method: PaymentMethod.FLUTTERWAVE,
      timestamp: new Date(),
      redirectUrl: data.data.link,
    };
  } catch (error) {
    throw new Error(`Flutterwave payment failed: ${error}`);
  }
}

/**
 * Process PayPal payment
 */
async function processPayPalPayment(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      "https://api.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: transactionId,
              amount: {
                currency_code: request.currency,
                value: request.amount.toString(),
              },
              description: request.description,
            },
          ],
          payer: {
            email_address: request.email,
            name: {
              given_name: request.fullName.split(" ")[0],
              surname: request.fullName.split(" ").slice(1).join(" "),
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`PayPal API error: ${data.message}`);
    }

    // Create payment record
    await createPaymentRecord({
      transactionId,
      method: PaymentMethod.PAYPAL,
      status: PaymentStatus.PROCESSING,
      amount: request.amount,
      currency: request.currency,
      email: request.email,
      fullName: request.fullName,
      bookingId: request.bookingId,
      orderId: request.orderId,
      guestId: request.guestId,
      branchId: request.branchId,
      externalId: data.id,
      metadata: request.metadata,
    });

    // Get approval link
    const approveLink = data.links.find((link: any) => link.rel === "approve");

    return {
      id: data.id,
      transactionId,
      status: PaymentStatus.PROCESSING,
      amount: request.amount,
      currency: request.currency,
      method: PaymentMethod.PAYPAL,
      timestamp: new Date(),
      redirectUrl: approveLink?.href,
    };
  } catch (error) {
    throw new Error(`PayPal payment failed: ${error}`);
  }
}

/**
 * Process bank transfer
 */
async function processBankTransfer(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  // Create payment record with pending status
  await createPaymentRecord({
    transactionId,
    method: PaymentMethod.BANK_TRANSFER,
    status: PaymentStatus.PENDING,
    amount: request.amount,
    currency: request.currency,
    email: request.email,
    fullName: request.fullName,
    bookingId: request.bookingId,
    orderId: request.orderId,
    guestId: request.guestId,
    branchId: request.branchId,
    metadata: request.metadata,
  });

  return {
    id: transactionId,
    transactionId,
    status: PaymentStatus.PENDING,
    amount: request.amount,
    currency: request.currency,
    method: PaymentMethod.BANK_TRANSFER,
    timestamp: new Date(),
  };
}

/**
 * Process cash payment
 */
async function processCashPayment(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  // Create payment record
  const payment = await createPaymentRecord({
    transactionId,
    method: PaymentMethod.CASH,
    status: PaymentStatus.COMPLETED,
    amount: request.amount,
    currency: request.currency,
    email: request.email,
    fullName: request.fullName,
    bookingId: request.bookingId,
    orderId: request.orderId,
    guestId: request.guestId,
    branchId: request.branchId,
    metadata: request.metadata,
  });

  // Generate invoice
  await generateInvoice(payment);

  return {
    id: transactionId,
    transactionId,
    status: PaymentStatus.COMPLETED,
    amount: request.amount,
    currency: request.currency,
    method: PaymentMethod.CASH,
    timestamp: new Date(),
  };
}

/**
 * Process mobile money payment
 */
async function processMobileMoneyPayment(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  // Implementation similar to Flutterwave mobile money
  return processMobileMoneyGateway(request, transactionId);
}

// ============================================
// PAYMENT RECORD MANAGEMENT
// ============================================

interface PaymentRecordData {
  transactionId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  email: string;
  fullName: string;
  bookingId?: string;
  orderId?: string;
  guestId?: string;
  branchId: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

/**
 * Create payment record in database
 */
export async function createPaymentRecord(
  data: PaymentRecordData
): Promise<any> {
  try {
    // TODO: Implement database record creation using Prisma
    console.log("Creating payment record:", data);
    // await prisma.payment.create({ data });
    return { id: data.transactionId, ...data };
  } catch (error) {
    console.error("Failed to create payment record:", error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  transactionId: string,
  status: PaymentStatus,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // TODO: Implement with Prisma
    // await prisma.payment.update({
    //   where: { transactionId },
    //   data: { status, metadata, updatedAt: new Date() }
    // });
    console.log(`Payment ${transactionId} status updated to ${status}`);
  } catch (error) {
    console.error("Failed to update payment status:", error);
    throw error;
  }
}

/**
 * Get payment by transaction ID
 */
export async function getPaymentByTransactionId(transactionId: string): Promise<any> {
  try {
    // TODO: Implement with Prisma
    // return await prisma.payment.findUnique({ where: { transactionId } });
    return null;
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    throw error;
  }
}

// ============================================
// REFUND MANAGEMENT
// ============================================

/**
 * Process refund
 */
export async function processRefund(request: RefundRequest): Promise<any> {
  try {
    const payment = await getPaymentByTransactionId(request.paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error("Payment already refunded");
    }

    const refundAmount = request.amount || payment.amount;

    // Route to appropriate gateway for refund processing
    switch (payment.method) {
      case PaymentMethod.STRIPE:
        return await processStripeRefund(payment, refundAmount);
      case PaymentMethod.FLUTTERWAVE:
        return await processFlutterwaveRefund(payment, refundAmount);
      case PaymentMethod.PAYPAL:
        return await processPayPalRefund(payment, refundAmount);
      default:
        // Manual refund for non-integrated methods
        return await createManualRefund(payment, refundAmount, request.reason);
    }
  } catch (error) {
    console.error("Refund processing error:", error);
    throw error;
  }
}

/**
 * Process Stripe refund
 */
async function processStripeRefund(
  payment: any,
  amount: number
): Promise<any> {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const refund = await stripe.refunds.create({
      payment_intent: payment.externalId,
      amount: Math.round(amount * 100),
    });

    // Update payment status
    const newStatus =
      amount < payment.amount
        ? PaymentStatus.PARTIAL_REFUND
        : PaymentStatus.REFUNDED;

    await updatePaymentStatus(payment.transactionId, newStatus);

    return { success: true, refundId: refund.id, amount };
  } catch (error) {
    throw new Error(`Stripe refund failed: ${error}`);
  }
}

/**
 * Process Flutterwave refund
 */
async function processFlutterwaveRefund(payment: any, amount: number): Promise<any> {
  // Implementation placeholder
  return createManualRefund(payment, amount, RefundReason.OTHER);
}

/**
 * Process PayPal refund
 */
async function processPayPalRefund(payment: any, amount: number): Promise<any> {
  // Implementation placeholder
  return createManualRefund(payment, amount, RefundReason.OTHER);
}

/**
 * Create manual refund record
 */
async function createManualRefund(
  payment: any,
  amount: number,
  reason: RefundReason
): Promise<any> {
  return {
    success: true,
    paymentId: payment.id,
    refundAmount: amount,
    reason,
    status: "pending",
    message: "Manual refund initiated. Please process manually.",
  };
}

// ============================================
// INVOICE GENERATION
// ============================================

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Generate invoice
 */
export async function generateInvoice(payment: any): Promise<string> {
  const invoiceNumber = generateInvoiceNumber();

  const invoice = {
    number: invoiceNumber,
    date: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    billTo: {
      name: payment.fullName,
      email: payment.email,
    },
    items: payment.items || [
      {
        description: payment.metadata?.description || "Payment",
        quantity: 1,
        unitPrice: payment.amount,
        total: payment.amount,
      },
    ],
    subtotal: payment.amount,
    tax: 0,
    total: payment.amount,
    status: "paid",
    transactionId: payment.transactionId,
  };

  // TODO: Implement invoice creation in database
  console.log("Invoice generated:", invoice);

  return invoiceNumber;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

/**
 * Process mobile money gateway
 */
async function processMobileMoneyGateway(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  // Implementation for Africa's Talking or similar provider
  // Placeholder for now
  return {
    id: transactionId,
    transactionId,
    status: PaymentStatus.PROCESSING,
    amount: request.amount,
    currency: request.currency,
    method: PaymentMethod.MOBILE_MONEY,
    timestamp: new Date(),
  };
}

/**
 * Reconcile payments
 */
export async function reconcilePayments(date: Date): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
}> {
  // TODO: Implement payment reconciliation logic
  return {
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
  };
}
