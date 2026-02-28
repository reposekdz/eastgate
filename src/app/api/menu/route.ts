import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const lang = searchParams.get("lang") || "en";

    const where: any = { available: true, isApproved: true };
    if (branchId) where.branchId = branchId;
    if (category && category !== "all") where.category = category;

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ featured: "desc" }, { popular: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        nameFr: true,
        nameSw: true,
        category: true,
        subcategory: true,
        price: true,
        description: true,
        descriptionFr: true,
        descriptionSw: true,
        imageUrl: true,
        popular: true,
        featured: true,
        vegetarian: true,
        vegan: true,
        spicy: true,
        spicyLevel: true,
        glutenFree: true,
        halal: true,
        organic: true,
        prepTime: true,
        servingSize: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        allergens: true,
        rating: true,
        totalOrders: true,
      },
    });

    const localizedItems = items.map(item => ({
      ...item,
      displayName: lang === "fr" ? (item.nameFr || item.name) : lang === "sw" ? (item.nameSw || item.name) : item.name,
      displayDescription: lang === "fr" ? (item.descriptionFr || item.description) : lang === "sw" ? (item.descriptionSw || item.description) : item.description,
    }));

    return NextResponse.json({ success: true, items: localizedItems });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch menu" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
