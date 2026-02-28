import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { id, field, value } = await req.json();

    const item = await prisma.menuItem.update({
      where: { id },
      data: { [field]: value },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Toggle error:", error);
    return NextResponse.json({ success: false, error: "Failed to toggle" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
