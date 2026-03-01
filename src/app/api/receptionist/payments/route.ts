import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const payments = [
      {
        id: "PAY-001",
        bookingId: "BK-2024001",
        guestName: "Sarah Mitchell",
        amount: 1300000,
        method: "visa",
        status: "completed",
        transactionId: "VI-20240212-001",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        processedBy: "Grace Uwase",
        branchId,
      },
      {
        id: "PAY-002",
        bookingId: "BK-2024002",
        guestName: "James Okafor",
        amount: 2340000,
        method: "mastercard",
        status: "completed",
        transactionId: "MC-20240212-002",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        processedBy: "Grace Uwase",
        branchId,
      },
      {
        id: "PAY-003",
        bookingId: "BK-2024005",
        guestName: "Mohammed Al-Rashid",
        amount: 832000,
        method: "mtn_mobile",
        status: "pending",
        date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        processedBy: "Emmanuel Ndayisaba",
        branchId,
      },
    ];

    return NextResponse.json({
      success: true,
      payments,
      total: payments.length,
      summary: {
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        completed: payments.filter((p) => p.status === "completed").length,
        pending: payments.filter((p) => p.status === "pending").length,
      },
    });
  } catch (error) {
    console.error("Payments fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, guestName, amount, method, branchId, processedBy } = body;

    const newPayment = {
      id: `PAY-${Date.now()}`,
      bookingId,
      guestName,
      amount,
      method,
      status: "completed",
      transactionId: `${method.toUpperCase().substring(0, 2)}-${Date.now()}`,
      date: new Date().toISOString(),
      processedBy,
      branchId,
    };

    return NextResponse.json({
      success: true,
      payment: newPayment,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
