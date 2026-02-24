import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch menu items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const available = searchParams.get("available");
    const userBranchId = req.headers.get("x-branch-id") as string;

    const where: any = {};

    // Filter by branch
    if (userBranchId) {
      where.branchId = userBranchId;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by availability
    if (available === "true") {
      where.available = true;
    } else if (available === "false") {
      where.available = false;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    // Get categories for filtering
    const categories = await prisma.menuItem.groupBy({
      by: ["category"],
      where: userBranchId ? { branchId: userBranchId } : {},
    });

    return NextResponse.json({
      success: true,
      menuItems,
      categories: categories.map(c => c.category),
    });
  } catch (error) {
    console.error("Menu fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

// POST - Create menu item (Manager only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      category,
      price,
      description,
      imageUrl,
      available,
      popular,
      vegetarian,
      spicy,
    } = body;

    // Validate required fields
    if (!name || !category || !price) {
      return NextResponse.json(
        { error: "name, category, and price are required" },
        { status: 400 }
      );
    }

    // Create menu item
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
        branchId: session.user.branchId || "",
      },
    });

    // Log creation
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "menu_item_created",
        entity: "menu_item",
        entityId: menuItem.id,
        details: { name, category, price },
      },
    });

    return NextResponse.json({
      success: true,
      menuItem,
    });
  } catch (error) {
    console.error("Menu item creation error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PUT - Update menu item
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      id,
      name,
      category,
      price,
      description,
      imageUrl,
      available,
      popular,
      vegetarian,
      spicy,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Menu item ID is required" },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Build update data
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

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    // Log update
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "menu_item_updated",
        entity: "menu_item",
        entityId: id,
        details: { name, category },
      },
    });

    return NextResponse.json({
      success: true,
      menuItem: updatedItem,
    });
  } catch (error) {
    console.error("Menu item update error:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Menu item ID is required" },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Delete menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "menu_item_deleted",
        entity: "menu_item",
        entityId: id,
        details: { name: existingItem.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Menu item deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
