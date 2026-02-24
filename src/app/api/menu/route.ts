import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch menu items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const available = searchParams.get("available");
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (category && category !== "all") where.category = category;
    if (available === "true") where.available = true;
    else if (available === "false") where.available = false;

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, menuItems });
  } catch (error) {
    console.error("Menu fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create menu item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, price, description, imageUrl, available, popular, vegetarian, spicy, branchId, prepTime } = body;

    if (!name || !category || !price || !branchId) {
      return NextResponse.json(
        { success: false, error: "name, category, price, and branchId are required" },
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        category,
        price: parseFloat(price),
        description,
        imageUrl,
        available: available !== false,
        popular: popular || false,
        vegetarian: vegetarian || false,
        spicy: spicy || false,
        branchId,
        prepTime: prepTime ? parseInt(prepTime) : null,
      },
    });

    return NextResponse.json({ success: true, menuItem });
  } catch (error) {
    console.error("Menu item creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create menu item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update menu item
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, price, description, imageUrl, available, popular, vegetarian, spicy, prepTime } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Menu item ID is required" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.menuItem.findUnique({ where: { id } });

    if (!existingItem) {
      return NextResponse.json({ success: false, error: "Menu item not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (available !== undefined) updateData.available = available;
    if (popular !== undefined) updateData.popular = popular;
    if (vegetarian !== undefined) updateData.vegetarian = vegetarian;
    if (spicy !== undefined) updateData.spicy = spicy;
    if (prepTime !== undefined) updateData.prepTime = prepTime ? parseInt(prepTime) : null;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, menuItem: updatedItem });
  } catch (error) {
    console.error("Menu item update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update menu item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete menu item
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Menu item ID is required" },
        { status: 400 }
      );
    }

    const existingItem = await prisma.menuItem.findUnique({ where: { id } });

    if (!existingItem) {
      return NextResponse.json({ success: false, error: "Menu item not found" }, { status: 404 });
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Menu item deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete menu item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
