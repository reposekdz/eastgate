import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/users - Get users for branch
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Build where clause based on role
    let whereClause: any = {};

    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      // Can see all users
      if (role) whereClause.role = role;
      if (status) whereClause.status = status;
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }
    } else if (userBranchId) {
      // Can only see their branch users
      whereClause.branchId = userBranchId;
      if (role) whereClause.role = role;
      if (status) whereClause.status = status;
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ];
      }
    } else {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Get users with branch info
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          branchId: true,
          joinDate: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get stats by role
    const stats = await prisma.user.groupBy({
      by: ['role', 'status'],
      where: whereClause,
      _count: true,
    });

    const roleStats: Record<string, number> = {};
    const statusStats: Record<string, number> = {};
    stats.forEach(s => {
      roleStats[s.role] = (roleStats[s.role] || 0) + s._count;
      statusStats[s.status] = (statusStats[s.status] || 0) + s._count;
    });

    return NextResponse.json({
      success: true,
      users,
      totalCount,
      stats: {
        byRole: roleStats,
        byStatus: statusStats,
      },
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to get users" },
      { status: 500 }
    );
  }
}

// POST /api/manager/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can create users
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      name,
      phone,
      role,
      branchId,
      password,
      mustChangePassword,
    } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    // Validate role
    const allowedRoles = userRole === "BRANCH_MANAGER" 
      ? ["RECEPTIONIST", "WAITER", "HOUSEKEEPER", "CHEF", "STAFF"]
      : ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "RECEPTIONIST", "WAITER", "HOUSEKEEPER", "CHEF", "STAFF"];

    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role for your permission level" },
        { status: 403 }
      );
    }

    // Determine branch
    let assignedBranchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      assignedBranchId = branchId || userBranchId;
    }

    if (!assignedBranchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone: phone || "",
        password: hashedPassword,
        role: role || "STAFF",
        branchId: assignedBranchId,
        status: "ACTIVE",
        mustChangePassword: mustChangePassword !== false,
        lastPasswordChange: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT /api/manager/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can update users
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      name,
      phone,
      role,
      branchId,
      status,
      mustChangePassword,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    if (mustChangePassword !== undefined) updateData.mustChangePassword = mustChangePassword;

    // Only super roles can change role and branch
    if (["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      if (role) updateData.role = role;
      if (branchId) updateData.branchId = branchId;
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Branch managers can only update their branch users
    if (userRole === "BRANCH_MANAGER" && existingUser.branchId !== userBranchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/manager/users - Deactivate user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only admins can deactivate users
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot deactivate yourself
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Deactivate user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
      user,
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 }
    );
  }
}
