import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/menu - Get menu items for branch manager
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const available = searchParams.get("available");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Build where clause based on role
    let whereClause: any = {};

    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      // Can see all branches
      if (category) whereClause.category = category;
      if (available !== null) whereClause.available = available === "true";
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { nameKinyarwanda: { contains: search } },
          { description: { contains: search } },
        ];
      }
    } else if (userBranchId) {
      // Can only see their branch
      whereClause.OR = [
        { branchId: userBranchId },
        { branchId: null },
      ];
      if (category) whereClause.category = category;
      if (available !== null) whereClause.available = available === "true";
      if (search) {
        whereClause.AND = {
          OR: [
            { name: { contains: search } },
            { nameKinyarwanda: { contains: search } },
            { description: { contains: search } },
          ],
        };
      }
    } else {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Get menu items with branch info
    const [menuItems, totalCount] = await Promise.all([
      prisma.menuItem.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.menuItem.count({ where: whereClause }),
    ]);

    // Get stats by category
    const stats = await prisma.menuItem.groupBy({
      by: ['category'],
      where: whereClause,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      menuItems,
      totalCount,
      stats: stats.reduce((acc, s) => {
        acc[s.category] = s._count;
        return acc;
      }, {} as Record<string, number>),
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    return NextResponse.json(
      { error: "Failed to get menu items" },
      { status: 500 }
    );
  }
}

// POST /api/manager/menu - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can create menu items
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      nameKinyarwanda,
      description,
      price,
      category,
      dietary,
      calories,
      preparationTime,
      images,
      available,
      allergens,
      ingredients,
      allergensList,
    } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      );
    }

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || userBranchId;
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        nameKinyarwanda: nameKinyarwanda || "",
        description: description || "",
        price: parseFloat(price),
        category: category.toUpperCase(),
        dietary: dietary || [],
        calories: calories || 0,
        preparationTime: preparationTime || 15,
        images: images || [],
        available: available !== false,
        allergens: allergens || "",
        ingredients: ingredients || "",
        branchId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      menuItem,
    });
  } catch (error) {
    console.error("Create menu item error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/manager/menu - Update menu item
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can update menu items
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      menuItemId,
      name,
      nameKinyarwanda,
      description,
      price,
      category,
      dietary,
      calories,
      preparationTime,
      images,
      available,
      allergens,
      ingredients,
    } = body;

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID required" }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (nameKinyarwanda !== undefined) updateData.nameKinyarwanda = nameKinyarwanda;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category.toUpperCase();
    if (dietary) updateData.dietary = dietary;
    if (calories) updateData.calories = calories;
    if (preparationTime) updateData.preparationTime = preparationTime;
    if (images) updateData.images = images;
    if (available !== undefined) updateData.available = available;
    if (allergens !== undefined) updateData.allergens = allergens;
    if (ingredients !== undefined) updateData.ingredients = ingredients;

    // Check menu item exists and user has access
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Verify branch access (global items can be edited by any manager)
    if (userRole !== "SUPER_ADMIN" && userRole !== "SUPER_MANAGER") {
      if (existingItem.branchId && existingItem.branchId !== userBranchId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Update menu item
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      menuItem,
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE /api/manager/menu - Delete menu item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only admins can delete menu items
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get("menuItemId");

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID required" }, { status: 400 });
    }

    // Check menu item exists
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Delete menu item (soft delete by making unavailable)
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { available: false },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item removed from availability",
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
