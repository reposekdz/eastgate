import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch rooms with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const floor = searchParams.get("floor");
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (floor) where.floor = parseInt(floor);

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      include: {
        branch: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    return NextResponse.json({ success: true, rooms });
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

// POST - Create new room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, floor, type, price, description, imageUrl, branchId, maxOccupancy, bedType, size } = body;

    if (!number || !floor || !type || !price || !branchId) {
      return NextResponse.json(
        { success: false, error: "number, floor, type, price, and branchId are required" },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.room.findFirst({
      where: { number: number.toString(), branchId },
    });

    if (existingRoom) {
      return NextResponse.json(
        { success: false, error: "Room number already exists in this branch" },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        number: number.toString(),
        floor: parseInt(floor),
        type,
        price: parseFloat(price),
        description,
        imageUrl,
        status: "available",
        branchId,
        maxOccupancy: maxOccupancy || 2,
        bedType,
        size: size ? parseInt(size) : null,
      },
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update room
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, number, floor, type, price, description, imageUrl, status, maxOccupancy, bedType, size } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.room.findUnique({ where: { id } });

    if (!existingRoom) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (number) updateData.number = number.toString();
    if (floor) updateData.floor = parseInt(floor);
    if (type) updateData.type = type;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;
    if (maxOccupancy) updateData.maxOccupancy = parseInt(maxOccupancy);
    if (bedType) updateData.bedType = bedType;
    if (size) updateData.size = parseInt(size);

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, room: updatedRoom });
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

// DELETE - Delete room
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.room.findUnique({ where: { id } });

    if (!existingRoom) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    const activeBookings = await prisma.booking.count({
      where: {
        roomId: id,
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete room with active bookings" },
        { status: 400 }
      );
    }

    await prisma.room.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Room deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}