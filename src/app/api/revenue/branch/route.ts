import { NextRequest, NextResponse } from "next/server";
import { getBranchRevenueAnalytics } from "@/lib/revenue-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "month";

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
    }

    const analytics = await getBranchRevenueAnalytics(branchId, period);

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
