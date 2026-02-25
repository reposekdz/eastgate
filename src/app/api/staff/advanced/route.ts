import { NextRequest, NextResponse } from "next/server";
import * as auth from "@/lib/auth-advanced";
import { successResponse, errorResponse, validateRequestBody } from "@/lib/validators";
import { ROLE_DEFINITIONS } from "@/lib/rbac-system";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Local password strength validator to avoid runtime export issues
function validatePasswordStrengthLocal(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  return { valid: errors.length === 0, errors };
}
/**
 * POST /api/staff/advanced/create
 * Create new staff member with full validation - requires auth
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return errorResponse("Unauthorized", [{ field: "auth", message: "No token provided", code: "UNAUTHORIZED" }], 401);
    }

    const session = auth.verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", [{ field: "auth", message: "Invalid token", code: "UNAUTHORIZED" }], 401);
    }

    // Only managers and admins can create staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return errorResponse("Unauthorized", [{ field: "permission", message: "You cannot create staff members", code: "FORBIDDEN" }], 403);
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
    const passwordValidation = validatePasswordStrengthLocal(body.password);
    if (!passwordValidation.valid) {
      return errorResponse("Weak password", [{ field: "password", message: passwordValidation.errors?.[0] || "Password is too weak", code: "WEAK_PASSWORD" }], 400);
    }

    // Verify role exists
    if (!ROLE_DEFINITIONS[body.role as keyof typeof ROLE_DEFINITIONS]) {
      return errorResponse("Invalid role", [{ field: "role", message: "Role does not exist", code: "INVALID_ROLE" }], 400);
    }

    // Check if email exists
    const existingStaff = await prisma.staff.findFirst({
      where: { email: body.email },
    });

    if (existingStaff) {
      return errorResponse("Staff already exists", [{ field: "email", message: "Email already in use", code: "DUPLICATE_EMAIL" }], 400);
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId },
    });

    if (!branch) {
      return errorResponse("Branch not found", [{ field: "branchId", message: "Branch does not exist", code: "NOT_FOUND" }], 404);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        password: hashedPassword,
        role: body.role,
        department: body.department || "General",
        shift: body.shift || "day",
        status: "active",
        branchId: body.branchId,
        hireDate: new Date(),
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
        branch: { select: { id: true, name: true } },
      },
    });

    return successResponse({ staff }, 201);
  } catch (error: unknown) {
    console.error("Staff creation error:", error);
    const message = error instanceof Error ? error.message : 'Failed to create staff member';
    return errorResponse("Failed to create staff member", [{ field: "error", message, code: "SERVER_ERROR" }], 500);
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
      return errorResponse("Unauthorized", [{ field: "auth", message: "No token provided", code: "UNAUTHORIZED" }], 401);
    }

    const session = auth.verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", [{ field: "auth", message: "Invalid token", code: "UNAUTHORIZED" }], 401);
    }

    // Only managers and admins can update staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return errorResponse("Unauthorized", [{ field: "permission", message: "You cannot update staff members", code: "FORBIDDEN" }], 403);
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
      return errorResponse("Staff not found", [{ field: "staffId", message: "Staff member does not exist", code: "NOT_FOUND" }], 404);
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;
    if (body.role) {
      if (!ROLE_DEFINITIONS[body.role as keyof typeof ROLE_DEFINITIONS]) {
        return errorResponse("Invalid role", [{ field: "role", message: "Role does not exist", code: "INVALID_ROLE" }], 400);
      }
      updateData.role = body.role;
    }
    if (body.department) updateData.department = body.department;
    if (body.shift) updateData.shift = body.shift;
    if (body.status) updateData.status = body.status;
    if (body.password) {
      const passwordValidation = validatePasswordStrengthLocal(body.password);
      if (!passwordValidation.valid) {
        return errorResponse("Weak password", [{ field: "password", message: passwordValidation.errors?.[0] || "Password is too weak", code: "WEAK_PASSWORD" }], 400);
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
        branch: { select: { id: true, name: true } },
      },
    });

    return successResponse({ staff: updatedStaff });
  } catch (error: unknown) {
    console.error("Staff update error:", error);
    const message = error instanceof Error ? error.message : 'Failed to update staff member';
    return errorResponse("Failed to update staff member", [{ field: "error", message, code: "SERVER_ERROR" }], 500);
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
      return errorResponse("Unauthorized", [{ field: "auth", message: "No token provided", code: "UNAUTHORIZED" }], 401);
    }

    const session = auth.verifyToken(token, "access");
    if (!session) {
      return errorResponse("Unauthorized", [{ field: "auth", message: "Invalid token", code: "UNAUTHORIZED" }], 401);
    }

    // Only managers and admins can delete staff
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return errorResponse("Unauthorized", [{ field: "permission", message: "You cannot delete staff members", code: "FORBIDDEN" }], 403);
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("id");

    if (!staffId) {
      return errorResponse("Missing parameter", [{ field: "id", message: "Staff ID is required", code: "REQUIRED" }], 400);
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return errorResponse("Staff not found", [{ field: "staffId", message: "Staff member does not exist", code: "NOT_FOUND" }], 404);
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

      return successResponse({ staff: deactivatedStaff });
    } catch (error: unknown) {
      console.error("Staff deactivation error:", error);
      const message = error instanceof Error ? error.message : 'Failed to deactivate staff member';
      return errorResponse("Failed to deactivate staff member", [{ field: "error", message, code: "SERVER_ERROR" }], 500);
    }
  }