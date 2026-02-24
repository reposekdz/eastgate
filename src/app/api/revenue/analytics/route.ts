import { NextRequest, NextResponse } from "next/server";
import { getGlobalRevenueAnalytics } from "@/lib/revenue-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const analytics = await getGlobalRevenueAnalytics(period);

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
