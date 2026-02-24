import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSuperAdminOrManager, isBranchManager } from "@/lib/auth";

// GET - Fetch media/images from database
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // room, menu, service, event
    const branchId = searchParams.get("branchId");

    let branchFilter = "";
    if (branchId) {
      branchFilter = `AND branch_id = '${branchId}'`;
    }

    // Get rooms with images
    let rooms: any[] = [];
    let menuItems: any[] = [];
    let services: any[] = [];
    let events: any[] = [];

    if (!type || type === "room") {
      rooms = await prisma.$queryRaw`
        SELECT id, name, image_url, room_type as type, price, branch_id
        FROM rooms
        WHERE image_url IS NOT NULL AND image_url != '' ${branchFilter ? prisma.raw(branchFilter) : prisma``}
        ORDER BY name ASC
      ` as any[];
    }

    if (!type || type === "menu") {
      menuItems = await prisma.$queryRaw`
        SELECT id, name, image_url, category, price, branch_id
        FROM menu_items
        WHERE image_url IS NOT NULL AND image_url != '' ${branchFilter ? prisma.raw(branchFilter) : prisma``}
        ORDER BY name ASC
      ` as any[];
    }

    if (!type || type === "service") {
      services = await prisma.$queryRaw`
        SELECT id, name, image_url, type, price, branch_id
        FROM services
        WHERE image_url IS NOT NULL AND image_url != '' ${branchFilter ? prisma.raw(branchFilter) : prisma``}
        ORDER BY name ASC
      ` as any[];
    }

    return NextResponse.json({
      success: true,
      rooms,
      menuItems,
      services,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST - Upload/update image URL for an item
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only managers can update images
    if (!isSuperAdminOrManager(userRole) && !isBranchManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { itemType, itemId, imageUrl } = body;

    if (!itemType || !itemId || !imageUrl) {
      return NextResponse.json(
        { error: "itemType, itemId, and imageUrl are required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
    }

    let result;

    switch (itemType) {
      case "room":
        result = await prisma.$executeRaw`
          UPDATE rooms SET image_url = ${imageUrl}, updated_at = NOW() WHERE id = ${itemId}
        `;
        break;
      case "menu":
        result = await prisma.$executeRaw`
          UPDATE menu_items SET image_url = ${imageUrl}, updated_at = NOW() WHERE id = ${itemId}
        `;
        break;
      case "service":
        result = await prisma.$executeRaw`
          UPDATE services SET image_url = ${imageUrl}, updated_at = NOW() WHERE id = ${itemId}
        `;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid item type. Must be: room, menu, or service" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Image updated successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}

// DELETE - Remove image from an item
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only managers can delete images
    if (!isSuperAdminOrManager(userRole) && !isBranchManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get("itemType");
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "itemType and itemId are required" },
        { status: 400 }
      );
    }

    let result;

    switch (itemType) {
      case "room":
        result = await prisma.$executeRaw`
          UPDATE rooms SET image_url = NULL, updated_at = NOW() WHERE id = ${itemId}
        `;
        break;
      case "menu":
        result = await prisma.$executeRaw`
          UPDATE menu_items SET image_url = NULL, updated_at = NOW() WHERE id = ${itemId}
        `;
        break;
      case "service":
        result = await prisma.$executeRaw`
          UPDATE services SET image_url = NULL, updated_at = NOW() WHERE id = ${itemId}
        `;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid item type. Must be: room, menu, or service" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Image removed successfully",
    });
  } catch (error) {
    console.error("Error removing image:", error);
    return NextResponse.json(
      { error: "Failed to remove image" },
      { status: 500 }
    );
  }
}
