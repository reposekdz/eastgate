import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM rooms) as roomCount,
        (SELECT COUNT(*) FROM bookings) as bookingCount,
        (SELECT COUNT(*) FROM menu_items) as menuCount,
        (SELECT COUNT(*) FROM orders) as orderCount,
        (SELECT COUNT(*) FROM staff) as staffCount,
        (SELECT COUNT(*) FROM guests) as guestCount
    ` as any[];

    return NextResponse.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        info: dbInfo[0] || {},
      },
      environment: process.env.NODE_ENV,
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    
    return NextResponse.json({
      success: false,
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: process.env.NODE_ENV === "development" ? error.message : "Database error",
      },
      environment: process.env.NODE_ENV,
    }, { status: 503 });
  }
}
