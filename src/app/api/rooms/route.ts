import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch rooms with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const floor = searchParams.get("floor");
    const userBranchId = session.user.branchId as string;
    const userRole = session.user.role as string;

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole) && userBranchId) {
      where.branchId = userBranchId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (floor) {
      where.floor = parseInt(floor);
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [
        { floor: "asc" },
        { number: "asc" },
      ],
    });

    // Get room types for filtering
    const roomTypes = await prisma.room.groupBy({
      by: ["type"],
      where: where.branchId ? { branchId: where.branchId } : {},
    });

    // Get statistics
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === "available").length;
    const bookedRooms = rooms.filter(r => r.status === "booked").length;

    return NextResponse.json({
      success: true,
      rooms,
      roomTypes: roomTypes.map(r => r.type),
      stats: {
        total: totalRooms,
        available: availableRooms,
        booked: bookedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST - Create new room (Manager only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      number,
      floor,
      type,
      price,
      description,
      imageUrl,
    } = body;

    // Validate required fields
    if (!number || !floor || !type || !price) {
      return NextResponse.json(
        { error: "number, floor, type, and price are required" },
        { status: 400 }
      );
    }

    // Check if room number already exists in this branch
    const existingRoom = await prisma.room.findFirst({
      where: {
        number: number.toString(),
        branchId: session.user.branchId || "",
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists in this branch" },
        { status: 400 }
      );
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        number: number.toString(),
        floor: parseInt(floor),
        type,
        price: parseFloat(price),
        description,
        imageUrl,
        status: "available",
        branchId: session.user.branchId || "",
      },
    });

    // Log creation
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "room_created",
        entity: "room",
        entityId: room.id,
        details: { number, floor, type, price },
      },
    });

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

// PUT - Update room
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      id,
      number,
      floor,
      type,
      price,
      description,
      imageUrl,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (number) updateData.number = number.toString();
    if (floor) updateData.floor = parseInt(floor);
    if (type) updateData.type = type;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    // Log update
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "room_updated",
        entity: "room",
        entityId: id,
        details: { number, type, status },
      },
    });

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE - Delete room
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        roomId: id,
        status: { in: ["pending", "confirmed", "checked_in"] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete room with active bookings" },
        { status: 400 }
      );
    }

    // Delete room
    await prisma.room.delete({
      where: { id },
    });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "room_deleted",
        entity: "room",
        entityId: id,
        details: { number: existingRoom.number },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Room deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
