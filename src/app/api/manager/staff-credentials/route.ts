import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";
import { hash, hashSync } from "bcryptjs";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/staff-credentials - Get staff credentials
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can access staff credentials
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Build where clause
    let whereClause: any = {};
    
    // Branch managers can only see their branch
    if (userRole === "BRANCH_MANAGER") {
      whereClause.branchId = userBranchId;
    } else if (branchId) {
      whereClause.branchId = branchId;
    }

    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Get staff with credentials
    const [staff, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          branchId: true,
          branch: { select: { name: true } },
          joinDate: true,
          lastLogin: true,
          mustChangePassword: true,
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get role statistics
    const roleStats = await prisma.user.groupBy({
      by: ["role"],
      where: whereClause,
      _count: true,
    });

    // Get branch statistics
    const branchStats = await prisma.user.groupBy({
      by: ["branchId"],
      where: whereClause,
      _count: true,
    });

    // Get status statistics
    const statusStats = await prisma.user.groupBy({
      by: ["status"],
      where: whereClause,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      staff,
      totalCount,
      stats: {
        byRole: roleStats,
        byBranch: branchStats,
        byStatus: statusStats,
      },
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error("Get staff error:", error);
    return NextResponse.json({ error: "Failed to get staff" }, { status: 500 });
  }
}

// POST /api/manager/staff-credentials - Create staff account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can create staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      role,
      branchId,
      sendCredentials,
      tempPassword,
    } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = [
      "BRANCH_MANAGER", "RECEPTIONIST", "WAITER", "RESTAURANT_STAFF",
      "CHEF", "KITCHEN_STAFF", "HOUSEKEEPING", "MAINTENANCE",
      "SPA_THERAPIST", "ACCOUNTANT", "EVENT_MANAGER", "SECURITY", "DRIVER"
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Determine branch
    let targetBranchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      targetBranchId = branchId || userBranchId;
    }

    if (!targetBranchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Generate temporary password if not provided
    const password = tempPassword || generateTempPassword();

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create staff account
    const staff = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: role as any,
        branchId: targetBranchId,
        status: "ACTIVE",
        mustChangePassword: true,
        joinDate: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
      },
    });

    // Get branch info
    const branch = await prisma.branch.findUnique({
      where: { id: targetBranchId },
      select: { name: true },
    });

    // Send credentials via email/SMS (in production)
    if (sendCredentials) {
      // TODO: Implement email/SMS sending
      console.log(`Sending credentials to ${email}`);
    }

    // Create activity log
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "SYSTEM",
        title: "Staff Account Created",
        message: `New ${role} account created for ${name} at ${branch?.name}`,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      staff: {
        ...staff,
        branchName: branch?.name,
        tempPassword: sendCredentials ? password : null,
      },
      message: "Staff account created successfully",
    });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}

// PUT /api/manager/staff-credentials - Update staff
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      staffId,
      name,
      phone,
      role,
      branchId,
      status,
      resetPassword,
      forcePasswordChange,
    } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 });
    }

    // Get existing staff
    const existing = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Check branch access
    if (userRole === "BRANCH_MANAGER" && existing.branchId !== session.user.branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role && ["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) updateData.role = role;
    if (branchId && ["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) updateData.branchId = branchId;
    if (status) updateData.status = status;
    if (forcePasswordChange !== undefined) updateData.mustChangePassword = forcePasswordChange;

    // Reset password if requested
    if (resetPassword) {
      const newPassword = generateTempPassword();
      updateData.password = await hash(newPassword, 12);
      updateData.mustChangePassword = true;
      updateData.lastPasswordChange = new Date();
      updateData.tempPassword = newPassword;
    }

    const staff = await prisma.user.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        branchId: true,
      },
    });

    return NextResponse.json({
      success: true,
      staff,
      message: "Staff updated successfully",
    });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

// DELETE /api/manager/staff-credentials - Deactivate staff
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID required" }, { status: 400 });
    }

    // Prevent deleting yourself
    if (staffId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Soft delete - deactivate
    await prisma.user.update({
      where: { id: staffId },
      data: { status: "TERMINATED" },
    });

    return NextResponse.json({
      success: true,
      message: "Staff account deactivated",
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Failed to deactivate staff" }, { status: 500 });
  }
}

// Helper function to generate temp password
function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + "!";
}
