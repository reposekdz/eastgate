import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all menu items with advanced filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const available = searchParams.get("available");
    const dietary = searchParams.get("dietary");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!branchId) {
      return NextResponse.json({ success: false, error: "Branch ID required" }, { status: 400 });
    }

    const where: any = { branchId };
    if (category && category !== "all") where.category = category;
    if (available === "true") where.available = true;
    if (dietary === "vegetarian") where.vegetarian = true;
    if (dietary === "vegan") where.vegan = true;
    if (dietary === "glutenFree") where.glutenFree = true;
    if (dietary === "halal") where.halal = true;
    if (dietary === "spicy") where.spicy = true;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameFr: { contains: search, mode: "insensitive" } },
        { nameSw: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === "price") orderBy.price = sortOrder;
    else if (sortBy === "popular") orderBy.totalOrders = "desc";
    else if (sortBy === "rating") orderBy.rating = "desc";
    else orderBy[sortBy] = sortOrder;

    const [items, total, stats] = await Promise.all([
      prisma.menuItem.findMany({ where, orderBy, take: limit, skip: offset }),
      prisma.menuItem.count({ where }),
      prisma.menuItem.aggregate({
        where: { branchId },
        _avg: { price: true, rating: true },
        _sum: { totalOrders: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({ 
      success: true, 
      items, 
      total,
      stats: {
        avgPrice: stats._avg.price,
        avgRating: stats._avg.rating,
        totalOrders: stats._sum.totalOrders,
        totalItems: stats._count,
      },
      pagination: { limit, offset, hasMore: total > offset + limit },
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch menu items" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST create new menu item with translations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, nameFr, nameSw,
      category, subcategory,
      price, costPrice,
      description, descriptionFr, descriptionSw,
      imageUrl, images,
      available, popular, featured,
      vegetarian, vegan, spicy, spicyLevel,
      glutenFree, halal, organic,
      calories, protein, carbs, fat,
      allergens, ingredients,
      prepTime, servingSize, tags,
      branchId, createdBy,
    } = body;

    if (!name || !category || !price || !branchId) {
      return NextResponse.json(
        { success: false, error: "Name, category, price, and branch are required" },
        { status: 400 }
      );
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const item = await prisma.menuItem.create({
      data: {
        name, nameFr, nameSw, slug,
        category, subcategory,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        description, descriptionFr, descriptionSw,
        imageUrl,
        images: images || [],
        available: available ?? true,
        popular: popular ?? false,
        featured: featured ?? false,
        vegetarian: vegetarian ?? false,
        vegan: vegan ?? false,
        spicy: spicy ?? false,
        spicyLevel: spicyLevel ?? 0,
        glutenFree: glutenFree ?? false,
        halal: halal ?? false,
        organic: organic ?? false,
        calories,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        allergens: allergens || [],
        ingredients: ingredients || [],
        prepTime: prepTime ?? 15,
        servingSize,
        tags: tags || [],
        branchId,
        createdBy,
        isApproved: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: createdBy,
        branchId,
        action: "create",
        entity: "menu_item",
        entityId: item.id,
        details: { itemName: name, category },
      },
    });

    return NextResponse.json({ success: true, message: "Menu item created successfully", item });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ success: false, error: "Failed to create menu item" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT update menu item with activity logging
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, lastModifiedBy, branchId, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });
    }

    const oldItem = await prisma.menuItem.findUnique({ where: { id } });

    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.costPrice) updateData.costPrice = parseFloat(updateData.costPrice);
    if (updateData.protein) updateData.protein = parseFloat(updateData.protein);
    if (updateData.carbs) updateData.carbs = parseFloat(updateData.carbs);
    if (updateData.fat) updateData.fat = parseFloat(updateData.fat);

    const item = await prisma.menuItem.update({
      where: { id },
      data: { ...updateData, lastModifiedBy },
    });

    await prisma.activityLog.create({
      data: {
        userId: lastModifiedBy,
        branchId: branchId || oldItem?.branchId || "",
        action: "update",
        entity: "menu_item",
        entityId: id,
        details: { changes: updateData, oldPrice: oldItem?.price, newPrice: item.price },
      },
    });

    return NextResponse.json({ success: true, message: "Menu item updated successfully", item });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ success: false, error: "Failed to update menu item" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE menu item with logging
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const branchId = searchParams.get("branchId");

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });
    }

    const item = await prisma.menuItem.findUnique({ where: { id } });
    await prisma.menuItem.delete({ where: { id } });

    if (userId && branchId) {
      await prisma.activityLog.create({
        data: {
          userId,
          branchId,
          action: "delete",
          entity: "menu_item",
          entityId: id,
          details: { itemName: item?.name, category: item?.category },
        },
      });
    }

    return NextResponse.json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ success: false, error: "Failed to delete menu item" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
