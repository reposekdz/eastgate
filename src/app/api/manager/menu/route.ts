import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/manager/menu
 * Fetch menu items for manager's branch
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || !session.branchId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isApproved = searchParams.get("isApproved");
    const available = searchParams.get("available");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const where: any = { branchId: session.branchId };
    if (category) where.category = category;
    if (isApproved !== null) where.isApproved = isApproved === "true";
    if (available !== null) where.available = available === "true";

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.menuItem.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          items: items.map((item) => ({
            ...item,
            images: item.images
              ? Array.isArray(item.images)
                ? item.images
                : [item.images]
              : [],
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Menu fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/menu
 * Create new menu item with image upload from local device
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || !session.branchId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check manager permissions
    if (session.role === "manager") {
      const assignment = await prisma.managerAssignment.findUnique({
        where: {
          managerId_branchId: {
            managerId: session.id,
            branchId: session.branchId,
          },
        },
      });

      if (!assignment || !assignment.canManageMenu) {
        return NextResponse.json(
          { success: false, error: "Permission denied: Cannot manage menu" },
          { status: 403 }
        );
      }
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const nameFr = formData.get("nameFr") as string;
    const nameSw = formData.get("nameSw") as string;
    const category = formData.get("category") as string;
    const subcategory = formData.get("subcategory") as string;
    const price = parseFloat(formData.get("price") as string);
    const costPrice = formData.get("costPrice")
      ? parseFloat(formData.get("costPrice") as string)
      : null;
    const description = formData.get("description") as string;
    const descriptionFr = formData.get("descriptionFr") as string;
    const descriptionSw = formData.get("descriptionSw") as string;
    const prepTime = formData.get("prepTime")
      ? parseInt(formData.get("prepTime") as string)
      : 15;
    const calories = formData.get("calories")
      ? parseInt(formData.get("calories") as string)
      : null;
    const vegetarian = formData.get("vegetarian") === "true";
    const vegan = formData.get("vegan") === "true";
    const glutenFree = formData.get("glutenFree") === "true";
    const halal = formData.get("halal") === "true";
    const spicy = formData.get("spicy") === "true";
    const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [];

    // Validate required fields
    if (!name || !category || !price) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, category, and price are required",
        },
        { status: 400 }
      );
    }

    // Process image uploads
    const images: any[] = [];
    const imageFiles = formData.getAll("images") as File[];

    if (imageFiles && imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        if (imageFile instanceof File && imageFile.size > 0) {
          try {
            const imageBuffer = await imageFile.arrayBuffer();
            const imageId = uuidv4();
            const fileName = `${imageId}-${imageFile.name}`;
            const uploadDir = join(process.cwd(), "public", "menu-items");

            // Create directory if it doesn't exist
            try {
              mkdirSync(uploadDir, { recursive: true });
            } catch (e) {
              // Directory might already exist
            }

            // Save file
            const filePath = join(uploadDir, fileName);
            writeFileSync(filePath, Buffer.from(imageBuffer));

            images.push({
              url: `/menu-items/${fileName}`,
              uploadedAt: new Date(),
              uploadedBy: session.id,
              fileName,
            });
          } catch (error) {
            console.error("Image upload error:", error);
            // Continue with other images even if one fails
          }
        }
      }
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-");

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        nameFr: nameFr || null,
        nameSw: nameSw || null,
        slug,
        category,
        subcategory: subcategory || null,
        price,
        costPrice,
        description: description || null,
        descriptionFr: descriptionFr || null,
        descriptionSw: descriptionSw || null,
        images: images.length > 0 ? images : null,
        prepTime,
        calories,
        vegetarian,
        vegan,
        glutenFree,
        halal,
        spicy,
        tags,
        available: true,
        isApproved: true, // Manager items auto-approved
        branchId: session.branchId,
        createdBy: session.id,
        lastModifiedBy: session.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId: session.branchId,
        action: "menu_item_created",
        entity: "menu_item",
        entityId: menuItem.id,
        details: { name, category, price, images: images.length },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          menuItem: {
            ...menuItem,
            images: images,
          },
        },
        message: `Menu item "${name}" created successfully with ${images.length} image(s)`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Menu item creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create menu item",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manager/menu/[id]
 * Update menu item
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || !session.branchId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item ID required",
        },
        { status: 400 }
      );
    }

    // Verify item exists and belongs to manager's branch
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      select: { branchId: true },
    });

    if (!menuItem || menuItem.branchId !== session.branchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item not found or access denied",
        },
        { status: 404 }
      );
    }

    // Update
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...updateData,
        lastModifiedBy: session.id,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId: session.branchId,
        action: "menu_item_updated",
        entity: "menu_item",
        entityId: id,
        details: updateData,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { menuItem: updated },
        message: "Menu item updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Menu item update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update menu item",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/menu/[id]
 * Delete menu item
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || !session.branchId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item ID required",
        },
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      select: { branchId: true, name: true },
    });

    if (!menuItem || menuItem.branchId !== session.branchId) {
      return NextResponse.json(
        {
          success: false,
          error: "Menu item not found or access denied",
        },
        { status: 404 }
      );
    }

    // Delete
    await prisma.menuItem.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId: session.branchId,
        action: "menu_item_deleted",
        entity: "menu_item",
        entityId: id,
        details: { name: menuItem.name },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Menu item "${menuItem.name}" deleted`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Menu item deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete menu item",
      },
      { status: 500 }
    );
  }
}
