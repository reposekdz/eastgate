import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const type = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const report = {
      type,
      date,
      branchId,
      summary: {
        totalCheckIns: 8,
        totalCheckOuts: 5,
        currentOccupancy: 75,
        totalRevenue: 2450000,
        roomRevenue: 1850000,
        restaurantRevenue: 420000,
        serviceRevenue: 180000,
        averageRoomRate: 385000,
        totalGuests: 32,
        newBookings: 12,
        cancelledBookings: 2,
      },
      roomStatus: {
        occupied: 30,
        available: 15,
        cleaning: 3,
        maintenance: 1,
        reserved: 2,
        total: 51,
      },
      topRoomTypes: [
        { type: "Deluxe", bookings: 12, revenue: 780000 },
        { type: "Executive Suite", bookings: 8, revenue: 936000 },
        { type: "Standard", bookings: 6, revenue: 280800 },
      ],
      serviceRequests: {
        total: 24,
        completed: 18,
        pending: 4,
        urgent: 2,
      },
      staffPerformance: [
        { name: "Grace Uwase", checkIns: 5, checkOuts: 3, rating: 4.8 },
        { name: "Emmanuel Ndayisaba", checkIns: 3, checkOuts: 2, rating: 4.6 },
      ],
      guestFeedback: {
        excellent: 15,
        good: 8,
        average: 2,
        poor: 0,
        averageRating: 4.7,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    const reportId = `RPT-${Date.now()}`;
    const downloadUrl = `/api/receptionist/reports/${reportId}/download`;

    return NextResponse.json({
      success: true,
      reportId,
      downloadUrl,
      message: `${type} report generated successfully`,
    });
  } catch (error) {
    console.error("Report creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}
