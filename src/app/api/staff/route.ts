import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-advanced";
import { successResponse, errorResponse } from "@/lib/validators";

// GET - Fetch all staff members with advanced filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const where: any = {};

    if (branchId && branchId !== "all") where.branchId = branchId;
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [staff, total, branches, roleStats] = await Promise.all([
      prisma.staff.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          department: true,
          shift: true,
          status: true,
          avatar: true,
          branchId: true,
          salary: true,
          hireDate: true,
          lastLogin: true,
          loginCount: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          _count: {
            select: {
              ordersCreated: true,
              activityLogs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.staff.count({ where }),
      prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true, location: true },
        orderBy: { name: "asc" },
      }),
      prisma.staff.groupBy({
        by: ["role"],
        where: branchId && branchId !== "all" ? { branchId } : {},
        _count: true,
      }),
    ]);

    const stats = {
      total,
      active: await prisma.staff.count({ where: { ...where, status: "active" } }),
      inactive: await prisma.staff.count({ where: { ...where, status: "inactive" } }),
      byRole: roleStats.reduce((acc, r) => {
        acc[r.role] = r._count;
        return acc;
      }, {} as Record<string, number>),
    };

    return successResponse({
      staff,
      branches,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching staff:", error);
    return errorResponse("Failed to fetch staff", [], 500);
  }
}

// POST - Create a new staff member with full validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, department, shift, status, branchId, password, salary, avatar } = body;

    // Validation
    const required = { name, email, password, role, department, branchId };
    const missing = Object.entries(required)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      return errorResponse(
        "Validation failed",
        missing.map((field) => ({
          field,
          message: `${field} is required`,
          code: "REQUIRED",
        })),
        400
      );
    }

    if (password.length < 6) {
      return errorResponse(
        "Validation failed",
        [{
          field: "password",
          message: "Password must be at least 6 characters",
          code: "MIN_LENGTH",
        }],
        400
      );
    }

    // Check for duplicate email
    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return errorResponse(
        "Staff exists",
        [{
          field: "email",
          message: "A staff member with this email already exists",
          code: "DUPLICATE",
        }],
        400
      );
    }

    // Validate branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return errorResponse(
        "Branch not found",
        [{
          field: "branchId",
          message: "Branch does not exist",
          code: "NOT_FOUND",
        }],
        404
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role.toUpperCase(),
        department,
        branchId,
        salary: salary ? parseFloat(salary) : null,
        shift: shift || null,
        avatar: avatar || null,
        status: status || "active",
        mustChangePassword: true,
        hireDate: new Date(),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: staff.id,
        branchId,
        action: "create",
        entity: "staff",
        entityId: staff.id,
        details: {
          name: staff.name,
          email: staff.email,
          role: staff.role,
        },
      },
    });

    return successResponse(
      {
        staff: {
          ...staff,
          password: undefined,
        },
        credentials: {
          email: staff.email,
          temporaryPassword: password,
          mustChangePassword: true,
        },
      },
      201
    );
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return errorResponse("Failed to create staff member", [], 500);
  }
}

// PUT - Update staff member with enhanced validation
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Staff ID is required",
          code: "REQUIRED",
        }],
        400
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return errorResponse(
        "Staff not found",
        [{
          field: "id",
          message: "Staff member does not exist",
          code: "NOT_FOUND",
        }],
        404
      );
    }

    // Sanitize update data
    const allowedFields = [
      "name",
      "phone",
      "role",
      "department",
      "shift",
      "status",
      "salary",
      "avatar",
      "branchId",
    ];

    const updateData: any = {};
    Object.keys(updateFields).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (key === "role") {
          updateData[key] = updateFields[key].toUpperCase();
        } else if (key === "salary") {
          updateData[key] = parseFloat(updateFields[key]);
        } else {
          updateData[key] = updateFields[key];
        }
      }
    });

    // Handle password update separately
    if (updateFields.password) {
      updateData.password = await hashPassword(updateFields.password);
      updateData.mustChangePassword = false;
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        _count: {
          select: {
            ordersCreated: true,
            activityLogs: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: staff.id,
        branchId: staff.branchId,
        action: "update",
        entity: "staff",
        entityId: staff.id,
        details: {
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return successResponse({
      staff: {
        ...staff,
        password: undefined,
      },
    });
  } catch (error: any) {
    console.error("Error updating staff:", error);
    return errorResponse("Failed to update staff member", [], 500);
  }
}

// DELETE - Permanently delete staff member from database
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return errorResponse(
        "Validation failed",
        [{
          field: "id",
          message: "Staff ID is required",
          code: "REQUIRED",
        }],
        400
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ordersCreated: true,
          },
        },
      },
    });

    if (!existingStaff) {
      return errorResponse(
        "Staff not found",
        [{
          field: "id",
          message: "Staff member does not exist",
          code: "NOT_FOUND",
        }],
        404
      );
    }

    if (existingStaff.role === "SUPER_ADMIN") {
      return errorResponse(
        "Cannot delete super admin",
        [{
          field: "role",
          message: "Super admin accounts cannot be deleted",
          code: "FORBIDDEN",
        }],
        403
      );
    }

    // Check for active orders
    const activeOrders = await prisma.order.count({
      where: {
        performedBy: id,
        status: { in: ["pending", "preparing", "ready"] },
      },
    });

    if (activeOrders > 0) {
      return errorResponse(
        "Cannot delete staff",
        [{
          field: "orders",
          message: `Staff has ${activeOrders} active order(s)`,
          code: "HAS_ACTIVE_ORDERS",
        }],
        400
      );
    }

    // Log activity before deletion
    await prisma.activityLog.create({
      data: {
        userId: id,
        branchId: existingStaff.branchId,
        action: permanent ? "permanent_delete" : "delete",
        entity: "staff",
        entityId: id,
        details: {
          name: existingStaff.name,
          email: existingStaff.email,
          role: existingStaff.role,
        },
      },
    });

    if (permanent) {
      // Permanent delete - remove from database
      await prisma.staff.delete({
        where: { id },
      });
      return successResponse({ message: "Staff member permanently deleted" });
    } else {
      // Soft delete - set status to inactive
      await prisma.staff.update({
        where: { id },
        data: { status: "inactive" },
      });
      return successResponse({ message: "Staff member deactivated" });
    }
  } catch (error: any) {
    console.error("Error deleting staff:", error);
    return errorResponse("Failed to delete staff member", [], 500);
  }
}