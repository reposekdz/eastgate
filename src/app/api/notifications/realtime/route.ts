import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const lastCheck = searchParams.get("lastCheck");

    const where: any = {
      branchId: branchId || decoded.branchId,
      read: false,
    };

    if (lastCheck) {
      where.createdAt = { gt: new Date(lastCheck) };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { branchId: branchId || decoded.branchId, read: false },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Real-time notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { notificationIds } = await req.json();

    await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Failed to mark notifications" }, { status: 500 });
  }
}
