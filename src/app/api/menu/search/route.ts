import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const category = searchParams.get("category");
    const branchId = searchParams.get("branchId");
    const vegetarian = searchParams.get("vegetarian") === "true";
    const vegan = searchParams.get("vegan") === "true";
    const spicy = searchParams.get("spicy") === "true";
    const glutenFree = searchParams.get("glutenFree") === "true";
    const halal = searchParams.get("halal") === "true";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const where: any = { available: true };
    if (branchId) where.branchId = branchId;
    if (category) where.category = category;
    if (vegetarian) where.vegetarian = true;
    if (vegan) where.vegan = true;
    if (spicy) where.spicy = true;
    if (glutenFree) where.glutenFree = true;
    if (halal) where.halal = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];
    }

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ popular: "desc" }, { name: "asc" }],
      include: {
        branch: { select: { name: true, location: true } },
      },
    });

    return NextResponse.json({ success: true, items, count: items.length });
  } catch (error) {
    console.error("Menu search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search menu" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
