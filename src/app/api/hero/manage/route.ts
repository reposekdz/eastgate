import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || decoded.branchId;

    const heroContents = await prisma.heroContent.findMany({
      where: { branchId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, heroContents });
  } catch (error) {
    console.error("Fetch hero error:", error);
    return NextResponse.json({ error: "Failed to fetch hero content" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { title, subtitle, description, imageUrl, ctaText, ctaLink, branchId, order, isActive } = await req.json();

    const heroContent = await prisma.heroContent.create({
      data: {
        title,
        subtitle,
        description,
        imageUrl,
        ctaText,
        ctaLink,
        branchId: branchId || decoded.branchId,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: branchId || decoded.branchId,
        action: "hero_create",
        entity: "hero_content",
        entityId: heroContent.id,
        details: { title, imageUrl },
      },
    });

    return NextResponse.json({ success: true, heroContent });
  } catch (error) {
    console.error("Create hero error:", error);
    return NextResponse.json({ error: "Failed to create hero content" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { id, title, subtitle, description, imageUrl, ctaText, ctaLink, order, isActive } = await req.json();

    const heroContent = await prisma.heroContent.update({
      where: { id },
      data: { title, subtitle, description, imageUrl, ctaText, ctaLink, order, isActive },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: decoded.branchId,
        action: "hero_update",
        entity: "hero_content",
        entityId: id,
        details: { title, imageUrl, isActive },
      },
    });

    return NextResponse.json({ success: true, heroContent });
  } catch (error) {
    console.error("Update hero error:", error);
    return NextResponse.json({ error: "Failed to update hero content" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Hero content ID required" }, { status: 400 });
    }

    await prisma.heroContent.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: decoded.branchId,
        action: "hero_delete",
        entity: "hero_content",
        entityId: id,
        details: {},
      },
    });

    return NextResponse.json({ success: true, message: "Hero content deleted" });
  } catch (error) {
    console.error("Delete hero error:", error);
    return NextResponse.json({ error: "Failed to delete hero content" }, { status: 500 });
  }
}
