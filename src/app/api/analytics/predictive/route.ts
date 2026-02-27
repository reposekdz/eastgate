import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || decoded.branchId;
    const days = parseInt(searchParams.get("days") || "30");

    // Get historical data for the past 90 days
    const historicalStart = new Date();
    historicalStart.setDate(historicalStart.getDate() - 90);

    const historicalBookings = await prisma.booking.findMany({
      where: {
        branchId,
        checkIn: { gte: historicalStart },
        status: { in: ["confirmed", "checked_in", "checked_out"] },
      },
      select: {
        checkIn: true,
        checkOut: true,
        totalAmount: true,
        adults: true,
        children: true,
      },
    });

    const totalRooms = await prisma.room.count({
      where: { branchId, status: { not: "maintenance" } },
    });

    // Calculate daily occupancy rates
    const dailyOccupancy: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    historicalBookings.forEach((booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0];
        dailyOccupancy[dateKey] = (dailyOccupancy[dateKey] || 0) + 1;
        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + (booking.totalAmount / ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      }
    });

    // Calculate day-of-week patterns
    const dayOfWeekOccupancy: Record<number, number[]> = {};
    Object.entries(dailyOccupancy).forEach(([date, count]) => {
      const dayOfWeek = new Date(date).getDay();
      if (!dayOfWeekOccupancy[dayOfWeek]) dayOfWeekOccupancy[dayOfWeek] = [];
      dayOfWeekOccupancy[dayOfWeek].push(count / totalRooms);
    });

    const dayOfWeekAverage: Record<number, number> = {};
    Object.entries(dayOfWeekOccupancy).forEach(([day, rates]) => {
      dayOfWeekAverage[parseInt(day)] = rates.reduce((a, b) => a + b, 0) / rates.length;
    });

    // Generate forecast
    const forecast: any[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();
      
      const baseOccupancy = dayOfWeekAverage[dayOfWeek] || 0.5;
      
      // Add seasonal adjustment (simple model)
      const month = forecastDate.getMonth();
      const seasonalFactor = month >= 5 && month <= 8 ? 1.2 : month >= 11 || month <= 1 ? 1.15 : 1.0;
      
      const predictedOccupancy = Math.min(baseOccupancy * seasonalFactor, 1.0);
      const predictedRooms = Math.round(predictedOccupancy * totalRooms);
      
      // Calculate predicted revenue
      const avgDailyRate = Object.values(dailyRevenue).reduce((a, b) => a + b, 0) / Object.values(dailyRevenue).length || 50000;
      const predictedRevenue = predictedRooms * avgDailyRate;

      forecast.push({
        date: forecastDate.toISOString().split("T")[0],
        dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
        predictedOccupancy: Math.round(predictedOccupancy * 100),
        predictedRooms,
        availableRooms: totalRooms - predictedRooms,
        predictedRevenue: Math.round(predictedRevenue),
        confidence: baseOccupancy > 0 ? "high" : "medium",
      });
    }

    // Calculate trends
    const recentOccupancy = Object.values(dailyOccupancy).slice(-7).reduce((a, b) => a + b, 0) / 7 / totalRooms;
    const previousOccupancy = Object.values(dailyOccupancy).slice(-14, -7).reduce((a, b) => a + b, 0) / 7 / totalRooms;
    const trend = recentOccupancy > previousOccupancy ? "increasing" : recentOccupancy < previousOccupancy ? "decreasing" : "stable";

    return NextResponse.json({
      success: true,
      forecast,
      insights: {
        totalRooms,
        currentTrend: trend,
        avgOccupancyLast7Days: Math.round(recentOccupancy * 100),
        avgOccupancyLast30Days: Math.round((Object.values(dailyOccupancy).slice(-30).reduce((a, b) => a + b, 0) / 30 / totalRooms) * 100),
        peakDay: Object.entries(dayOfWeekAverage).sort((a, b) => b[1] - a[1])[0]?.[0] || 0,
        lowDay: Object.entries(dayOfWeekAverage).sort((a, b) => a[1] - b[1])[0]?.[0] || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Predictive analytics error:", error);
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 });
  }
}
