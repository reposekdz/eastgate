import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all services for public view
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
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

    const services = await prisma.service.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: "asc" },
    });

    // Get service types/categories
    const types = await prisma.service.groupBy({
      by: ["type"],
      where: branchId ? { branchId } : {},
    });

    return NextResponse.json({
      success: true,
      services,
      types: types.map((t) => t.type),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get services error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch services",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 200 }); // Return 200 to prevent HTML error
  }
}
