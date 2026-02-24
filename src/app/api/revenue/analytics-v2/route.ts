import { NextRequest, NextResponse } from "next/server";
import { getRevenueAnalytics } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "month";

    const analytics = await getRevenueAnalytics(branchId, period);

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
