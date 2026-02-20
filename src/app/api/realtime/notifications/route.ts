import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const branchId = searchParams.get("branchId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { isRead: false };
    if (userId) where.userId = userId;
    if (branchId && branchId !== "all") where.branchId = branchId;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { name: true, role: true } } },
    });

    const unreadCount = await prisma.notification.count({ where });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, branchId, type, title, message, priority, metadata } = body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        branchId,
        type,
        title,
        message,
        priority: priority || "medium",
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationIds, userId } = body;

    await prisma.notification.updateMany({
      where: { id: { in: notificationIds }, userId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
