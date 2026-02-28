import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch available rooms (public endpoint)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const branchId = searchParams.get("branchId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const capacity = searchParams.get("capacity");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: any = { status: "available" };
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (capacity) where.maxOccupancy = { gte: parseInt(capacity) };
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const total = await prisma.room.count({ where });
    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      select: {
        id: true,
        number: true,
        type: true,
        floor: true,
        price: true,
        maxOccupancy: true,
        imageUrl: true,
        description: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
            city: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Public rooms fetch error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch rooms",
    }, { status: 500 });
  }
}
