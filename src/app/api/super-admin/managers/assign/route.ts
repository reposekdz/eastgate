import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";
import { hashPassword } from "@/lib/auth-advanced";

/**
 * POST /api/super-admin/managers/assign
 * Super admin assigns manager(s) to branch(es)
 * Only SUPER_ADMIN can access
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      manager_id,
      branch_ids, // array of branch IDs
      can_manage_menu = true,
      can_manage_staff = true,
      can_manage_revenue = true,
      permissions = [],
      notes,
    } = body;

    if (!manager_id || !branch_ids || !Array.isArray(branch_ids)) {
      return NextResponse.json(
        { success: false, error: "Manager ID and branch IDs required" },
        { status: 400 }
      );
    }

    // Verify manager exists
    const manager = await prisma.manager.findUnique({
      where: { id: manager_id },
    });

    if (!manager) {
      return NextResponse.json(
        { success: false, error: "Manager not found" },
        { status: 404 }
      );
    }

    // Verify all branches exist
    const branches = await prisma.branch.findMany({
      where: { id: { in: branch_ids } },
    });

    if (branches.length !== branch_ids.length) {
      return NextResponse.json(
        { success: false, error: "One or more branches not found" },
        { status: 404 }
      );
    }

    // Remove existing assignments for this manager
    await prisma.managerAssignment.deleteMany({
      where: { managerId: manager_id },
    });

    // Create new assignments
    const assignments = await Promise.all(
      branch_ids.map((branchId: string) =>
        prisma.managerAssignment.create({
          data: {
            managerId: manager_id,
            branchId,
            assignedBy: session.id,
            canManageMenu: can_manage_menu,
            canManageStaff: can_manage_staff,
            canManageRevenue: can_manage_revenue,
            permissions,
            notes,
            isActive: true,
          },
          include: { branch: true, manager: true },
        })
      )
    );

    // Update manager total branches
    await prisma.manager.update({
      where: { id: manager_id },
      data: { totalBranches: branch_ids.length },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId: session.branchId || "",
        action: "manager_assigned",
        entity: "manager",
        entityId: manager_id,
        details: {
          branches: branch_ids,
          permissions: [can_manage_menu, can_manage_staff, can_manage_revenue],
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          manager: {
            id: manager.id,
            name: manager.name,
            email: manager.email,
            level: manager.level,
            totalBranches: branch_ids.length,
          },
          assignments: assignments.map((a) => ({
            id: a.id,
            branchId: a.branchId,
            branchName: a.branch.name,
            permissions: {
              canManageMenu: a.canManageMenu,
              canManageStaff: a.canManageStaff,
              canManageRevenue: a.canManageRevenue,
            },
            isActive: a.isActive,
          })),
        },
        message: `Manager assigned to ${branch_ids.length} branch(es)`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Manager assignment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign manager" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/super-admin/managers
 * Get all managers with their branch assignments  
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const isActive = searchParams.get("isActive") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const where: any = {};
    if (level) where.level = level;
    if (isActive !== null) where.isActive = isActive;

    const [managers, total] = await Promise.all([
      prisma.manager.findMany({
        where,
        include: {
          assignments: {
            include: { branch: true },
            where: { isActive: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.manager.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: managers.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          avatar: m.avatar,
          level: m.level,
          isActive: m.isActive,
          totalBranches: m.totalBranches,
          lastLogin: m.lastLogin,
          loginCount: m.loginCount,
          branches: m.assignments.map((a) => ({
            id: a.branch.id,
            name: a.branch.name,
            slug: a.branch.slug,
            permissions: {
              canManageMenu: a.canManageMenu,
              canManageStaff: a.canManageStaff,
              canManageRevenue: a.canManageRevenue,
            },
          })),
          createdAt: m.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Manager fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
