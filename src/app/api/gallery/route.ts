import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category) where.category = category;

    const images = await prisma.galleryImage.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch gallery" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, description, category, branchId } = body;

    if (!url || !title) {
      return NextResponse.json({ success: false, error: "URL and title are required" }, { status: 400 });
    }

    const image = await prisma.galleryImage.create({
      data: {
        url,
        title,
        description: description || null,
        category: category || "general",
        branchId: branchId || null,
      },
    });

    return NextResponse.json({ success: true, message: "Image added to gallery", image });
  } catch (error) {
    console.error("Error adding to gallery:", error);
    return NextResponse.json({ success: false, error: "Failed to add image" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Image ID is required" }, { status: 400 });
    }

    await prisma.galleryImage.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Image deleted from gallery" });
  } catch (error) {
    console.error("Error deleting from gallery:", error);
    return NextResponse.json({ success: false, error: "Failed to delete image" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
