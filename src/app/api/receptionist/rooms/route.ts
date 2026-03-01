import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const floor = searchParams.get("floor");

  try {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status && status !== "all") where.status = status;
    if (floor && floor !== "all") where.floor = parseInt(floor);

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    });

    return NextResponse.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room.id,
        number: room.number,
        type: room.type,
        status: room.status,
        floor: room.floor,
        price: room.price,
        branchId: room.branchId,
      })),
    });
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, status } = body;

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { status, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}