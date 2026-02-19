import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// POST /api/manager/payments - Create payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "RECEPTIONIST", "ACCOUNTANT"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      type, // CREATE_PAYMENT, REFUND, PROCESS_CASH, PROCESS_MOBILE
      amount,
      currency,
      bookingId,
      eventId,
      orderId,
      paymentMethod,
      customerEmail,
      customerName,
      customerPhone,
      description,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
    }

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || userBranchId;
    }

    if (!branchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Handle different payment types
    switch (type) {
      case "CREATE_PAYMENT": {
        // Create payment intent with Stripe (mock for now)
        const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

        // In production, this would call Stripe API:
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: Math.round(amount * 100), // Stripe uses cents
        //   currency: currency?.toLowerCase() || 'rwf',
        //   metadata: { bookingId, eventId, branchId },
        // });

        // Create payment record
        const payment = await prisma.payment.create({
          data: {
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            amount: Math.round(amount * 100), // Store in cents
            method: (paymentMethod || "STRIPE").toUpperCase() as any,
            status: "PENDING",
            currency: currency || "RWF",
            description: description || `Payment for ${bookingId ? "booking" : eventId ? "event" : "order"}`,
            bookingId,
            eventId,
            gatewayResponse: JSON.stringify({
              paymentIntentId,
              clientSecret,
              created: new Date().toISOString(),
            }),
          },
        });

        return NextResponse.json({
          success: true,
          payment: {
            ...payment,
            amount: payment.amount / 100,
          },
          clientSecret,
          message: "Payment intent created",
        });
      }

      case "PROCESS_CASH": {
        // Process cash payment
        const payment = await prisma.payment.create({
          data: {
            transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            amount: Math.round(amount * 100),
            method: "CASH",
            status: "PAID",
            currency: currency || "RWF",
            description: description || "Cash payment",
            bookingId,
            eventId,
            processedAt: new Date(),
          },
        });

        // Update booking payment status if bookingId provided
        if (bookingId) {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
          });

          if (booking) {
            await prisma.booking.update({
              where: { id: bookingId },
              data: {
                paymentStatus: "PAID",
                paymentMethod: "CASH",
              },
            });
          }
        }

        return NextResponse.json({
          success: true,
          payment: {
            ...payment,
            amount: payment.amount / 100,
          },
          message: "Cash payment processed",
        });
      }

      case "PROCESS_MOBILE": {
        // Process mobile money payment (MTN, Airtel)
        const mobileMethod = body.mobileOperator || "MTN_MONEY";
        
        const payment = await prisma.payment.create({
          data: {
            transactionId: `MOBILE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            amount: Math.round(amount * 100),
            method: mobileMethod.toUpperCase() as any,
            status: "PENDING",
            currency: currency || "RWF",
            description: description || `${mobileMethod} payment`,
            bookingId,
            eventId,
            gatewayResponse: JSON.stringify({
              operator: mobileMethod,
              customerPhone,
              customerEmail,
              requestTime: new Date().toISOString(),
            }),
          },
        });

        // Simulate successful mobile payment
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            processedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          payment: {
            ...payment,
            amount: payment.amount / 100,
          },
          message: `${mobileMethod} payment initiated`,
        });
      }

      case "REFUND": {
        const { paymentId, refundAmount, reason } = body;

        if (!paymentId) {
          return NextResponse.json({ error: "Payment ID required for refund" }, { status: 400 });
        }

        // Get original payment
        const originalPayment = await prisma.payment.findUnique({
          where: { id: paymentId },
        });

        if (!originalPayment) {
          return NextResponse.json({ error: "Original payment not found" }, { status: 404 });
        }

        const refund = refundAmount || amount;
        
        // Create refund record
        const refundPayment = await prisma.payment.create({
          data: {
            transactionId: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            amount: -Math.round(refund * 100),
            method: originalPayment.method,
            status: "REFUNDED",
            currency: originalPayment.currency,
            description: reason || "Refund processed",
            bookingId: originalPayment.bookingId,
            eventId: originalPayment.eventId,
            refundedAt: new Date(),
            refundAmount: Math.round(refund * 100),
            gatewayResponse: JSON.stringify({
              originalPaymentId: paymentId,
              refundAmount: refund,
              reason,
              processedAt: new Date().toISOString(),
            }),
          },
        });

        return NextResponse.json({
          success: true,
          refund: {
            ...refundPayment,
            amount: Math.abs(refundPayment.amount / 100),
          },
          message: `Refund of ${refund} processed`,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}

// GET /api/manager/payments - Get payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url);
    const status = searchParams.searchParams.get("status");
    const paymentMethod = searchParams.searchParams.get("method");
    const bookingId = searchParams.searchParams.get("bookingId");
    const startDate = searchParams.searchParams.get("startDate");
    const endDate = searchParams.searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Build where clause
    let whereClause: any = {};
    
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      if (searchParams.searchParams.get("branchId")) {
        whereClause.branchId = searchParams.searchParams.get("branchId");
      }
    } else {
      whereClause.branchId = userBranchId;
    }

    if (status) whereClause.status = status;
    if (paymentMethod) whereClause.method = paymentMethod;
    if (bookingId) whereClause.bookingId = bookingId;
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get payments with relations
    const [payments, totalCount, summary] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          booking: {
            select: { id: true, bookingNumber: true, guest: { select: { firstName: true, lastName: true } } },
          },
          event: {
            select: { id: true, eventNumber: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where: whereClause }),
      
      // Get summary stats
      prisma.payment.groupBy({
        by: ["status"],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Calculate totals
    const totalReceived = summary
      .filter(s => s.status === "PAID")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);
    
    const totalPending = summary
      .filter(s => s.status === "PENDING")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);
    
    const totalRefunded = summary
      .filter(s => s.status === "REFUNDED")
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    // Get payments by method
    const byMethod = await prisma.payment.groupBy({
      by: ["method"],
      where: whereClause,
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      payments: payments.map(p => ({
        ...p,
        amount: p.amount / 100,
      })),
      totalCount,
      summary: {
        totalReceived: totalReceived / 100,
        totalPending: totalPending / 100,
        totalRefunded: totalRefunded / 100,
        byStatus: summary.map(s => ({
          status: s.status,
          count: s._count,
          amount: (s._sum.amount || 0) / 100,
        })),
        byMethod: byMethod.map(m => ({
          method: m.method,
          count: m._count,
          amount: (m._sum.amount || 0) / 100,
        })),
      },
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "Failed to get payments" }, { status: 500 });
  }
}

// PUT /api/manager/payments - Update payment status (webhook handler)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, status, gatewayResponse } = body;

    if (!paymentId || !status) {
      return NextResponse.json({ error: "Payment ID and status required" }, { status: 400 });
    }

    // Get existing payment
    const existing = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment
    const updateData: any = { status: status.toUpperCase() };
    
    if (status === "PAID") {
      updateData.processedAt = new Date();
    }
    
    if (gatewayResponse) {
      updateData.gatewayResponse = JSON.stringify(gatewayResponse);
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    // If payment is for a booking, update booking payment status
    if (existing.bookingId && status === "PAID") {
      await prisma.booking.update({
        where: { id: existing.bookingId },
        data: {
          paymentStatus: "PAID",
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        amount: payment.amount / 100,
      },
    });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
