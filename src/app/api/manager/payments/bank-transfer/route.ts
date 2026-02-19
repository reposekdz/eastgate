import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// Bank transfer configuration from environment
const BANK_CONFIG = {
  enabled: process.env.BANK_TRANSFER_ENABLED === "true",
  bankName: process.env.BANK_NAME || "Bank of Kigali",
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || "100-200-300-400",
  swiftCode: process.env.BANK_SWIFT_CODE || "BKORWCLA",
  routingNumber: process.env.BANK_ROUTING_NUMBER || "123456789",
  branch: process.env.BANK_BRANCH || "Kigali Main Branch",
  country: process.env.BANK_COUNTRY || "Rwanda",
  currency: process.env.BANK_CURRENCY || "RWF",
};

// GET /api/manager/payments/bank-transfer - Get bank transfer details
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return bank details for display
    return NextResponse.json({
      success: true,
      bankDetails: {
        bankName: BANK_CONFIG.bankName,
        accountNumber: BANK_CONFIG.accountNumber,
        swiftCode: BANK_CONFIG.swiftCode,
        routingNumber: BANK_CONFIG.routingNumber,
        branch: BANK_CONFIG.branch,
        country: BANK_CONFIG.country,
        currency: BANK_CONFIG.currency,
        enabled: BANK_CONFIG.enabled,
      },
    });
  } catch (error) {
    console.error("Get bank transfer error:", error);
    return NextResponse.json(
      { error: "Failed to get bank transfer details" },
      { status: 500 }
    );
  }
}

// POST /api/manager/payments/bank-transfer - Initiate/verify bank transfer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
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
      action, // INITIATE, VERIFY, COMPLETE, CANCEL
      amount,
      currency,
      bookingId,
      eventId,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      senderBank,
      senderAccountNumber,
      senderAccountName,
      transactionReference,
      proofDocument, // Base64 or URL to proof of payment
      description,
    } = body;

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || userBranchId;
    }

    if (!branchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Handle different actions
    switch (action) {
      case "INITIATE": {
        // Initiate a new bank transfer request
        if (!amount || amount <= 0) {
          return NextResponse.json({ error: "Valid amount required" }, { status: 400 });
        }

        if (!customerName) {
          return NextResponse.json({ error: "Customer name required" }, { status: 400 });
        }

        // Generate unique transaction ID
        const transactionId = `BT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Create payment record with PENDING status
        const payment = await prisma.payment.create({
          data: {
            transactionId,
            amount: Math.round(amount * 100), // Store in cents/RWF units
            method: "BANK_TRANSFER" as any,
            status: "PENDING",
            currency: currency || BANK_CONFIG.currency,
            description: description || `Bank transfer for ${bookingId ? "booking" : eventId ? "event" : "order"}`,
            bookingId,
            eventId,
            gatewayResponse: JSON.stringify({
              action: "INITIATE",
              senderBank,
              senderAccountNumber: senderAccountNumber ? `${senderAccountNumber.slice(0, 4)}****${senderAccountNumber.slice(-4)}` : null,
              senderAccountName,
              transactionReference,
              initiatedAt: new Date().toISOString(),
              customerName,
              customerEmail,
              customerPhone,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          payment: {
            ...payment,
            amount: payment.amount / 100,
          },
          bankDetails: {
            bankName: BANK_CONFIG.bankName,
            accountNumber: BANK_CONFIG.accountNumber,
            swiftCode: BANK_CONFIG.swiftCode,
            routingNumber: BANK_CONFIG.routingNumber,
            branch: BANK_CONFIG.branch,
          },
          transactionId,
          message: "Bank transfer initiated. Please make payment and upload proof.",
          instructions: [
            `1. Transfer ${amount} ${currency || BANK_CONFIG.currency} to the account below`,
            `2. Save the transaction reference from your bank`,
            `3. Upload proof of payment to verify`,
          ],
        });
      }

      case "VERIFY": {
        // Verify a bank transfer with proof
        if (!transactionReference) {
          return NextResponse.json({ error: "Transaction reference required" }, { status: 400 });
        }

        // Find the payment by transaction ID
        const payment = await prisma.payment.findFirst({
          where: {
            transactionId: transactionReference,
            method: "BANK_TRANSFER" as any,
          },
        });

        if (!payment) {
          return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Update payment with proof
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            gatewayResponse: JSON.stringify({
              ...JSON.parse(payment.gatewayResponse as string || "{}"),
              action: "VERIFY",
              proofDocument,
              verifiedAt: new Date().toISOString(),
              verifiedBy: session.user.email,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          payment: {
            ...updatedPayment,
            amount: updatedPayment.amount / 100,
          },
          message: "Proof uploaded. Payment pending verification.",
        });
      }

      case "COMPLETE": {
        // Complete/confirm a bank transfer (admin action)
        if (!transactionReference) {
          return NextResponse.json({ error: "Transaction reference required" }, { status: 400 });
        }

        const payment = await prisma.payment.findFirst({
          where: {
            transactionId: transactionReference,
            method: "BANK_TRANSFER" as any,
          },
        });

        if (!payment) {
          return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Update payment status to completed
        const completedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED" as any,
            processedAt: new Date(),
            gatewayResponse: JSON.stringify({
              ...JSON.parse(payment.gatewayResponse as string || "{}"),
              action: "COMPLETE",
              completedAt: new Date().toISOString(),
              completedBy: session.user.email,
            }),
          },
        });

        // Update booking/order status if linked
        if (payment.bookingId) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" },
          });
        }

        return NextResponse.json({
          success: true,
          payment: {
            ...completedPayment,
            amount: completedPayment.amount / 100,
          },
          message: "Bank transfer verified and completed successfully!",
        });
      }

      case "CANCEL": {
        // Cancel a bank transfer
        if (!transactionReference) {
          return NextResponse.json({ error: "Transaction reference required" }, { status: 400 });
        }

        const payment = await prisma.payment.findFirst({
          where: {
            transactionId: transactionReference,
            method: "BANK_TRANSFER" as any,
          },
        });

        if (!payment) {
          return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Update payment status to cancelled
        const cancelledPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "CANCELLED" as any,
            gatewayResponse: JSON.stringify({
              ...JSON.parse(payment.gatewayResponse as string || "{}"),
              action: "CANCEL",
              cancelledAt: new Date().toISOString(),
              cancelledBy: session.user.email,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          payment: {
            ...cancelledPayment,
            amount: cancelledPayment.amount / 100,
          },
          message: "Bank transfer cancelled.",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bank transfer error:", error);
    return NextResponse.json(
      { error: "Bank transfer failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
