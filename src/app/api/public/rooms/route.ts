import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const maxOccupancy = searchParams.get("maxOccupancy");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "price";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (maxOccupancy) where.maxOccupancy = { gte: parseInt(maxOccupancy) };
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { type: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          branch: { select: { id: true, name: true, location: true } },
          roomAmenities: true,
          _count: { select: { bookings: true } },
        },
      }),
      prisma.room.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, floor, type, price, description, imageUrl, branchId, maxOccupancy, bedType, size, amenities } = body;

    if (!number || !floor || !type || !price || !branchId) {
      return NextResponse.json(
        { success: false, error: "Required fields missing" },
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

    if (amenities && Array.isArray(amenities)) {
      await prisma.roomAmenity.createMany({
        data: amenities.map((amenity: string) => ({
          roomId: room.id,
          amenity,
        })),
      });
    }

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Room ID required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
      include: { branch: true, roomAmenities: true },
    });

    return NextResponse.json({ success: true, room });
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Room ID required" },
        { status: 400 }
      );
    }

    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Room deleted" });
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
