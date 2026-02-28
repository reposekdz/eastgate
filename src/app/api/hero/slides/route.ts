import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const where: any = { isActive: true };
    if (branchId && branchId !== "all") where.branchId = branchId;

    const heroSlides = await prisma.heroContent.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, slides: heroSlides });
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const isSuperRole = decoded.role === "super_admin" || decoded.role === "super_manager";
    if (!isSuperRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, description, imageUrl, ctaText, ctaLink, branchId, order } = body;

    const slide = await prisma.heroContent.create({
      data: {
        title,
        subtitle,
        description,
        imageUrl,
        ctaText,
        ctaLink,
        branchId,
        order: order || 0,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId,
        action: "create",
        entity: "hero_slide",
        entityId: slide.id,
        details: { title, imageUrl },
      },
    });

    return NextResponse.json({ success: true, slide });
  } catch (error) {
    console.error("Error creating hero slide:", error);
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const isSuperRole = decoded.role === "super_admin" || decoded.role === "super_manager";
    if (!isSuperRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, subtitle, description, imageUrl, ctaText, ctaLink, order, isActive } = body;

    const slide = await prisma.heroContent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(subtitle && { subtitle }),
        ...(description && { description }),
        ...(imageUrl && { imageUrl }),
        ...(ctaText && { ctaText }),
        ...(ctaLink && { ctaLink }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: slide.branchId,
        action: "update",
        entity: "hero_slide",
        entityId: slide.id,
        details: { title, imageUrl, isActive },
      },
    });

    return NextResponse.json({ success: true, slide });
  } catch (error) {
    console.error("Error updating hero slide:", error);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Slide ID required" }, { status: 400 });

    await prisma.heroContent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}
