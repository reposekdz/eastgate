import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { branchId, checkInDate, checkOutDate, roomType } = await req.json();

    const targetBranchId = branchId || decoded.branchId;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Get base room price
    const room = await prisma.room.findFirst({
      where: {
        branchId: targetBranchId,
        type: roomType,
        status: "available",
      },
      select: { price: true, weekendPrice: true },
    });

    if (!room) {
      return NextResponse.json({ error: "No rooms available" }, { status: 404 });
    }

    const basePrice = room.price;

    // Calculate occupancy rate for the period
    const totalRooms = await prisma.room.count({
      where: { branchId: targetBranchId, type: roomType },
    });

    const bookedRooms = await prisma.booking.count({
      where: {
        branchId: targetBranchId,
        roomType,
        status: { in: ["confirmed", "checked_in"] },
        OR: [
          { checkIn: { lte: checkOut }, checkOut: { gte: checkIn } },
        ],
      },
    });

    const occupancyRate = bookedRooms / totalRooms;

    // Dynamic pricing factors
    let priceMultiplier = 1.0;

    // 1. Occupancy-based pricing
    if (occupancyRate > 0.9) priceMultiplier += 0.3; // 30% increase for high demand
    else if (occupancyRate > 0.75) priceMultiplier += 0.2; // 20% increase
    else if (occupancyRate > 0.6) priceMultiplier += 0.1; // 10% increase
    else if (occupancyRate < 0.3) priceMultiplier -= 0.15; // 15% discount for low occupancy

    // 2. Day of week pricing
    const dayOfWeek = checkIn.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      // Friday/Saturday
      priceMultiplier += 0.15;
    }

    // 3. Advance booking discount
    const daysUntilCheckIn = Math.floor((checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckIn > 30) priceMultiplier -= 0.1; // 10% early bird discount
    else if (daysUntilCheckIn < 3) priceMultiplier += 0.2; // 20% last-minute premium

    // 4. Length of stay discount
    const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights >= 7) priceMultiplier -= 0.15; // 15% weekly discount
    else if (nights >= 3) priceMultiplier -= 0.05; // 5% multi-night discount

    // 5. Seasonal pricing
    const month = checkIn.getMonth();
    if (month >= 5 && month <= 8) priceMultiplier += 0.2; // Peak season (June-Sept)
    else if (month === 11 || month === 0) priceMultiplier += 0.15; // Holiday season

    // Calculate final price
    const dynamicPrice = Math.round(basePrice * priceMultiplier);
    const totalPrice = dynamicPrice * nights;

    // Get historical pricing data
    const historicalBookings = await prisma.booking.findMany({
      where: {
        branchId: targetBranchId,
        roomType,
        status: "checked_out",
        checkIn: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: { totalAmount: true, nights: true },
      take: 100,
    });

    const avgHistoricalPrice = historicalBookings.length > 0
      ? historicalBookings.reduce((sum, b) => sum + b.totalAmount / b.nights, 0) / historicalBookings.length
      : basePrice;

    return NextResponse.json({
      success: true,
      pricing: {
        basePrice,
        dynamicPrice,
        totalPrice,
        nights,
        pricePerNight: dynamicPrice,
        discount: basePrice > dynamicPrice ? Math.round(((basePrice - dynamicPrice) / basePrice) * 100) : 0,
        premium: dynamicPrice > basePrice ? Math.round(((dynamicPrice - basePrice) / basePrice) * 100) : 0,
      },
      factors: {
        occupancyRate: Math.round(occupancyRate * 100),
        isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
        daysUntilCheckIn,
        lengthOfStay: nights,
        season: month >= 5 && month <= 8 ? "peak" : month === 11 || month === 0 ? "holiday" : "regular",
      },
      insights: {
        avgMarketPrice: Math.round(avgHistoricalPrice),
        competitiveness: dynamicPrice < avgHistoricalPrice ? "competitive" : dynamicPrice > avgHistoricalPrice ? "premium" : "market-rate",
        recommendation: occupancyRate > 0.8 ? "High demand - consider premium pricing" : occupancyRate < 0.4 ? "Low demand - offer discounts" : "Balanced pricing",
      },
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dynamic pricing error:", error);
    return NextResponse.json({ error: "Failed to calculate dynamic pricing" }, { status: 500 });
  }
}
