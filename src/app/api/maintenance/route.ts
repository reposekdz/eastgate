import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

// GET - Fetch maintenance requests
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || decoded.branchId;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const assignments = await prisma.assignment.findMany({
      where: {
        ...where,
        type: "maintenance",
        staff: { branchId },
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    const stats = {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === "pending").length,
      inProgress: assignments.filter((a) => a.status === "in_progress").length,
      completed: assignments.filter((a) => a.status === "completed").length,
      urgent: assignments.filter((a) => a.priority === "high").length,
    };

    return NextResponse.json({
      success: true,
      maintenanceRequests: assignments,
      stats,
    });
  } catch (error) {
    console.error("Fetch maintenance error:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance requests" }, { status: 500 });
  }
}

// POST - Create maintenance request
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { roomId, description, priority, assignedTo } = await req.json();

    // Find maintenance staff if not assigned
    let staffId = assignedTo;
    if (!staffId) {
      const maintenanceStaff = await prisma.staff.findFirst({
        where: {
          branchId: decoded.branchId,
          department: "maintenance",
          status: "active",
        },
      });
      staffId = maintenanceStaff?.id;
    }

    if (!staffId) {
      return NextResponse.json({ error: "No maintenance staff available" }, { status: 400 });
    }

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "maintenance" },
    });

    // Create maintenance assignment
    const assignment = await prisma.assignment.create({
      data: {
        staffId,
        type: "maintenance",
        entityId: roomId,
        status: "pending",
        priority: priority || "medium",
        notes: description,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        title: "New Maintenance Request",
        message: `Maintenance required for room. Priority: ${priority || "medium"}`,
        type: "warning",
        userId: staffId,
        branchId: decoded.branchId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: decoded.branchId,
        action: "maintenance_request",
        entity: "room",
        entityId: roomId,
        details: { description, priority, assignedTo: staffId },
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: "Maintenance request created successfully",
    });
  } catch (error) {
    console.error("Create maintenance error:", error);
    return NextResponse.json({ error: "Failed to create maintenance request" }, { status: 500 });
  }
}

// PUT - Update maintenance request
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { assignmentId, status, notes } = await req.json();

    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status,
        notes,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    // If completed, update room status
    if (status === "completed") {
      await prisma.room.update({
        where: { id: assignment.entityId },
        data: {
          status: "available",
          lastMaintenance: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      assignment,
      message: "Maintenance request updated successfully",
    });
  } catch (error) {
    console.error("Update maintenance error:", error);
    return NextResponse.json({ error: "Failed to update maintenance request" }, { status: 500 });
  }
}
