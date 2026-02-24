import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager, canAssignManagers } from "@/lib/auth";

// GET - Fetch all managers or managers for a specific branch
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can access this
    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    let managers: any[];

    if (branchId) {
      // Get managers assigned to a specific branch
      managers = await prisma.$queryRaw`
        SELECT s.*, b.name as branch_name 
        FROM staff s 
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.role IN ('MANAGER', 'BRANCH_MANAGER') 
          AND s.branch_id = ${branchId}
          AND s.status = 'active'
        ORDER BY s.name ASC
      ` as any[];
    } else {
      // Get all managers
      managers = await prisma.$queryRaw`
        SELECT s.*, b.name as branch_name 
        FROM staff s 
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.role IN ('MANAGER', 'BRANCH_MANAGER')
        ORDER BY s.name ASC
      ` as any[];
    }

    // Also get branches with their assigned managers
    const branchesWithManagers = await prisma.$queryRaw`
      SELECT b.*, 
             s.id as manager_id, 
             s.name as manager_name, 
             s.email as manager_email,
             s.phone as manager_phone
      FROM branches b
      LEFT JOIN staff s ON b.manager_id = s.id AND s.status = 'active'
      ORDER BY b.name ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      managers,
      branches: branchesWithManagers,
      count: managers.length
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json({ error: "Failed to fetch managers" }, { status: 500 });
  }
}

// POST - Create a new manager and optionally assign to a branch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can create managers
    if (!canAssignManagers(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admin/super manager can create managers" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      password, 
      role = "BRANCH_MANAGER", 
      department = "Management",
      branchId,
      shift 
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Validate role
    if (!["MANAGER", "BRANCH_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be MANAGER or BRANCH_MANAGER" }, { status: 400 });
    }

    // Check if email already exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id FROM staff WHERE email = ${email} LIMIT 1
    ` as any[];

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Generate a default password
      const defaultPassword = `${email.split('@')[0]}123`;
      hashedPassword = await bcrypt.hash(defaultPassword, 10);
    }

    // Create manager staff member
    const managerId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
      VALUES (
        ${managerId},
        ${name},
        ${email},
        ${phone || null},
        ${role},
        ${department},
        ${shift || null},
        'active',
        ${hashedPassword},
        ${branchId || null},
        NOW(),
        NOW(),
        NOW()
      )
    `;

    // If branchId is provided, assign this manager to the branch
    if (branchId) {
      await prisma.$executeRaw`
        UPDATE branches SET manager_id = ${managerId}, updated_at = NOW() WHERE id = ${branchId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Manager created successfully",
      managerId,
      defaultPassword: password ? undefined : `${email.split('@')[0]}123`
    });
  } catch (error) {
    console.error("Error creating manager:", error);
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}

