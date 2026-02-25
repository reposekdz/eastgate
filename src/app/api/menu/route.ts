import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";

/**
 * GET /api/menu
 * Fetch menu items with advanced filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const branchId = searchParams.get("branchId");
    const available = searchParams.get("available");
    const popular = searchParams.get("popular");
    const featured = searchParams.get("featured");
    const vegetarian = searchParams.get("vegetarian");
    const vegan = searchParams.get("vegan");
    const glutenFree = searchParams.get("glutenFree");
    const spicy = searchParams.get("spicy");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (category) where.category = category;
    if (available !== null) where.available = available === "true";
    if (popular === "true") where.popular = true;
    if (featured === "true") where.featured = true;
    if (vegetarian === "true") where.vegetarian = true;
    if (vegan === "true") where.vegan = true;
    if (glutenFree === "true") where.glutenFree = true;
    if (spicy === "true") where.spicy = true;

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [menuItems, total, categories, stats] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      }),
      prisma.menuItem.count({ where }),
      prisma.menuItem.groupBy({
        by: ["category"],
        where: branchId ? { branchId } : {},
        _count: true,
      }),
      prisma.menuItem.aggregate({
        where: branchId ? { branchId } : {},
        _count: true,
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return successResponse({
      menuItems,
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count,
      })),
      stats: {
        total: stats._count,
        avgPrice: stats._avg.price || 0,
        minPrice: stats._min.price || 0,
        maxPrice: stats._max.price || 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Menu fetch error:", error);
    return errorResponse("Failed to fetch menu items", [], 500);
  }
}

/**
 * POST /api/menu
 * Create new menu item
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      category,
      price,
      description,
      imageUrl,
      branchId,
      available,
      popular,
      featured,
      vegetarian,
      vegan,
      spicy,
      spicyLevel,
      glutenFree,
      prepTime,
      calories,
      allergens,
      ingredients,
    } = body;

    // Validation
    const required = { name, category, price, branchId };
    const missing = Object.entries(required)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      return errorResponse(
        "Validation failed",
        missing.map(field => ({
          field,
          message: `${field} is required`,
          code: "REQUIRED"
        })),
        400
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    // Check for duplicate
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        slug,
        branchId,
      },
    });

    if (existingItem) {
      return errorResponse(
        "Menu item exists",
        [{
          field: "name",
          message: "A menu item with this name already exists in this branch",
          code: "DUPLICATE"
        }],
        400
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        slug,
        category,
        price: parseFloat(price),
        description: description || null,
        imageUrl: imageUrl || null,
        branchId,
        available: available !== false,
        popular: popular || false,
        featured: featured || false,
        vegetarian: vegetarian || false,
        vegan: vegan || false,
        spicy: spicy || false,
        spicyLevel: spicyLevel || 0,
        glutenFree: glutenFree || false,
        prepTime: prepTime || 15,
        calories: calories || null,
        allergens: allergens || null,
        ingredients: ingredients || null,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return successResponse({ menuItem }, 201);
  } catch (error: any) {
    console.error("Menu item creation error:", error);
    return errorResponse("Failed to create menu item", [], 500);
  }
}

/**
 * PUT /api/menu
 * Update menu item
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Menu item ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return errorResponse("Menu item not found", [{
        field: "id",
        message: "Menu item does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    // Sanitize update data
    const allowedFields = [
      "name",
      "category",
      "price",
      "description",
      "imageUrl",
      "available",
      "popular",
      "featured",
      "vegetarian",
      "vegan",
      "spicy",
      "spicyLevel",
      "glutenFree",
      "prepTime",
      "calories",
      "allergens",
      "ingredients",
    ];

    const updateData: any = {};
    Object.keys(updateFields).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = updateFields[key];
      }
    });

    // Update slug if name changed
    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return successResponse({ menuItem });
  } catch (error: any) {
    console.error("Menu item update error:", error);
    return errorResponse("Failed to update menu item", [], 500);
  }
}

/**
 * DELETE /api/menu
 * Delete menu item
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Menu item ID is required",
          code: "REQUIRED"
        }],
        400
      );
    }

    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return errorResponse("Menu item not found", [{
        field: "id",
        message: "Menu item does not exist",
        code: "NOT_FOUND"
      }], 404);
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return successResponse({ message: "Menu item deleted successfully" });
  } catch (error: any) {
    console.error("Menu item deletion error:", error);
    return errorResponse("Failed to delete menu item", [], 500);
  }
}
