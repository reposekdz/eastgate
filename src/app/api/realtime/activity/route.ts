import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (branchId && branchId !== "all") where.branchId = branchId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true, role: true } } },
    });

    const stats = await prisma.activityLog.groupBy({
      by: ["action"],
      where,
      _count: { action: true },
    });

    return NextResponse.json({
      success: true,
      data: activities,
      stats: stats.map(s => ({ action: s.action, count: s._count.action })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, branchId, action, entity, entityId, details } = body;

    const activity = await prisma.activityLog.create({
      data: { userId, branchId, action, entity, entityId, details: details || {} },
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
