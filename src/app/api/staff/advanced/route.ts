import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-advanced";
import { hashPassword, validatePasswordStrength } from "@/lib/auth-advanced";
import { successResponse, errorResponse, validateRequestBody } from "@/lib/validators";
import { ROLE_DEFINITIONS } from "@/lib/rbac-system";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/staff/advanced/create
 * Create new staff member with full validation - requires auth
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    // Only managers and admins can create staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return errorResponse("Unauthorized", { permission: "You cannot create staff members" }, 403);
    }

    const { data: body, errors } = await validateRequestBody<{
      name: string;
      email: string;
      phone?: string;
      role: string;
      department?: string;
      shift?: string;
      password: string;
      branchId: string;
    }>(req, ["name", "email", "role", "password", "branchId"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(body.password);
    if (!passwordValidation.valid) {
      return errorResponse("Weak password", { password: passwordValidation.error }, 400);
    }

    // Verify role exists
    if (!ROLE_DEFINITIONS[body.role as keyof typeof ROLE_DEFINITIONS]) {
      return errorResponse("Invalid role", { role: "Role does not exist" }, 400);
    }

    // Check if email exists
    const existingStaff = await prisma.staff.findFirst({
      where: { email: body.email },
    });

    if (existingStaff) {
      return errorResponse("Staff already exists", { email: "Email already in use" }, 400);
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId },
    });

    if (!branch) {
      return errorResponse("Branch not found", { branchId: "Branch does not exist" }, 404);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
        role: body.role,
        department: body.department,
        shift: body.shift || "day",
        status: "active",
        branchId: body.branchId,
        joinDate: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        shift: true,
        status: true,
        joinDate: true,
        branch: { select: { id: true, name: true } },
      },
    });

    return successResponse("Staff member created successfully", { staff }, 201);
  } catch (error: any) {
    console.error("Staff creation error:", error);
    return errorResponse("Failed to create staff member", { error: error.message }, 500);
  }
}

/**
 * PUT /api/staff/advanced/:id
 * Update staff member - requires auth
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    // Only managers and admins can update staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return errorResponse("Unauthorized", { permission: "You cannot update staff members" }, 403);
    }

    const { data: body, errors } = await validateRequestBody<{
      id: string;
      name?: string;
      phone?: string;
      role?: string;
      department?: string;
      shift?: string;
      status?: string;
      password?: string;
    }>(req, ["id"]);

    if (!body) {
      return errorResponse("Validation failed", errors, 400);
    }

    const staff = await prisma.staff.findUnique({ where: { id: body.id } });
    if (!staff) {
      return errorResponse("Staff not found", { staffId: "Staff member does not exist" }, 404);
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.role) {
      if (!ROLE_DEFINITIONS[body.role as keyof typeof ROLE_DEFINITIONS]) {
        return errorResponse("Invalid role", { role: "Role does not exist" }, 400);
      }
      updateData.role = body.role;
    }
    if (body.department) updateData.department = body.department;
    if (body.shift) updateData.shift = body.shift;
    if (body.status) updateData.status = body.status;
    if (body.password) {
      const passwordValidation = validatePasswordStrength(body.password);
      if (!passwordValidation.valid) {
        return errorResponse("Weak password", { password: passwordValidation.error }, 400);
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: body.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        shift: true,
        status: true,
        joinDate: true,
        branch: { select: { id: true, name: true } },
      },
    });

    return successResponse("Staff member updated successfully", { staff: updatedStaff });
  } catch (error: any) {
    console.error("Staff update error:", error);
    return errorResponse("Failed to update staff member", { error: error.message }, 500);
  }
}

/**
 * DELETE /api/staff/advanced/:id
 * Deactivate staff member - requires auth
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", { auth: "No token provided" }, 401);
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", { auth: "Invalid token" }, 401);
    }

    // Only managers and admins can delete staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return errorResponse("Unauthorized", { permission: "You cannot delete staff members" }, 403);
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("id");

    if (!staffId) {
      return errorResponse("Missing parameter", { id: "Staff ID is required" }, 400);
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return errorResponse("Staff not found", { staffId: "Staff member does not exist" }, 404);
    }

    // Deactivate instead of delete
    const deactivatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: { status: "inactive", lastLogin: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return successResponse("Staff member deactivated successfully", { staff: deactivatedStaff });
  } catch (error: any) {
    console.error("Staff deactivation error:", error);
    return errorResponse("Failed to deactivate staff member", { error: error.message }, 500);
  }
}
