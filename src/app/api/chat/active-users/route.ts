import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get active users who can respond to chat
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";

    // Get active staff members who can respond to chat
    const activeUsers = await prisma.staff.findMany({
      where: {
        branchId,
        status: "active",
        role: {
          in: ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER", "RECEPTIONIST", "WAITER", "KITCHEN_STAFF"]
        },
        lastLogin: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Active in last 30 minutes
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        lastLogin: true,
        department: true
      },
      orderBy: {
        lastLogin: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      activeUsers,
      count: activeUsers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Get active users error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch active users"
    }, { status: 500 });
  }
}

// POST - Update user activity status
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status = "active" } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "User ID is required"
      }, { status: 400 });
    }

    // Update last login to mark as active
    await prisma.staff.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
        status
      }
    });

    return NextResponse.json({
      success: true,
      message: "User activity updated",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Update user activity error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update user activity"
    }, { status: 500 });
  }
}