// PUT - Assign/update manager for a branch
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can assign managers
    if (!canAssignManagers(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admin/super manager can assign managers" }, { status: 403 });
    }

    const body = await req.json();
    const { branchId, managerId, action } = body;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Check if branch exists
    const existingBranch = await prisma.$queryRaw`
      SELECT id, name, manager_id FROM branches WHERE id = ${branchId} LIMIT 1
    ` as any[];

    if (existingBranch.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const branch = existingBranch[0];

    if (action === "assign") {
      // Assign manager to branch
      if (!managerId) {
        return NextResponse.json({ error: "Manager ID is required for assign action" }, { status: 400 });
      }

      // Check if manager exists and has manager role
      const manager = await prisma.$queryRaw`
        SELECT id, name, role, branch_id FROM staff WHERE id = ${managerId} AND role IN ('MANAGER', 'BRANCH_MANAGER') LIMIT 1
      ` as any[];

      if (manager.length === 0) {
        return NextResponse.json({ error: "Manager not found or invalid role" }, { status: 404 });
      }

      // If manager is already assigned to another branch, remove them from that branch
      if (manager[0].branch_id && manager[0].branch_id !== branchId) {
        await prisma.$executeRaw`
          UPDATE branches SET manager_id = NULL, updated_at = NOW() WHERE id = ${manager[0].branch_id}
        `;
      }

      // Update manager's branch
      await prisma.$executeRaw`
        UPDATE staff SET branch_id = ${branchId}, updated_at = NOW() WHERE id = ${managerId}
      `;

      // Assign manager to branch
      await prisma.$executeRaw`
        UPDATE branches SET manager_id = ${managerId}, updated_at = NOW() WHERE id = ${branchId}
      `;

      return NextResponse.json({
        success: true,
        message: `Manager assigned to ${branch.name} successfully`
      });

    } else if (action === "unassign") {
      // Unassign manager from branch
      if (branch.manager_id) {
        // Remove manager from branch
        await prisma.$executeRaw`
          UPDATE branches SET manager_id = NULL, updated_at = NOW() WHERE id = ${branchId}
        `;

        return NextResponse.json({
          success: true,
          message: `Manager unassigned from ${branch.name} successfully`
        });
      } else {
        return NextResponse.json({ error: "No manager assigned to this branch" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'assign' or 'unassign'" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error assigning manager:", error);
    return NextResponse.json({ error: "Failed to assign manager" }, { status: 500 });
  }
}

// DELETE - Delete a manager
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin can delete managers
    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admin/super manager can delete managers" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Manager ID is required" }, { status: 400 });
    }

    // Check if manager exists
    const existingManager = await prisma.$queryRaw`
      SELECT id, name, role FROM staff WHERE id = ${id} AND role IN ('MANAGER', 'BRANCH_MANAGER') LIMIT 1
    ` as any[];

    if (existingManager.length === 0) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    // Remove manager from any branches they're assigned to
    await prisma.$executeRaw`
      UPDATE branches SET manager_id = NULL, updated_at = NOW() WHERE manager_id = ${id}
    `;

    // Delete manager (soft delete by setting status to inactive)
    await prisma.$executeRaw`
      UPDATE staff SET status = 'inactive', updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Manager deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting manager:", error);
    return NextResponse.json({ error: "Failed to delete manager" }, { status: 500 });
  }
}
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager, canAssignManagers } from "@/lib/auth";

// GET - Fetch all managers or managers for a specific branch
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can access this
    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    let managers: any[];

    if (branchId) {
      // Get managers assigned to a specific branch
      managers = await prisma.$queryRaw`
        SELECT s.*, b.name as branch_name 
        FROM staff s 
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.role IN ('MANAGER', 'BRANCH_MANAGER') 
          AND s.branch_id = ${branchId}
          AND s.status = 'active'
        ORDER BY s.name ASC
      ` as any[];
    } else {
      // Get all managers
      managers = await prisma.$queryRaw`
        SELECT s.*, b.name as branch_name 
        FROM staff s 
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE s.role IN ('MANAGER', 'BRANCH_MANAGER')
        ORDER BY s.name ASC
      ` as any[];
    }

    // Also get branches with their assigned managers
    const branchesWithManagers = await prisma.$queryRaw`
      SELECT b.*, 
             s.id as manager_id, 
             s.name as manager_name, 
             s.email as manager_email,
             s.phone as manager_phone
      FROM branches b
      LEFT JOIN staff s ON b.manager_id = s.id AND s.status = 'active'
      ORDER BY b.name ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      managers,
      branches: branchesWithManagers,
      count: managers.length
    });
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json({ error: "Failed to fetch managers" }, { status: 500 });
  }
}

