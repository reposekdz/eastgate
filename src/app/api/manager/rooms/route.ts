import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, type, floor, price, capacity, amenities, images, branchId, status } = body;

    if (!roomNumber || !type || !branchId || !price) {
      return NextResponse.json(
        { success: false, error: "Room number, type, branch, and price are required" },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.room.findFirst({
      where: { number: roomNumber, branchId },
    });

    if (existingRoom) {
      return NextResponse.json(
        { success: false, error: "Room number already exists in this branch" },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        number: roomNumber,
        type,
        floor: floor || 1,
        price: parseFloat(price),
        maxOccupancy: capacity || 2,
        status: status || "available",
        branchId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
