import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const isActive = searchParams.get("isActive");
    const code = searchParams.get("code");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (isActive === "true") {
      where.isActive = true;
      where.startDate = { lte: new Date() };
      where.endDate = { gte: new Date() };
    }
    if (code) where.code = code;

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, promotions });
  } catch (error) {
    console.error("Promotions fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch promotions" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const existing = await prisma.promotion.findUnique({
      where: { code: body.code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Promotion code already exists" },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: body,
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error("Promotion creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create promotion" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const promotion = await prisma.promotion.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error("Promotion update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update promotion" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