// POST - Create a new manager and optionally assign to a branch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can create managers
    if (!canAssignManagers(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admin/super manager can create managers" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      password, 
      role = "BRANCH_MANAGER", 
      department = "Management",
      branchId,
      shift 
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Validate role
    if (!["MANAGER", "BRANCH_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be MANAGER or BRANCH_MANAGER" }, { status: 400 });
    }

    // Check if email already exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id FROM staff WHERE email = ${email} LIMIT 1
    ` as any[];

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Generate a default password
      const defaultPassword = `${email.split('@')[0]}123`;
      hashedPassword = await bcrypt.hash(defaultPassword, 10);
    }

    // Create manager staff member
    const managerId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
      VALUES (
        ${managerId},
        ${name},
        ${email},
        ${phone || null},
        ${role},
        ${department},
        ${shift || null},
        'active',
        ${hashedPassword},
        ${branchId || null},
        NOW(),
        NOW(),
        NOW()
      )
    `;

    // If branchId is provided, assign this manager to the branch
    if (branchId) {
      await prisma.$executeRaw`
        UPDATE branches SET manager_id = ${managerId}, updated_at = NOW() WHERE id = ${branchId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Manager created successfully",
      managerId,
      defaultPassword: password ? undefined : `${email.split('@')[0]}123`
    });
  } catch (error) {
    console.error("Error creating manager:", error);
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}

// PUT - Assign/update manager for a branch
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can assign managers
    if (!canAssignManagers(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admin/super manager can assign managers" }, { status: 403 });
    }

    const body = await req.json();
    const { branchId, managerId, action } = body;

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Check if branch exists
    const existingBranch = await prisma.$queryRaw`
      SELECT id, name, manager_id FROM branches WHERE id = ${branchId} LIMIT 1
    ` as any[];

    if (existingBranch.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const branch = existingBranch[0];

    if (action === "assign") {
      // Assign manager to branch
      if (!managerId) {
        return NextResponse.json({ error: "Manager ID is required for assign action" }, { status: 400 });
      }

      // Check if manager exists and has manager role
      const manager = await prisma.$queryRaw`
        SELECT id, name, role, branch_id FROM staff WHERE id = ${managerId} AND role IN ('MANAGER', 'BRANCH_MANAGER') LIMIT 1
      ` as any[];

      if (manager.length === 0) {
        return NextResponse.json({ error: "Manager not found or invalid role" }, { status: 404 });
      }

      // If manager is already assigned to another branch, remove them from that branch
      if (manager[0].branch_id && manager[0].branch_id !== branchId) {
        await prisma.$executeRaw`
          UPDATE branches SET manager_id = NULL, updated_at = NOW() WHERE id = ${manager[0].branch_id}
        `;
      }

      // Update manager's branch
      await prisma.$executeRaw`
        UPDATE staff SET branch_id = ${branchId}, updated_at = NOW() WHERE id = ${managerId}
      `;

      // Assign manager to branch
      await prisma.$executeRaw`
        UPDATE branches SET manager_id = ${managerId}, updated_at = NOW() WHERE id = ${branchId}
      `;

      return NextResponse.json({
        success: true,
        message: `Manager assigned to ${branch.name} successfully`
      });

    } else if (action === "unassign") {
      // Unassign manager from branch
      if (branch.manager_id) {
        // Remove manager from branch
        await prisma.$executeRaw`
          UPDATE branches SET manager_id = NULL, updated_at = NOW() WHERE id = ${branchId}
        `;

        return NextResponse.json({
          success: true,
          message: `Manager unassigned from ${branch.name} successfully`
        });
      } else {
        return NextResponse.json({ error: "No manager assigned to this branch" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'assign' or 'unassign'" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error assigning manager:", error);
    return NextResponse.json({ error: "Failed to assign manager" }, { status: 500 });
  }
}

// DELETE - Delete a manager
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin can delete managers
    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admin/super manager can delete managers" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Manager ID is required" }, { status: 400 });
    }

    // Check if manager exists
    const existingManager = await prisma.$queryRaw`
      SELECT id, name, role FROM staff WHERE id = ${id} AND role IN ('MANAGER', 'BRANCH_MANAGER') LIMIT 1
    ` as any[];

    if (existingManager.length === 0) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    // Remove manager from any branches they're assigned to
    await prisma.$executeRaw`
      UPDATE branches SET manager_id = NULL, updated_at = NOW() WHERE manager_id = ${id}
    `;

    // Delete manager (soft delete by setting status to inactive)
    await prisma.$executeRaw`
      UPDATE staff SET status = 'inactive', updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Manager deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting manager:", error);
    return NextResponse.json({ error: "Failed to delete manager" }, { status: 500 });
  }
}

