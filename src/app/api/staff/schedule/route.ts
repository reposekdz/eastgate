import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

// GET - Fetch staff schedules
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || decoded.branchId;
    const startDate = searchParams.get("startDate") || new Date().toISOString();
    const endDate = searchParams.get("endDate");

    const staff = await prisma.staff.findMany({
      where: { branchId, status: "active" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        shift: true,
        phone: true,
      },
    });

    // Generate weekly schedule
    const schedule = staff.map((member) => ({
      ...member,
      schedule: generateWeeklySchedule(member.shift || "morning"),
      hoursPerWeek: calculateWeeklyHours(member.shift || "morning"),
    }));

    return NextResponse.json({
      success: true,
      schedule,
      period: { startDate, endDate },
    });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

// POST - Create/Update staff schedule
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { staffId, shift, startDate, endDate, notes } = await req.json();

    await prisma.staff.update({
      where: { id: staffId },
      data: { shift },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: decoded.branchId,
        action: "schedule_update",
        entity: "staff",
        entityId: staffId,
        details: { shift, startDate, endDate, notes },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully",
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

function generateWeeklySchedule(shift: string) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const shiftTimes: Record<string, { start: string; end: string }> = {
    morning: { start: "06:00", end: "14:00" },
    afternoon: { start: "14:00", end: "22:00" },
    night: { start: "22:00", end: "06:00" },
  };

  const times = shiftTimes[shift] || shiftTimes.morning;

  return days.map((day) => ({
    day,
    startTime: times.start,
    endTime: times.end,
    hours: 8,
  }));
}

function calculateWeeklyHours(shift: string): number {
  return 8 * 7; // 8 hours per day, 7 days
}
