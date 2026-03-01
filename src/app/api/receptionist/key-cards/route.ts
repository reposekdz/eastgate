import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, roomId, branchId } = body;

    const keyCard = {
      id: `KEY-${Date.now()}`,
      guestId,
      roomId,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      branchId,
    };

    await prisma.activityLog.create({
      data: {
        branchId,
        action: "create",
        entity: "key_card",
        entityId: keyCard.id,
        details: { guestId, roomId },
      },
    });

    return NextResponse.json({
      success: true,
      keyCard,
      message: "Key card issued successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to issue key card" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
