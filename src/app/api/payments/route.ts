import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-advanced";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payments
 * Fetch payments with filters - requires auth
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
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
          select: {
            id: true,
            bookingRef: true,
            guestName: true,
            roomNumber: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error: unknown) {
    console.error("Payments fetch error:", error);
    const message = error instanceof Error ? error.message : 'Failed to fetch payments';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Create a payment record
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      bookingId,
      orderId,
      amount,
      currency = "RWF",
      paymentMethod,
      notes,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Either bookingId or orderId must be provided
    if (!bookingId && !orderId) {
      return NextResponse.json(
        { success: false, error: "Either bookingId or orderId is required" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        orderId,
        amount,
        currency,
        status: "pending",
        paymentMethod: paymentMethod || "stripe",
        notes,
        branchId: session.branchId,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingRef: true,
            guestName: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: "Payment created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Payment creation error:", error);
    const message = error instanceof Error ? error.message : 'Failed to create payment';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments
 * Update payment status
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const webhookSecret = req.headers.get("x-webhook-secret");

    // Verify either auth token or webhook secret
    if (token) {
      const session = verifyToken(token, "access");
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Invalid token" },
          { status: 401 }
        );
      }
    } else if (!webhookSecret || webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid webhook secret" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      id,
      status,
      transactionId,
      gatewayRef,
      notes,
    } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    // Verify status is valid
    const validStatuses = ["pending", "completed", "failed", "refunded", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (transactionId) updateData.transactionId = transactionId;
    if (gatewayRef) updateData.gatewayRef = gatewayRef;
    if (notes) updateData.notes = notes;

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          select: {
            id: true,
            bookingRef: true,
            guestName: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    // If payment completed, update booking
    if (status === "completed" && payment.bookingId) {
      const booking = payment.booking;
      if (booking) {
        const totalPaid = (booking.paidAmount || 0) + payment.amount;
        const bookingStatus = totalPaid >= booking.totalAmount ? "confirmed" : "pending";

        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: {
            paidAmount: totalPaid,
            paymentStatus: "paid",
            status: bookingStatus,
          },
        });
      }
    }

    // If payment failed or cancelled, keep booking in pending
    if (["failed", "cancelled"].includes(status) && payment.bookingId) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "pending" },
      });
    }

    return NextResponse.json({
      success: true,
      data: payment,
      message: "Payment updated successfully",
    });
  } catch (error: unknown) {
    console.error("Payment update error:", error);
    const message = error instanceof Error ? error.message : 'Failed to update payment';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments
 * Cancel a payment
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // Only pending payments can be cancelled
    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: "Only pending payments can be cancelled",
        },
        { status: 400 }
      );
    }

    // Update payment status
    const cancelled = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "cancelled" },
    });

    return NextResponse.json({
      success: true,
      data: cancelled,
      message: "Payment cancelled successfully",
    });
  } catch (error: unknown) {
    console.error("Payment cancellation error:", error);
    const message = error instanceof Error ? error.message : 'Failed to cancel payment';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

