/**
 * Admin API: Assign Branch Managers
 * Super Admin and Super Manager can assign/create managers for branches
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { getCurrentUser } from "@/lib/auth-advanced";
import { hashPassword } from "@/lib/auth-advanced";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", [], 401);

    const isSuperUser = user.role === "SUPER_ADMIN" || user.role === "SUPER_MANAGER";
    if (!isSuperUser) {
      return errorResponse("Only Super Admin/Super Manager can assign managers", [], 403);
    }

    const body = await req.json();
    const { staffId, branchId, name, email, phone } = body;

    if (!branchId || (!staffId && !email)) {
      return errorResponse("Branch ID and either staffId or email is required", [], 400);
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return errorResponse("Branch not found", [], 404);
    }

    let manager;

    if (staffId) {
      // Assign existing staff member as manager
      const staff = await prisma.staff.findUnique({ where: { id: staffId } });
      if (!staff) {
        return errorResponse("Staff member not found", [], 404);
      }

      manager = await prisma.staff.update({
        where: { id: staffId },
        data: {
          role: "BRANCH_MANAGER",
          branchId,
        },
      });
    } else {
      // Create new manager
      if (!email || !name) {
        return errorResponse("Email and name required for new manager", [], 400);
      }

      const existingEmail = await prisma.staff.findUnique({ where: { email } });
      if (existingEmail) {
        return errorResponse("Email already exists", [], 409);
      }

      const hashedPassword = await hashPassword("2026");
      manager = await prisma.staff.create({
        data: {
          name,
          email,
          phone: phone || null,
          role: "BRANCH_MANAGER",
          department: "Management",
          shift: "Morning",
          status: "active",
          password: hashedPassword,
          branchId,
        },
      });
    }

    // Update branch manager
    await prisma.branch.update({
      where: { id: branchId },
      data: { managerId: manager.id },
    });

    return successResponse({
      manager,
      branch: {
        id: branch.id,
        name: branch.name,
      },
      message: `${name || manager.name} assigned as manager of ${branch.name}`,
    }, 201);
  } catch (error: any) {
    console.error("Manager assignment error:", error);
    return errorResponse("Failed to assign manager", [], 500);
  }
}

/**
 * GET /api/admin/assign-managers
 * Get all branch managers
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", [], 401);

    const isSuperUser = user.role === "SUPER_ADMIN" || user.role === "SUPER_MANAGER";
    if (!isSuperUser) {
      return errorResponse("Only Super Admin/Super Manager can view managers", [], 403);
    }

    const managers = await prisma.staff.findMany({
      where: { role: "BRANCH_MANAGER" },
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

    return successResponse({ managers });
  } catch (error: any) {
    console.error("Manager fetch error:", error);
    return errorResponse("Failed to fetch managers", [], 500);
  }
}
