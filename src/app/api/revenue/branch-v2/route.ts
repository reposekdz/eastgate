import { NextRequest, NextResponse } from "next/server";
import { getBranchRevenue } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!branchId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const revenues = await getBranchRevenue(
      branchId,
      new Date(startDate),
      new Date(endDate)
    );

    const totalRevenue = revenues.reduce((sum: number, r: { netAmount: number }) => sum + Number(r.netAmount), 0);
    const totalTransactions = revenues.length;

    return NextResponse.json({
      success: true,
      data: {
        branchId,
        totalRevenue,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        revenues,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
