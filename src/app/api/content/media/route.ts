import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// Media categories
const MEDIA_CATEGORIES = [
  "hero", "rooms", "restaurant", "spa", "events", 
  "gallery", "staff", "facilities", "testimonials", "general"
];

// Default fallback images
const DEFAULT_MEDIA: Record<string, string> = {
  hero: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920",
  rooms: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1920",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920",
  events: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920",
  gallery: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920",
  staff: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
  facilities: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920",
  testimonials: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  general: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920",
};

// GET - Fetch all media or specific category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const branchId = searchParams.get("branchId");

    // Return default media if no database records
    if (!category) {
      // Return all default media
      const allMedia: Record<string, any> = {};
      for (const cat of MEDIA_CATEGORIES) {
        allMedia[cat] = {
          category: cat,
          images: [DEFAULT_MEDIA[cat] || DEFAULT_MEDIA.general],
          isDefault: true,
        };
      }
      return NextResponse.json({ success: true, media: allMedia });
    }

    // Return specific category with fallback
    const media = {
      category,
      images: [DEFAULT_MEDIA[category] || DEFAULT_MEDIA.general],
      isDefault: true,
    };

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error("Media fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST - Upload/add media (Super Admin/Manager)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category, images, branchId } = body;

    if (!category || !images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "category and images array are required" },
        { status: 400 }
      );
    }

    if (!MEDIA_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${MEDIA_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // For now, we store images as JSON in the page_content table
    // This can be extended to use a proper media storage solution
    const contentSlug = `media_${category}`;

    const existing = await prisma.pageContent.findFirst({
      where: { slug: contentSlug },
    });

    let result;

    if (existing) {
      result = await prisma.pageContent.update({
        where: { id: existing.id },
        data: {
          gallery: images,
          updatedAt: new Date(),
        },
      });
    } else {
      result = await prisma.pageContent.create({
        data: {
          slug: contentSlug,
          title: `${category} Images`,
          content: `Gallery images for ${category} section`,
          gallery: images,
          published: true,
          branchId: branchId || session.user.branchId || "",
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "media_uploaded",
        entity: "media",
        entityId: result.id,
        details: { category, imageCount: images.length },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${images.length} images added to ${category}`,
      media: {
        category,
        images,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}

// PUT - Update media
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { category, imageUrl, action, index } = body;

    if (!category || !action) {
      return NextResponse.json(
        { error: "category and action are required" },
        { status: 400 }
      );
    }

    const contentSlug = `media_${category}`;

    const existing = await prisma.pageContent.findFirst({
      where: { slug: contentSlug },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      );
    }

    const currentImages = (existing.gallery as string[]) || [];

    let updatedImages: string[] = [];

    switch (action) {
      case "add":
        if (imageUrl) {
          updatedImages = [...currentImages, imageUrl];
        }
        break;
      case "remove":
        if (index !== undefined && index >= 0) {
          updatedImages = currentImages.filter((_, i) => i !== index);
        }
        break;
      case "reorder":
        // For reordering, we'd need to pass the new order
        updatedImages = currentImages;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    await prisma.pageContent.update({
      where: { id: existing.id },
      data: {
        gallery: updatedImages,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      media: {
        category,
        images: updatedImages,
      },
    });
  } catch (error) {
    console.error("Media update error:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE - Remove media
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "category is required" },
        { status: 400 }
      );
    }

    const contentSlug = `media_${category}`;

    await prisma.pageContent.deleteMany({
      where: { slug: contentSlug },
    });

    return NextResponse.json({
      success: true,
      message: `Media for ${category} deleted`,
    });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
