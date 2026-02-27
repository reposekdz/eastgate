/**
 * Housekeeping Staff Dashboard API
 * Real-time task management for housekeeping staff
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Fetch housekeeping staff dashboard data
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const staffId = decoded.userId;
    const status = searchParams.get("status");
    const today = searchParams.get("today") === "true";

    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    // Build query
    const where: any = {
      staffId: staffId,
      type: {
        in: [
          "room_cleaning",
          "deep_cleaning",
          "turnover",
          "laundry",
          "amenities_restock",
        ],
      },
    };

    if (status) {
      where.status = status;
    }

    if (today) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    // Fetch tasks
    const tasks = await prisma.assignment.findMany({
      where,
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

    // Get room details for each task
    const tasksWithRooms = await Promise.all(
      tasks.map(async (task) => {
        let roomDetails = null;
        if (task.entityId) {
          roomDetails = await prisma.room.findUnique({
            where: { id: task.entityId },
            select: {
              id: true,
              number: true,
              type: true,
              status: true,
              floor: true,
            },
          });
        }
        return { ...task, room: roomDetails };
      })
    );

    // Calculate statistics
    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      urgent: tasks.filter((t) => t.priority === "urgent").length,
      overdue: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status !== "completed"
      ).length,
    };

    // Get today's completed tasks
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCompleted = tasks.filter(
      (t) =>
        t.status === "completed" &&
        t.completedAt &&
        new Date(t.completedAt) >= startOfDay
    ).length;

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department,
        branch: staff.branch,
      },
      tasks: tasksWithRooms,
      stats: {
        ...stats,
        todayCompleted,
      },
    });
  } catch (error: any) {
    console.error("Housekeeping dashboard GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update task status
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { taskId, status, notes } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, error: "Task ID and status are required" },
        { status: 400 }
      );
    }

    // Verify task belongs to this staff member
    const task = await prisma.assignment.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    if (task.staffId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to update this task" },
        { status: 403 }
      );
    }

    // Update task
    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const updatedTask = await prisma.assignment.update({
      where: { id: taskId },
      data: updateData,
    });

    // Update room status if task is completed
    if (status === "completed" && task.entityId) {
      const room = await prisma.room.findUnique({
        where: { id: task.entityId },
      });

      if (room) {
        // Check if there's an active booking
        const activeBooking = await prisma.booking.findFirst({
          where: {
            roomId: task.entityId,
            status: "checked_in",
            checkIn: { lte: new Date() },
            checkOut: { gte: new Date() },
          },
        });

        await prisma.room.update({
          where: { id: task.entityId },
          data: {
            status: activeBooking ? "occupied" : "available",
          },
        });
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        action: `task_${status}`,
        entity: "assignment",
        entityId: taskId,
        details: `Task ${task.type} marked as ${status}`,
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task ${status === "completed" ? "completed" : "updated"} successfully`,
    });
  } catch (error: any) {
    console.error("Housekeeping dashboard PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update task",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
