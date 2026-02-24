import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Public menu listings (no auth required)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const available = searchParams.get("available");

    // Build filter
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (available !== null) {
      where.available = available === "true";
    }

    if (category) {
      where.category = category;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        description: true,
        imageUrl: true,
        available: true,
        popular: true,
        vegetarian: true,
        spicy: true,
      },
    });

    // Get categories
    const categories = await prisma.menuItem.groupBy({
      by: ["category"],
      where: branchId ? { branchId } : {},
    });

    // Get popular items
    const popularItems = await prisma.menuItem.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        popular: true,
        available: true,
      },
      take: 6,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        description: true,
        imageUrl: true,
        available: true,
      },
    });

    return NextResponse.json({
      success: true,
      menuItems,
      categories: categories.map(c => c.category),
      popularItems,
    });
  } catch (error) {
    console.error("Public menu fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
