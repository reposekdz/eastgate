import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all branches for public view
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  try {
    // Build filter
    const where: any = {};

    if (branchId) {
      where.id = branchId;
    }

    const branches = await prisma.branch.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // For each branch, get additional stats
    const branchesWithStats = await Promise.all(
      branches.map(async (branch) => {
        const roomCount = await prisma.room.count({
          where: { branchId: branch.id },
        });
        const staffCount = await prisma.staff.count({
          where: { branchId: branch.id },
        });
        return {
          ...branch,
          roomCount,
          staffCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      branches: branchesWithStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get branches error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch branches",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 200 }); // Return 200 to prevent HTML error
  }
}
