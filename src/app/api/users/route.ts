import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth-advanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const isSuperRole = decoded.role === "super_admin" || decoded.role === "super_manager";
    if (!isSuperRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [managers, staff] = await Promise.all([
      prisma.manager.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          level: true,
          isActive: true,
          totalBranches: true,
          lastLogin: true,
          twoFactorEnabled: true,
          createdAt: true,
          assignments: {
            where: { isActive: true },
            include: {
              branch: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.staff.findMany({
        where: { status: "active" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          department: true,
          status: true,
          branchId: true,
          lastLogin: true,
          createdAt: true,
          branch: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, managers, staff });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await request.json();
    const { id, userType, name, email, phone, password, avatar, level, role, department } = body;

    if (!id || !userType) {
      return NextResponse.json({ error: "User ID and type required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (password) updateData.password = await hashPassword(password);

    let updatedUser;

    if (userType === "manager") {
      if (level) updateData.level = level;
      updatedUser = await prisma.manager.update({
        where: { id },
        data: updateData,
      });

      await prisma.activityLog.create({
        data: {
          userId: decoded.userId,
          branchId: decoded.branchId || "system",
          action: "update",
          entity: "manager",
          entityId: id,
          details: { name, email, level },
        },
      });
    } else if (userType === "staff") {
      if (role) updateData.role = role;
      if (department) updateData.department = department;
      
      updatedUser = await prisma.staff.update({
        where: { id },
        data: updateData,
      });

      await prisma.activityLog.create({
        data: {
          userId: decoded.userId,
          branchId: updatedUser.branchId,
          action: "update",
          entity: "staff",
          entityId: id,
          details: { name, email, role },
        },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token, "access") as any;
    if (!decoded || decoded.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userType = searchParams.get("userType");

    if (!id || !userType) {
      return NextResponse.json({ error: "User ID and type required" }, { status: 400 });
    }

    if (userType === "manager") {
      await prisma.manager.update({
        where: { id },
        data: { isActive: false },
      });
    } else if (userType === "staff") {
      await prisma.staff.update({
        where: { id },
        data: { status: "inactive" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
