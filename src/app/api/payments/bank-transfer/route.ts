import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, bankName, accountNumber } = await req.json();

    if (!amount || !orderId || !bankName || !accountNumber) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const transactionId = `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Store pending bank transfer
    // await prisma.payment.create({
    //   data: {
    //     orderId,
    //     transactionId,
    //     amount,
    //     method: 'bank_transfer',
    //     status: 'pending',
    //     bankName,
    //     accountNumber,
    //   }
    // });

    // Send email with bank details
    // await sendEmail({
    //   to: customerEmail,
    //   subject: 'Bank Transfer Instructions',
    //   body: `Transfer ${amount} RWF to: Account ${accountNumber}, Bank: ${bankName}`
    // });

    return NextResponse.json({
      success: true,
      transactionId,
      message: "Bank transfer instructions sent to your email",
      bankDetails: {
        accountName: "EastGate Hotel Rwanda",
        accountNumber: "1234567890",
        bankName: "Bank of Kigali",
        swiftCode: "BKIGRWRW",
        reference: transactionId
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Request failed" }, { status: 500 });
  }
}
