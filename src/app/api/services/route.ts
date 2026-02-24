import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch spa services
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const type = searchParams.get("type");
    const available = searchParams.get("available");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;
    if (available === "true") where.available = true;

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, price, duration, description, imageUrl, available, branchId } = body;

    if (!name || !type || !price || !duration || !branchId) {
      return NextResponse.json(
        { success: false, error: "name, type, price, duration, and branchId are required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        type,
        price: parseFloat(price),
        duration: parseInt(duration),
        description,
        imageUrl,
        available: available !== false,
        branchId,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Service creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create service" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update service
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, price, duration, description, imageUrl, available } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (available !== undefined) updateData.available = available;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete service
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (error) {
    console.error("Service deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete service" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
