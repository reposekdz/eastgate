import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { items, branchId, createdBy } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Items array required" }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const item of items) {
      try {
        const slug = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
        
        await prisma.menuItem.create({
          data: {
            ...item,
            slug,
            branchId: item.branchId || branchId,
            createdBy: item.createdBy || createdBy,
            price: parseFloat(item.price),
            costPrice: item.costPrice ? parseFloat(item.costPrice) : null,
            isApproved: true,
          },
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ item: item.name, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.success} items, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ success: false, error: "Bulk import failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const format = searchParams.get("format") || "json";

    if (!branchId) {
      return NextResponse.json({ success: false, error: "Branch ID required" }, { status: 400 });
    }

    const items = await prisma.menuItem.findMany({
      where: { branchId },
      select: {
        name: true, nameFr: true, nameSw: true,
        category: true, subcategory: true,
        price: true, costPrice: true,
        description: true, descriptionFr: true, descriptionSw: true,
        imageUrl: true,
        available: true, popular: true, featured: true,
        vegetarian: true, vegan: true, spicy: true, spicyLevel: true,
        glutenFree: true, halal: true, organic: true,
        calories: true, protein: true, carbs: true, fat: true,
        allergens: true, ingredients: true,
        prepTime: true, servingSize: true, tags: true,
      },
    });

    if (format === "csv") {
      const headers = Object.keys(items[0] || {}).join(",");
      const rows = items.map(item => Object.values(item).map(v => 
        typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v
      ).join(","));
      const csv = [headers, ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="menu-export-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, items, count: items.length });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
