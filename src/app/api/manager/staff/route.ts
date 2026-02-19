import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { z } from "zod";

/**
 * GET /api/manager/staff
 * Get all staff members for the manager's branch with advanced filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetBranchId = searchParams.get("branchId") || branchId;
    const staffRole = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Branch managers can only view their branch staff
    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const where: any = {
      branchId: targetBranchId,
      role: { not: "SUPER_ADMIN" },
    };

    if (staffRole) where.role = staffRole;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        joinDate: true,
        lastLogin: true,
        mustChangePassword: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        shifts: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
        performanceReviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            bookingsCreated: true,
            ordersCreated: true,
            shifts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate staff statistics
    const stats = {
      total: staff.length,
      active: staff.filter(s => s.status === "ACTIVE").length,
      onLeave: staff.filter(s => s.status === "ON_LEAVE").length,
      suspended: staff.filter(s => s.status === "SUSPENDED").length,
      byRole: staff.reduce((acc: any, s) => {
        acc[s.role] = (acc[s.role] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      staff,
      stats,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/staff
 * Create new staff member (Manager creates credentials)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const staffSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      phone: z.string().optional(),
      role: z.enum([
        "RECEPTIONIST",
        "WAITER",
        "RESTAURANT_STAFF",
        "CHEF",
        "KITCHEN_STAFF",
        "HOUSEKEEPING",
        "SPA_THERAPIST",
        "ACCOUNTANT",
        "EVENT_MANAGER",
        "SECURITY",
        "MAINTENANCE",
        "DRIVER",
      ]),
      branchId: z.string().optional(),
    });

    const body = await request.json();
    const validatedData = staffSchema.parse(body);

    const targetBranchId = validatedData.branchId || branchId;

    // Branch managers can only create staff for their branch
    if (role === "BRANCH_MANAGER" && targetBranchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create staff member
    const newStaff = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        role: validatedData.role,
        branchId: targetBranchId,
        status: "ACTIVE",
        mustChangePassword: true, // Force password change on first login
        joinDate: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notification for the new staff member
    await prisma.notification.create({
      data: {
        userId: newStaff.id,
        title: "Welcome to Eastgate Hotel",
        message: `Your account has been created. Please change your password on first login. Your temporary credentials: Email: ${validatedData.email}, Password: ${validatedData.password}`,
        type: "SYSTEM",
      },
    });

    return NextResponse.json({
      success: true,
      staff: newStaff,
      credentials: {
        email: validatedData.email,
        temporaryPassword: validatedData.password,
        mustChangePassword: true,
      },
      message: "Staff member created successfully. Credentials will be sent to the staff member.",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manager/staff
 * Update staff member details
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, branchId } = session.user;

    if (!["BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateSchema = z.object({
      staffId: z.string(),
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      status: z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"]).optional(),
      role: z.string().optional(),
    });

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Get staff member to check branch
    const staff = await prisma.user.findUnique({
      where: { id: validatedData.staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Branch managers can only update their branch staff
    if (role === "BRANCH_MANAGER" && staff.branchId !== branchId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.phone) updateData.phone = validatedData.phone;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.role) updateData.role = validatedData.role;

    const updatedStaff = await prisma.user.update({
      where: { id: validatedData.staffId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
      message: "Staff member updated successfully",
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}
