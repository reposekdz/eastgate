import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    let tasks = [
      {
        id: "hk-001",
        roomNumber: "101",
        floor: 1,
        type: "checkout_cleaning",
        status: "in_progress",
        priority: "high",
        assignedTo: "Claudine Mukamana",
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        notes: "Deep cleaning required",
        branchId,
      },
      {
        id: "hk-002",
        roomNumber: "204",
        floor: 2,
        type: "daily_cleaning",
        status: "pending",
        priority: "medium",
        assignedTo: null,
        startTime: null,
        estimatedCompletion: null,
        notes: "Guest requested extra towels",
        branchId,
      },
      {
        id: "hk-003",
        roomNumber: "303",
        floor: 3,
        type: "checkout_cleaning",
        status: "completed",
        priority: "high",
        assignedTo: "Claudine Mukamana",
        startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        notes: "Completed ahead of schedule",
        branchId,
      },
      {
        id: "hk-004",
        roomNumber: "205",
        floor: 2,
        type: "maintenance",
        status: "pending",
        priority: "urgent",
        assignedTo: null,
        notes: "AC not working - urgent repair needed",
        branchId,
      },
    ];

    if (status && status !== "all") {
      tasks = tasks.filter((task) => task.status === status);
    }

    return NextResponse.json({
      success: true,
      tasks,
      total: tasks.length,
      summary: {
        pending: tasks.filter((t) => t.status === "pending").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        urgent: tasks.filter((t) => t.priority === "urgent").length,
      },
    });
  } catch (error) {
    console.error("Housekeeping fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch housekeeping tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, type, priority, notes, branchId } = body;

    const newTask = {
      id: `hk-${Date.now()}`,
      roomNumber,
      type,
      status: "pending",
      priority,
      assignedTo: null,
      notes,
      branchId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      task: newTask,
      message: "Housekeeping task created successfully",
    });
  } catch (error) {
    console.error("Housekeeping creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create housekeeping task" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, assignedTo, notes } = body;

    const updatedTask = {
      id: taskId,
      status,
      assignedTo,
      notes,
      updatedAt: new Date().toISOString(),
      ...(status === "completed" && { completedAt: new Date().toISOString() }),
    };

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: "Housekeeping task updated successfully",
    });
  } catch (error) {
    console.error("Housekeeping update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update housekeeping task" },
      { status: 500 }
    );
  }
}
