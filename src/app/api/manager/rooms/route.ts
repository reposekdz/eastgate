import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/rooms - Get rooms for branch manager
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const floor = searchParams.get("floor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Build where clause based on role
    let whereClause: any = {};

    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      // Can see all branches
      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (floor) whereClause.floor = parseInt(floor);
    } else if (userBranchId) {
      // Can only see their branch
      whereClause.branchId = userBranchId;
      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (floor) whereClause.floor = parseInt(floor);
    } else {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Get rooms with branch info
    const [rooms, totalCount] = await Promise.all([
      prisma.room.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { number: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.room.count({ where: whereClause }),
    ]);

    // Get stats
    const stats = await prisma.room.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      rooms,
      totalCount,
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { error: "Failed to get rooms" },
      { status: 500 }
    );
  }
}

// POST /api/manager/rooms - Create new room (manager only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can create rooms
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      number,
      type,
      floor,
      price,
      description,
      amenities,
      images,
      features,
      maxGuests,
      bedType,
      size,
    } = body;

    if (!number || !type || !floor || !price) {
      return NextResponse.json(
        { error: "Number, type, floor, and price are required" },
        { status: 400 }
      );
    }

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || userBranchId;
    }

    if (!branchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Check if room number already exists in branch
    const existingRoom = await prisma.room.findFirst({
      where: {
        number,
        branchId,
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
        number,
        type: type.toUpperCase().replace(' ', '_'),
        floor: parseInt(floor),
        price: parseFloat(price),
        description,
        amenities: amenities || [],
        images: images || [],
        features: features || [],
        maxGuests: maxGuests || 2,
        bedType: bedType || "KING",
        size: size || "STANDARD",
        status: "AVAILABLE",
        branchId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

// PUT /api/manager/rooms - Update room
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can update rooms
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      roomId,
      number,
      type,
      floor,
      price,
      description,
      amenities,
      images,
      features,
      maxGuests,
      bedType,
      size,
      status,
    } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (number) updateData.number = number;
    if (type) updateData.type = type.toUpperCase().replace(' ', '_');
    if (floor) updateData.floor = parseInt(floor);
    if (price) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (amenities) updateData.amenities = amenities;
    if (images) updateData.images = images;
    if (features) updateData.features = features;
    if (maxGuests) updateData.maxGuests = maxGuests;
    if (bedType) updateData.bedType = bedType;
    if (size) updateData.size = size;
    if (status) updateData.status = status.toUpperCase();

    // Check room exists and user has access
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify branch access
    if (userRole !== "SUPER_ADMIN" && userRole !== "SUPER_MANAGER") {
      if (existingRoom.branchId !== userBranchId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Update room
    const room = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/manager/rooms - Delete room
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only admins can delete rooms
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    // Check room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
          },
        },
      },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check for active bookings
    if (existingRoom.bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete room with active bookings" },
        { status: 400 }
      );
    }

    // Delete room
    await prisma.room.delete({
      where: { id: roomId },
    });

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
