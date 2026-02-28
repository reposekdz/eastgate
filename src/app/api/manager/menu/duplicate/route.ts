import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { id, branchId, createdBy } = await req.json();

    const original = await prisma.menuItem.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    const duplicate = await prisma.menuItem.create({
      data: {
        ...original,
        id: undefined,
        name: `${original.name} (Copy)`,
        slug: `${original.slug}-copy-${Date.now()}`,
        createdBy,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    return NextResponse.json({ success: true, item: duplicate });
  } catch (error) {
    console.error("Duplicate error:", error);
    return NextResponse.json({ success: false, error: "Failed to duplicate" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
