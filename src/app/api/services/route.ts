import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch services with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const available = searchParams.get("available");
    const userBranchId = req.headers.get("x-branch-id") as string;

    const where: any = {};

    // Filter by branch
    if (userBranchId) {
      where.branchId = userBranchId;
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by availability
    if (available === "true") {
      where.available = true;
    } else if (available === "false") {
      where.available = false;
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
    });

    // Get service types for filtering
    const serviceTypes = await prisma.service.groupBy({
      by: ["type"],
      where: userBranchId ? { branchId: userBranchId } : {},
    });

    return NextResponse.json({
      success: true,
      services,
      serviceTypes: serviceTypes.map(s => s.type),
    });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST - Create new service (Manager only)
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
      name,
      type,
      price,
      duration,
      description,
      imageUrl,
      available,
    } = body;

    // Validate required fields
    if (!name || !type || !price || !duration) {
      return NextResponse.json(
        { error: "name, type, price, and duration are required" },
        { status: 400 }
      );
    }

    // Create service
    const service = await prisma.service.create({
      data: {
        name,
        type,
        price: parseFloat(price),
        duration: parseInt(duration),
        description,
        imageUrl,
        available: available !== false,
        branchId: session.user.branchId || "",
      },
    });

    // Log creation
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "service_created",
        entity: "service",
        entityId: service.id,
        details: { name, type, price },
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Service creation error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

// PUT - Update service
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
      name,
      type,
      price,
      duration,
      description,
      imageUrl,
      available,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (available !== undefined) updateData.available = available;

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    // Log update
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "service_updated",
        entity: "service",
        entityId: id,
        details: { name, type },
      },
    });

    return NextResponse.json({
      success: true,
      service: updatedService,
    });
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
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
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete service
    await prisma.service.delete({
      where: { id },
    });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "service_deleted",
        entity: "service",
        entityId: id,
        details: { name: existingService.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Service deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
