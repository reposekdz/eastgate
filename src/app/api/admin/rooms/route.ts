import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const floor = searchParams.get("floor");

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (floor) where.floor = parseInt(floor);

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      number: room.number,
      floor: room.floor,
      room_type: room.type,
      status: room.status,
      price: room.price,
      description: room.description,
      image_url: room.imageUrl,
      branch_id: room.branchId,
      created_at: room.createdAt.toISOString(),
      updated_at: room.updatedAt.toISOString(),
    }));

    return successResponse({ rooms: formattedRooms });
  } catch (error: any) {
    return errorResponse("Failed to fetch rooms", [], 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, floor, type, price, description } = body;

    const branches = await prisma.branch.findMany();
    if (branches.length === 0) {
      return errorResponse("No branches found", [], 400);
    }

    const room = await prisma.room.create({
      data: {
        number,
        floor: parseInt(floor),
        type,
        price: parseFloat(price),
        description: description || null,
        status: "available",
        branchId: branches[0].id,
        maxOccupancy: type === "standard" ? 2 : type === "deluxe" ? 3 : 4,
        bedType: type === "suite" ? "2 King Beds" : "1 King Bed",
        size: type === "standard" ? 28 : type === "deluxe" ? 38 : 65,
      },
    });

    return successResponse({ room }, 201);
  } catch (error: any) {
    return errorResponse("Failed to create room", [], 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, number, floor, type, price, description, status } = body;

    const room = await prisma.room.update({
      where: { id },
      data: {
        number,
        floor: parseInt(floor),
        type,
        price: parseFloat(price),
        description: description || null,
        status,
      },
    });

    return successResponse({ room });
  } catch (error: any) {
    return errorResponse("Failed to update room", [], 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Room ID required", [], 400);
    }

    await prisma.room.delete({ where: { id } });

    return successResponse({ message: "Room deleted successfully" });
  } catch (error: any) {
    return errorResponse("Failed to delete room", [], 500);
  }
}
