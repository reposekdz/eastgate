/**
 * Housekeeping & Maintenance Tasks API
 * Complete task management for housekeeping and maintenance operations
 * Uses the Assignment model for tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Task categories 
const TASK_CATEGORIES = {
  housekeeping: ["room_cleaning", "deep_cleaning", "turnover", "laundry", "amenities_restock"],
  maintenance: ["repair", "inspection", "preventive", "emergency", "utility"],
  inspection: ["quality_check", "safety_check", "compliance"],
};

// GET - Fetch tasks (housekeeping and maintenance)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const taskType = searchParams.get("taskType");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const staffId = searchParams.get("staffId");
    const roomId = searchParams.get("roomId");
    const category = searchParams.get("category");
    const today = searchParams.get("today") === "true";

    // Build staff filter if branchId provided
    const staffWhere: any = {};
    if (branchId) staffWhere.branchId = branchId;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (staffId) where.staffId = staffId;
    if (roomId) where.entityId = roomId;
    if (taskType) where.type = taskType;

    // Today's tasks
    if (today) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    // Get staff IDs for the branch if needed
    let staffIds: string[] = [];
    if (branchId) {
      const branchStaff = await prisma.staff.findMany({
        where: { branchId },
        select: { id: true },
      });
      staffIds = branchStaff.map((s) => s.id);
      if (staffIds.length > 0) {
        where.staffId = { in: staffIds };
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            avatar: true,
            department: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Filter by category
    let filteredAssignments = assignments;
    if (category) {
      filteredAssignments = assignments.filter((a) => 
        TASK_CATEGORIES[category as keyof typeof TASK_CATEGORIES]?.includes(a.type)
      );
    }

    // Get room details for each task
    const tasksWithRooms = await Promise.all(
      filteredAssignments.map(async (task) => {
        let roomDetails = null;
        if (task.entityId) {
          roomDetails = await prisma.room.findUnique({
            where: { id: task.entityId },
            select: {
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
      total: filteredAssignments.length,
      pending: filteredAssignments.filter((a) => a.status === "pending").length,
      inProgress: filteredAssignments.filter((a) => a.status === "in_progress").length,
      completed: filteredAssignments.filter((a) => a.status === "completed").length,
      urgent: filteredAssignments.filter((a) => a.priority === "urgent").length,
      overdue: filteredAssignments.filter((a) => 
        a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "completed"
      ).length,
    };

    // Group by category
    const byCategory = {
      housekeeping: filteredAssignments.filter((a) => 
        TASK_CATEGORIES.housekeeping.includes(a.type)
      ).length,
      maintenance: filteredAssignments.filter((a) => 
        TASK_CATEGORIES.maintenance.includes(a.type)
      ).length,
      inspection: filteredAssignments.filter((a) => 
        TASK_CATEGORIES.inspection.includes(a.type)
      ).length,
    };

    return NextResponse.json({
      success: true,
      tasks: tasksWithRooms,
      stats,
      byCategory,
      taskCategories: TASK_CATEGORIES,
    });
  } catch (error: any) {
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks", message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category,
      taskType,
      roomId,
      roomNumber,
      staffId,
      priority,
      dueDate,
      notes,
    } = body;

    if (!taskType || !staffId) {
      return NextResponse.json(
        { success: false, error: "Task type and staff ID are required" },
        { status: 400 }
      );
    }

    // Validate task type
    const isValidType = Object.values(TASK_CATEGORIES).flat().includes(taskType);
    if (!isValidType) {
      return NextResponse.json(
        { success: false, error: "Invalid task type" },
        { status: 400 }
      );
    }

    // Determine category from task type
    let taskCategory = "other";
    if (TASK_CATEGORIES.housekeeping.includes(taskType)) taskCategory = "housekeeping";
    else if (TASK_CATEGORIES.maintenance.includes(taskType)) taskCategory = "maintenance";
    else if (TASK_CATEGORIES.inspection.includes(taskType)) taskCategory = "inspection";

    // Create assignment (task)
    const task = await prisma.assignment.create({
      data: {
        type: taskType,
        entityId: roomId || "",
        status: "pending",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        staffId: staffId,
      },
      include: {
        staff: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Update room status for housekeeping tasks
    if (taskCategory === "housekeeping" && roomId) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "cleaning" },
      });
    }

    // Update room status for maintenance tasks
    if (taskCategory === "maintenance" && roomId) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: "maintenance" },
      });
    }

    // Get staff info for notification
    const staffMember = await prisma.staff.findUnique({ where: { id: staffId } });
    
    // Create notification for staff
    if (staffMember) {
      await prisma.notification.create({
        data: {
          userId: staffId,
          branchId: staffMember.branchId,
          type: "info",
          title: `New ${taskCategory} Task Assigned`,
          message: `New ${taskType.replace(/_/g, " ")} task${roomNumber ? ` for Room ${roomNumber}` : ""}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      task,
      category: taskCategory,
      message: `${taskCategory} task created successfully`,
    });
  } catch (error: any) {
    console.error("Tasks POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task", message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update task status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, notes, priority, completedAt } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.assignment.findUnique({
      where: { id: taskId },
      include: { staff: true },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (status === "completed") {
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
    }

    const updatedTask = await prisma.assignment.update({
      where: { id: taskId },
      data: updateData,
      include: {
        staff: { select: { id: true, name: true } },
      },
    });

    // Determine category
    let taskCategory = "other";
    if (TASK_CATEGORIES.housekeeping.includes(task.type)) taskCategory = "housekeeping";
    else if (TASK_CATEGORIES.maintenance.includes(task.type)) taskCategory = "maintenance";
    else if (TASK_CATEGORIES.inspection.includes(task.type)) taskCategory = "inspection";

    // Update room status after task completion
    if (status === "completed" && task.entityId) {
      if (taskCategory === "housekeeping" || taskCategory === "maintenance") {
        const currentBooking = await prisma.booking.findFirst({
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
            status: currentBooking ? "occupied" : "available",
            ...(taskCategory === "maintenance" ? { lastMaintenance: new Date() } : {})
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task ${status === "completed" ? "completed" : "updated"} successfully`,
    });
  } catch (error: any) {
    console.error("Tasks PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete/cancel a task
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ success: false, error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.assignment.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // If task was associated with a room, reset room status
    if (task.entityId) {
      const isHousekeeping = TASK_CATEGORIES.housekeeping.includes(task.type);
      const isMaintenance = TASK_CATEGORIES.maintenance.includes(task.type);
      
      if (isHousekeeping || isMaintenance) {
        await prisma.room.update({
          where: { id: task.entityId },
          data: { status: "available" },
        });
      }
    }

    await prisma.assignment.delete({ where: { id: taskId } });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Tasks DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete task", message: error.message },
      { status: 500 }
    );
  }
}
