import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all events for public view
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Build filter
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (type) {
      where.type = type;
    }

    // Default to upcoming and ongoing for public view
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["upcoming", "ongoing"] };
    }

    const events = await prisma.event.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { date: "asc" },
    });

    // Get event types
    const types = await prisma.event.groupBy({
      by: ["type"],
      where: branchId ? { branchId } : {},
    });

    return NextResponse.json({
      success: true,
      events,
      types: types.map((t) => t.type),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch events",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 200 }); // Return 200 to prevent HTML error
  }
}
