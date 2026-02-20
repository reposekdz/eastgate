import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch gallery images
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const branchId = searchParams.get("branchId") || "br-001";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Use page_contents gallery field for gallery images
    let query = "SELECT id, slug, title, subtitle, image_url, gallery, updated_at FROM page_contents WHERE gallery IS NOT NULL AND gallery != 'null'";
    const params: any[] = [];

    if (category) {
      query += " AND slug = ?";
      params.push(category);
    }

    query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const galleries = await prisma.$queryRawUnsafe(query, ...params) as any[];

    // Parse gallery JSON and flatten
    const images: any[] = [];
    for (const gallery of galleries) {
      if (gallery.gallery) {
        try {
          const galleryData = typeof gallery.gallery === 'string' 
            ? JSON.parse(gallery.gallery) 
            : gallery.gallery;
          
          if (Array.isArray(galleryData)) {
            for (const img of galleryData) {
              images.push({
                id: `${gallery.id}-${img.url}`,
                title: img.caption || gallery.title,
                category: gallery.slug,
                url: img.url,
                thumbnail: img.thumbnail || img.url,
                description: img.caption,
              });
            }
          }
        } catch (e) {
          console.error("Parse gallery error:", e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      images,
      categories: [...new Set(images.map((i: any) => i.category))],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get gallery error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch gallery",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Add image to gallery (for admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      slug,
      title,
      imageUrl,
      thumbnail,
      caption,
      branchId = "br-001"
    } = body;

    if (!slug || !title || !imageUrl) {
      return NextResponse.json({
        success: false,
        error: "Slug, title, and image URL are required",
      }, { status: 400 });
    }

    // Get existing gallery
    const existing = await prisma.$queryRaw`
      SELECT gallery FROM page_contents WHERE slug = ${slug} LIMIT 1
    ` as any[];

    let gallery: any[] = [];
    if (existing && existing.length > 0 && existing[0].gallery) {
      try {
        gallery = typeof existing[0].gallery === 'string' 
          ? JSON.parse(existing[0].gallery) 
          : existing[0].gallery;
      } catch (e) {
        gallery = [];
      }
    }

    // Add new image
    gallery.push({
      url: imageUrl,
      thumbnail: thumbnail || imageUrl,
      caption: caption || title,
    });

    // Update page content
    await prisma.$executeRaw`
      UPDATE page_contents 
      SET gallery = ${JSON.stringify(gallery)}, updated_at = NOW()
      WHERE slug = ${slug}
    `;

    return NextResponse.json({
      success: true,
      message: "Image added to gallery",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Add gallery image error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to add image to gallery",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
