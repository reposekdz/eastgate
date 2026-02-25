import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch rooms with advanced filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "available";
    const floor = searchParams.get("floor");
    const branchId = searchParams.get("branchId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const capacity = searchParams.get("capacity");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (floor) where.floor = parseInt(floor);
    if (capacity) where.maxOccupancy = { gte: parseInt(capacity) };
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const total = await prisma.room.count({ where });
    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      select: {
        id: true,
        number: true,
        type: true,
        floor: true,
        price: true,
        maxOccupancy: true,
        status: true,
        imageUrl: true,
        description: true,
        branchId: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch rooms",
    }, { status: 500 });
  }
}

// POST - Create new room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      number,
      type,
      floor,
      price,
      maxOccupancy,
      status,
      description,
      branchId,
    } = body;

    if (!number || !type || !branchId) {
      return NextResponse.json({
        success: false,
        error: "Room number, type, and branch ID are required",
      }, { status: 400 });
    }

    const existingRoom = await prisma.room.findFirst({
      where: { number, branchId },
    });

    if (existingRoom) {
      return NextResponse.json({
        success: false,
        error: "Room number already exists in this branch",
      }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        number,
        type,
        floor: floor || 1,
        price: price || 0,
        maxOccupancy: maxOccupancy || 2,
        status: status || "available",
        description: description || "",
        branchId,
      },
      select: {
        id: true,
        number: true,
        type: true,
        floor: true,
        price: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { room },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Room creation error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create room",
    }, { status: 500 });
  }
}

// PATCH - Update room
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Room ID is required",
      }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({
        success: false,
        error: "Room not found",
      }, { status: 404 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        number: true,
        type: true,
        floor: true,
        price: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { room: updatedRoom },
    });
  } catch (error: any) {
    console.error("Room update error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update room",
    }, { status: 500 });
  }
}

// DELETE - Remove room
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Room ID is required",
      }, { status: 400 });
    }

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({
        success: false,
        error: "Room not found",
      }, { status: 404 });
    }

    const activeBookings = await prisma.booking.count({
      where: {
        roomId: id,
        status: { in: ["confirmed", "checked_in"] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json({
        success: false,
        error: `Room has ${activeBookings} active booking(s)`,
      }, { status: 400 });
    }

    await prisma.room.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "Room deleted successfully" },
    });
  } catch (error: any) {
    console.error("Room deletion error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete room",
    }, { status: 500 });
  }
}
