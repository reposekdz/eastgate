import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        location: true,
        city: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, city, phone, email, totalRooms } = body;

    const branch = await prisma.branch.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        location,
        city,
        phone,
        email,
        totalRooms: totalRooms || 0,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        branchId: branch.id,
        action: "create",
        entity: "branch",
        entityId: branch.id,
        details: { name, location },
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
