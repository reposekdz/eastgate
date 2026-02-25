/**
 * Get Current User API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const userData = await prisma.staff.findUnique({ where: { id: user.id } });
    if (!userData) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        branchId: userData.branchId,
        avatar: userData.avatar,
      },
    });
  } catch (error) {
    console.error("[ME API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
