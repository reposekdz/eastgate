import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simulated mobile money payment processing
// In production, this would integrate with MTN/Airtel APIs

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            amount,
            phoneNumber,
            provider, // "mtn" or "airtel"
            customerName,
            customerEmail,
            type, // "booking" or "order"
            referenceId
        } = body;

        // Validate required fields
        if (!amount || !phoneNumber || !provider || !type || !referenceId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate provider
        if (!["mtn", "airtel"].includes(provider)) {
            return NextResponse.json(
                { error: "Invalid provider. Must be 'mtn' or 'airtel'" },
                { status: 400 }
            );
        }

        // Generate transaction reference
        const transactionRef = `EG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // In a real implementation, you would call the MTN/Airtel API here
        // For now, we'll create a pending payment record

        // Create payment record in database
        const payment = await prisma.payment.create({
            data: {
                amount,
                status: "pending",
                paymentMethod: provider === "mtn" ? "mtn_mobile" : "airtel_money",
                transactionId: transactionRef,
                branchId: "main-branch",
            },
        });

        // Simulate payment processing (in production, this would be handled by callbacks)
        // For demo purposes, we'll simulate a successful payment after a short delay
        setTimeout(async () => {
            try {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: "completed" },
                });
            } catch (error) {
                console.error("Failed to update payment status:", error);
            }
        }, 5000); // Simulates 5 second processing time

        return NextResponse.json({
            success: true,
            message: `Payment request sent to ${provider.toUpperCase()} number ${phoneNumber}`,
            transactionRef,
            amount,
            provider: provider.toUpperCase(),
            status: "pending",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });
    } catch (error) {
        console.error("Mobile money payment error:", error);
        return NextResponse.json(
            { error: "Failed to process mobile money payment" },
            { status: 500 }
        );
    }
}

// Check payment status
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const transactionRef = searchParams.get("transactionRef");

        if (!transactionRef) {
            return NextResponse.json(
                { error: "Transaction reference is required" },
                { status: 400 }
            );
        }

        // Find payment by transaction ID
        const payment = await prisma.payment.findFirst({
            where: { transactionId: transactionRef },
        });

        if (!payment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: payment.status,
            amount: payment.amount,
            transactionRef: payment.transactionId,
            createdAt: payment.createdAt,
        });
    } catch (error) {
        console.error("Payment status check error:", error);
        return NextResponse.json(
            { error: "Failed to check payment status" },
            { status: 500 }
        );
    }
}
