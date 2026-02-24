import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch activity logs with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = searchParams.get("limit") || "100";
    const userBranchId = session.user.branchId as string;
    const userRole = session.user.role as string;

    // Build filter
    const where: any = {};

    // Role-based filtering - managers can only see their branch
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole) && userBranchId) {
      where.branchId = userBranchId;
    }

    if (action) {
      where.action = { contains: action };
    }

    if (entity) {
      where.entity = entity;
    }

    if (userId) {
      where.userId = { contains: userId };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
    });

    // Get recent activity stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await prisma.activityLog.count({
      where: {
        ...where,
        createdAt: { gte: today },
      },
    });

    // Get action counts
    const actionCounts = await prisma.activityLog.groupBy({
      by: ["action"],
      where,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      logs,
      stats: {
        todayCount: todayLogs,
        actionCounts: actionCounts.map(a => ({
          action: a.action,
          count: a._count,
        })),
      },
    });
  } catch (error) {
    console.error("Activity logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

// POST - Create activity log entry
export async function POST(req: NextRequest) {
  try {
    // This is usually called internally by other APIs
    const body = await req.json();
    const {
      userId,
      action,
      entity,
      entityId,
      details,
      branchId,
    } = body;

    if (!action || !branchId) {
      return NextResponse.json(
        { error: "action and branchId are required" },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        branchId,
      },
    });

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("Activity log creation error:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}

// DELETE - Clear old logs (Manager only - cleanup)
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
    const daysOld = searchParams.get("daysOld") || "90";

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    // Delete logs older than specified days
    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} logs older than ${daysOld} days`,
    });
  } catch (error) {
    console.error("Activity log deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete activity logs" },
      { status: 500 }
    );
  }
}
