import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch all branches
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (isActive !== null) where.isActive = isActive === "true";

    const branches = await prisma.branch.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            rooms: true,
            bookings: true,
            staff: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, branches });
  } catch (error) {
    console.error("Branches fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch branches" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
