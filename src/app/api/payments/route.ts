import { NextRequest, NextResponse } from "next/server";
import { withAuth, withPermission } from "@/lib/middleware-advanced";
import { successResponse, errorResponse, validateRequestBody } from "@/lib/validators";
import { processPayment, PaymentStatus, processRefund } from "@/lib/payment-system";
import { verifyToken } from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

/**
 * GET /api/payments
 * Fetch payments with filters - requires auth
 */
async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const bookingId = searchParams.get("bookingId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    
    // User can only see their branch payments if not super admin
    if (session.role !== "SUPER_ADMIN" && session.branchId) {
      where.branchId = session.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }
    
    if (bookingId) where.bookingId = bookingId;
    if (status) where.status = status;

    const total = await prisma.payment.count({ where });
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: { id: true, bookingRef: true, guestName: true, roomNumber: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse("Payments retrieved successfully", {
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Payments fetch error:", error);
    return errorResponse("Failed to fetch payments", { error: error.message }, 500);
  }
}

/**
 * POST /api/payments/process
 * Process a payment using selected gateway - requires auth
 */
async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      bookingId?: string;
      orderId?: string;
      amount: number;
      currency: string;
      method: string;
      email: string;
      fullName: string;
      description?: string;
    }>(req, ["amount", "currency", "method", "email", "fullName"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    if (body.amount <= 0) {
      return errorResponse("Invalid amount", { amount: "Amount must be greater than 0" }, 400);
    }

    // Create payment record in database
    const paymentRecord = await prisma.payment.create({
      data: {
        bookingId: body.bookingId,
        amount: body.amount,
        currency: body.currency,
        paymentMethod: body.method,
        status: "pending",
        branchId: session.branchId,
        email: body.email,
        fullName: body.fullName,
        description: body.description,
        metadata: { userId: session.id },
      },
    });

    // Process payment with selected gateway
    const paymentResult = await processPayment({
      transactionId: paymentRecord.id,
      amount: body.amount,
      currency: body.currency,
      method: body.method as any,
      email: body.email,
      fullName: body.fullName,
      description: body.description || `Payment for ${body.bookingId ? "booking" : "order"}`,
    });

    if (!paymentResult.success) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: { status: "failed" },
      });

      return errorResponse(
        "Payment processing failed",
        { gateway: paymentResult.error },
        400
      );
    }

    // Update payment with gateway response
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        gatewayRef: paymentResult.gatewayTransactionId,
        metadata: { ...paymentRecord.metadata, gatewayResponse: paymentResult },
      },
      include: {
        booking: {
          select: { id: true, bookingRef: true, guestName: true },
        },
      },
    });

    return successResponse("Payment initiated successfully", {
      payment: updatedPayment,
      paymentUrl: paymentResult.paymentUrl,
      clientSecret: paymentResult.clientSecret,
      redirectUrl: paymentResult.redirectUrl,
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return errorResponse("Failed to process payment", { error: error.message }, 500);
  }

/**
 * PUT /api/payments/:id
 * Update payment status (webhook callback) - requires auth or webhook verification
 */
async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const webhookSecret = req.headers.get("x-webhook-secret");

    // Verify either auth token or webhook secret
    if (token) {
      const session = verifyToken(token, "access");
      if (!session) {
        return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
      }
    } else if (!webhookSecret || webhookSecret !== process.env.WEBHOOK_SECRET) {
      return errorResponse("Unauthorized", { webhook: "Invalid webhook secret" }, 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      id: string;
      status: string;
      transactionId?: string;
      gatewayRef?: string;
      metadata?: Record<string, any>;
    }>(req, ["id", "status"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Verify status is valid
    const validStatuses = ["pending", "completed", "failed", "cancelled"];
    if (!validStatuses.includes(body.status)) {
      return errorResponse("Invalid status", { status: `Must be one of: ${validStatuses.join(", ")}` }, 400);
    }

    const updateData: any = { status: body.status };
    if (body.transactionId) updateData.transactionId = body.transactionId;
    if (body.gatewayRef) updateData.gatewayRef = body.gatewayRef;
    if (body.metadata) updateData.metadata = body.metadata;

    const payment = await prisma.payment.update({
      where: { id: body.id },
      data: updateData,
      include: {
        booking: {
          select: { id: true, bookingRef: true, guestName: true, totalAmount: true, paidAmount: true },
        },
      },
    });

    // If payment completed, update booking status
    if (body.status === "completed" && payment.bookingId) {
      const booking = payment.booking;
      const totalPaid = (booking?.paidAmount || 0) + payment.amount;
      const bookingStatus = totalPaid >= (booking?.totalAmount || 0) ? "confirmed" : "pending";

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { 
          paidAmount: totalPaid,
          status: bookingStatus,
          lastPaymentDate: new Date(),
        },
      });
    }

    // If payment failed, keep booking in pending
    if (body.status === "failed" && payment.bookingId) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "pending" },
      });
    }

    return successResponse("Payment updated successfully", { payment });
  } catch (error: any) {
    console.error("Payment update error:", error);
    return errorResponse("Failed to update payment", { error: error.message }, 500);
  }
}

/**
 * PATCH /api/payments/:id/refund
 * Process refund for a payment - requires auth
 */
async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    const { data: body, errors } = await validateRequestBody<{
      paymentId: string;
      amount?: number;
      reason: string;
    }>(req, ["paymentId", "reason"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Fetch payment
    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: { booking: { select: { id: true, bookingRef: true } } },
    });

    if (!payment) {
      return errorResponse("Payment not found", { paymentId: "Payment does not exist" }, 404);
    }

    if (payment.status !== "completed") {
      return errorResponse("Cannot refund", { status: "Only completed payments can be refunded" }, 400);
    }

    // Check authorization - user must be admin or payment owner
    if (session.role !== "SUPER_ADMIN" && payment.metadata?.userId !== session.id) {
      return errorResponse("Unauthorized", { permission: "You cannot refund this payment" }, 403);
    }

    // Process refund
    const refundAmount = body.amount || payment.amount;
    if (refundAmount > payment.amount) {
      return errorResponse("Invalid refund amount", { amount: "Refund cannot exceed payment amount" }, 400);
    }

    const refundResult = await processRefund({
      transactionId: payment.id,
      amount: refundAmount,
      reason: body.reason,
      gateway: payment.paymentMethod as any,
    });

    if (!refundResult.success) {
      return errorResponse("Refund failed", { gateway: refundResult.error }, 400);
    }

    // Create refund record
    const refund = await prisma.payment.create({
      data: {
        bookingId: payment.bookingId,
        amount: -refundAmount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: "completed",
        branchId: payment.branchId,
        email: payment.email,
        fullName: payment.fullName,
        description: `Refund for ${payment.id}: ${body.reason}`,
        gatewayRef: refundResult.refundId || payment.gatewayRef,
        metadata: { refundOf: payment.id, reason: body.reason },
      },
    });

    // Update original payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "refunded" },
    });

    return successResponse("Refund processed successfully", { refund });
  } catch (error: any) {
    console.error("Refund processing error:", error);
    return errorResponse("Failed to process refund", { error: error.message }, 500);
  }
}

export { GET, POST, PUT, PATCH };
