import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Public room listings (no auth required)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status") || "available";

    // Build filter
    const where: any = {
      status,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [
        { floor: "asc" },
        { number: "asc" },
      ],
      select: {
        id: true,
        number: true,
        floor: true,
        type: true,
        status: true,
        price: true,
        description: true,
        imageUrl: true,
        branchId: true,
      },
    });

    // Get room types
    const roomTypes = await prisma.room.groupBy({
      by: ["type"],
      where: branchId ? { branchId } : {},
    });

    // Get statistics
    const totalRooms = await prisma.room.count({
      where: branchId ? { branchId } : {},
    });
    const availableRooms = await prisma.room.count({
      where: { ...where, status: "available" },
    });

    return NextResponse.json({
      success: true,
      rooms,
      roomTypes: roomTypes.map(r => r.type),
      stats: {
        total: totalRooms,
        available: availableRooms,
        occupancyRate: totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Public rooms fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
