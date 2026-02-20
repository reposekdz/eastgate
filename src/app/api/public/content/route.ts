import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch page content by slug (for About, Services, etc.)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const branchId = searchParams.get("branchId") || "br-001";

  try {
    if (!slug) {
      // Return all published page contents
      const pages = await prisma.$queryRaw`
        SELECT id, slug, title, subtitle, content, image_url, published, created_at, updated_at
        FROM page_contents 
        WHERE published = 1
        ORDER BY title ASC
      ` as any[];

      return NextResponse.json({
        success: true,
        pages,
        timestamp: new Date().toISOString(),
      });
    }

    // Get specific page content
    const page = await prisma.$queryRaw`
      SELECT * FROM page_contents 
      WHERE slug = ${slug} AND published = 1
      LIMIT 1
    ` as any[];

    if (!page || page.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Page not found",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      page: page[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get content error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch page content",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Create/update page content (for admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      slug,
      title,
      subtitle,
      content,
      imageUrl,
      gallery,
      metaTitle,
      metaDescription,
      published = true,
      branchId = "br-001"
    } = body;

    if (!slug || !title || !content) {
      return NextResponse.json({
        success: false,
        error: "Slug, title, and content are required",
      }, { status: 400 });
    }

    // Check if page exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM page_contents 
      WHERE slug = ${slug}
      LIMIT 1
    ` as any[];

    if (existing && existing.length > 0) {
      // Update existing page
      await prisma.$executeRaw`
        UPDATE page_contents 
        SET title = ${title},
            subtitle = ${subtitle || null},
            content = ${content},
            image_url = ${imageUrl || null},
            gallery = ${gallery ? JSON.stringify(gallery) : null},
            meta_title = ${metaTitle || null},
            meta_description = ${metaDescription || null},
            published = ${published ? 1 : 0},
            updated_at = NOW()
        WHERE slug = ${slug}
      `;

      return NextResponse.json({
        success: true,
        message: "Page content updated successfully",
        timestamp: new Date().toISOString(),
      });
    } else {
      // Insert new page
      const pageId = `PAGE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await prisma.$executeRaw`
        INSERT INTO page_contents (id, slug, title, subtitle, content, image_url, gallery, meta_title, meta_description, published, branch_id, created_at, updated_at)
        VALUES (
          ${pageId},
          ${slug},
          ${title},
          ${subtitle || null},
          ${content},
          ${imageUrl || null},
          ${gallery ? JSON.stringify(gallery) : null},
          ${metaTitle || null},
          ${metaDescription || null},
          ${published ? 1 : 0},
          ${branchId},
          NOW(),
          NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        message: "Page content created successfully",
        pageId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("Save content error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to save page content",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// DELETE - Delete page content (for admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: "Slug is required",
      }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM page_contents WHERE slug = ${slug}
    `;

    return NextResponse.json({
      success: true,
      message: "Page content deleted",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Delete content error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete page content",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
