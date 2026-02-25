import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

/**
 * GET /api/guest/profile
 * Fetch guest profile
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (session.role !== "GUEST") {
      return NextResponse.json({ success: false, error: "Only guests can access this endpoint" }, { status: 403 });
    }

    const guest = await prisma.guest.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error("[GUEST_PROFILE_GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guest/profile
 * Update guest profile
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (session.role !== "GUEST") {
      return NextResponse.json({ success: false, error: "Only guests can access this endpoint" }, { status: 403 });
    }

    const body = await req.json();

    const allowedFields = ["name", "phone", "avatar"];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const guest = await prisma.guest.update({
      where: { email: session.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error("[GUEST_PROFILE_PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
