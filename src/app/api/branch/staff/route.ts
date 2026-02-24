import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isBranchManager, isManager, isSuperAdminOrManager, hasPermission } from "@/lib/auth";

// GET - Fetch staff members for the branch (only for branch managers)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Check permissions - branch managers, managers, and super admin/super manager can access
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole) && !isManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || userBranchId;
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const department = searchParams.get("department");
    const search = searchParams.get("search");

    // Build query - only show staff for the branch (or all if super admin)
    let staff: any[];

    const branchFilter = isSuperAdminOrManager(userRole) && branchId ? 
      `branch_id = '${branchId}'` : 
      `branch_id = '${userBranchId}'`;

    const statusFilter = status ? `AND status = '${status}'` : '';
    const roleFilter = role ? `AND role = '${role}'` : '';
    const deptFilter = department ? `AND department = '${department}'` : '';
    const searchFilter = search ? 
      `AND (name LIKE '%${search}%' OR email LIKE '%${search}%' OR phone LIKE '%${search}%')` : '';

    staff = await prisma.$queryRaw`
      SELECT * FROM staff
      WHERE ${branchFilter} ${statusFilter} ${roleFilter} ${deptFilter} ${searchFilter}
      ORDER BY created_at DESC
    ` as any[];

    // Get counts by role
    const roleCounts = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count 
      FROM staff 
      WHERE branch_id = ${isSuperAdminOrManager(userRole) && branchId ? branchId : userBranchId}
      GROUP BY role
    ` as any[];

    // Get available staff for assignment (staff that can be assigned to orders, etc.)
    const availableStaff = await prisma.$queryRaw`
      SELECT id, name, role, department, shift, status 
      FROM staff 
      WHERE branch_id = ${isSuperAdminOrManager(userRole) && branchId ? branchId : userBranchId}
        AND status = 'active'
        AND role IN ('WAITER', 'RECEPTIONIST', 'CHEF', 'KITCHEN_STAFF')
      ORDER BY name ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      staff,
      roleCounts: roleCounts.reduce((acc: any, curr: any) => {
        acc[curr.role] = curr.count;
        return acc;
      }, {}),
      availableStaff,
      count: staff.length
    });
  } catch (error) {
    console.error("Error fetching branch staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST - Create new staff (waiter, receptionist, kitchen) - Branch managers only
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only branch managers can add staff (or super admin/super manager)
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ 
        error: "Forbidden - Only branch managers can add staff to their branch" 
      }, { status: 403 });
    }

    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      role, 
      department, 
      shift, 
      password,
      branchId 
    } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    // Allowed roles for branch manager to create
    const allowedRoles = ['WAITER', 'RECEPTIONIST', 'CHEF', 'KITCHEN_STAFF', 'STAFF'];
    
    // Branch managers can only create certain roles
    if (isBranchManager(userRole) && !allowedRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Branch managers can only create: ${allowedRoles.join(', ')}` 
      }, { status: 403 });
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

    // Determine branch ID - use provided branchId only if super admin
    let finalBranchId = userBranchId;
    if (branchId && isSuperAdminOrManager(userRole)) {
      finalBranchId = branchId;
    }

    // Create staff member
    const staffId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
      VALUES (
        ${staffId},
        ${name},
        ${email},
        ${phone || null},
        ${role},
        ${department || getDefaultDepartment(role)},
        ${shift || null},
        'active',
        ${hashedPassword},
        ${finalBranchId},
        NOW(),
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: `${role} staff member created successfully`,
      staffId,
      defaultPassword: password ? undefined : `${email.split('@')[0]}123`
    });
  } catch (error) {
    console.error("Error creating branch staff:", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

// PUT - Update staff member
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only branch managers can update their branch's staff
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ 
        error: "Forbidden - Only branch managers can update staff in their branch" 
      }, { status: 403 });
    }

    const body = await req.json();
    const { 
      id, 
      name, 
      email, 
      phone, 
      role, 
      department, 
      shift, 
      status, 
      password 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Check if staff exists and belongs to the branch
    const existingStaff = await prisma.$queryRaw`
      SELECT id, branch_id, role FROM staff WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingStaff.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const staff = existingStaff[0];

    // Verify branch access
    if (!isSuperAdminOrManager(userRole) && staff.branch_id !== userBranchId) {
      return NextResponse.json({ error: "Cannot update staff from other branches" }, { status: 403 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push("name = ?"); values.push(name); }
    if (email) { updates.push("email = ?"); values.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
    if (role) { updates.push("role = ?"); values.push(role); }
    if (department) { updates.push("department = ?"); values.push(department); }
    if (shift !== undefined) { updates.push("shift = ?"); values.push(shift); }
    if (status) { updates.push("status = ?"); values.push(status); }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    // Execute raw update
    const setClause = updates.slice(0, -1).join(", ");
    await prisma.$executeRawUnsafe(
      `UPDATE staff SET ${setClause} WHERE id = ?`,
      ...values.slice(0, -1)
    );

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully"
    });
  } catch (error) {
    console.error("Error updating branch staff:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

// DELETE - Delete/deactivate staff member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only branch managers and super admin can delete staff
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ 
        error: "Forbidden - Only branch managers can remove staff from their branch" 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Check if staff exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id, branch_id FROM staff WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingStaff.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const staff = existingStaff[0];

    // Verify branch access
    if (!isSuperAdminOrManager(userRole) && staff.branch_id !== userBranchId) {
      return NextResponse.json({ error: "Cannot delete staff from other branches" }, { status: 403 });
    }

    // Soft delete - set status to inactive
    await prisma.$executeRaw`
      UPDATE staff SET status = 'inactive', updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Staff member removed successfully"
    });
  } catch (error) {
    console.error("Error deleting branch staff:", error);
    return NextResponse.json({ error: "Failed to remove staff member" }, { status: 500 });
  }
}

// Helper function to get default department based on role
function getDefaultDepartment(role: string): string {
  switch (role) {
    case 'WAITER':
      return 'Restaurant';
    case 'RECEPTIONIST':
      return 'Front Desk';
    case 'CHEF':
      return 'Kitchen';
    case 'KITCHEN_STAFF':
      return 'Kitchen';
    default:
      return 'General';
  }
}
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isBranchManager, isManager, isSuperAdminOrManager, hasPermission } from "@/lib/auth";

// GET - Fetch staff members for the branch (only for branch managers)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Check permissions - branch managers, managers, and super admin/super manager can access
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole) && !isManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || userBranchId;
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const department = searchParams.get("department");
    const search = searchParams.get("search");

    // Build query - only show staff for the branch (or all if super admin)
    let staff: any[];

    const branchFilter = isSuperAdminOrManager(userRole) && branchId ? 
      `branch_id = '${branchId}'` : 
      `branch_id = '${userBranchId}'`;

    const statusFilter = status ? `AND status = '${status}'` : '';
    const roleFilter = role ? `AND role = '${role}'` : '';
    const deptFilter = department ? `AND department = '${department}'` : '';
    const searchFilter = search ? 
      `AND (name LIKE '%${search}%' OR email LIKE '%${search}%' OR phone LIKE '%${search}%')` : '';

    staff = await prisma.$queryRaw`
      SELECT * FROM staff
      WHERE ${branchFilter} ${statusFilter} ${roleFilter} ${deptFilter} ${searchFilter}
      ORDER BY created_at DESC
    ` as any[];

    // Get counts by role
    const roleCounts = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count 
      FROM staff 
      WHERE branch_id = ${isSuperAdminOrManager(userRole) && branchId ? branchId : userBranchId}
      GROUP BY role
    ` as any[];

    // Get available staff for assignment (staff that can be assigned to orders, etc.)
    const availableStaff = await prisma.$queryRaw`
      SELECT id, name, role, department, shift, status 
      FROM staff 
      WHERE branch_id = ${isSuperAdminOrManager(userRole) && branchId ? branchId : userBranchId}
        AND status = 'active'
        AND role IN ('WAITER', 'RECEPTIONIST', 'CHEF', 'KITCHEN_STAFF')
      ORDER BY name ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      staff,
      roleCounts: roleCounts.reduce((acc: any, curr: any) => {
        acc[curr.role] = curr.count;
        return acc;
      }, {}),
      availableStaff,
      count: staff.length
    });
  } catch (error) {
    console.error("Error fetching branch staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST - Create new staff (waiter, receptionist, kitchen) - Branch managers only
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only branch managers can add staff (or super admin/super manager)
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ 
        error: "Forbidden - Only branch managers can add staff to their branch" 
      }, { status: 403 });
    }

    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      role, 
      department, 
      shift, 
      password,
      branchId 
    } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    // Allowed roles for branch manager to create
    const allowedRoles = ['WAITER', 'RECEPTIONIST', 'CHEF', 'KITCHEN_STAFF', 'STAFF'];
    
    // Branch managers can only create certain roles
    if (isBranchManager(userRole) && !allowedRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Branch managers can only create: ${allowedRoles.join(', ')}` 
      }, { status: 403 });
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

    // Determine branch ID - use provided branchId only if super admin
    let finalBranchId = userBranchId;
    if (branchId && isSuperAdminOrManager(userRole)) {
      finalBranchId = branchId;
    }

    // Create staff member
    const staffId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
      VALUES (
        ${staffId},
        ${name},
        ${email},
        ${phone || null},
        ${role},
        ${department || getDefaultDepartment(role)},
        ${shift || null},
        'active',
        ${hashedPassword},
        ${finalBranchId},
        NOW(),
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: `${role} staff member created successfully`,
      staffId,
      defaultPassword: password ? undefined : `${email.split('@')[0]}123`
    });
  } catch (error) {
    console.error("Error creating branch staff:", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

// PUT - Update staff member
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only branch managers can update their branch's staff
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ 
        error: "Forbidden - Only branch managers can update staff in their branch" 
      }, { status: 403 });
    }

    const body = await req.json();
    const { 
      id, 
      name, 
      email, 
      phone, 
      role, 
      department, 
      shift, 
      status, 
      password 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Check if staff exists and belongs to the branch
    const existingStaff = await prisma.$queryRaw`
      SELECT id, branch_id, role FROM staff WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingStaff.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const staff = existingStaff[0];

    // Verify branch access
    if (!isSuperAdminOrManager(userRole) && staff.branch_id !== userBranchId) {
      return NextResponse.json({ error: "Cannot update staff from other branches" }, { status: 403 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push("name = ?"); values.push(name); }
    if (email) { updates.push("email = ?"); values.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
    if (role) { updates.push("role = ?"); values.push(role); }
    if (department) { updates.push("department = ?"); values.push(department); }
    if (shift !== undefined) { updates.push("shift = ?"); values.push(shift); }
    if (status) { updates.push("status = ?"); values.push(status); }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    // Execute raw update
    const setClause = updates.slice(0, -1).join(", ");
    await prisma.$executeRawUnsafe(
      `UPDATE staff SET ${setClause} WHERE id = ?`,
      ...values.slice(0, -1)
    );

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully"
    });
  } catch (error) {
    console.error("Error updating branch staff:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

// DELETE - Delete/deactivate staff member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only branch managers and super admin can delete staff
    if (!isBranchManager(userRole) && !isSuperAdminOrManager(userRole)) {
      return NextResponse.json({ 
        error: "Forbidden - Only branch managers can remove staff from their branch" 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Check if staff exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id, branch_id FROM staff WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingStaff.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const staff = existingStaff[0];

    // Verify branch access
    if (!isSuperAdminOrManager(userRole) && staff.branch_id !== userBranchId) {
      return NextResponse.json({ error: "Cannot delete staff from other branches" }, { status: 403 });
    }

    // Soft delete - set status to inactive
    await prisma.$executeRaw`
      UPDATE staff SET status = 'inactive', updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Staff member removed successfully"
    });
  } catch (error) {
    console.error("Error deleting branch staff:", error);
    return NextResponse.json({ error: "Failed to remove staff member" }, { status: 500 });
  }
}

// Helper function to get default department based on role
function getDefaultDepartment(role: string): string {
  switch (role) {
    case 'WAITER':
      return 'Restaurant';
    case 'RECEPTIONIST':
      return 'Front Desk';
    case 'CHEF':
      return 'Kitchen';
    case 'KITCHEN_STAFF':
      return 'Kitchen';
    default:
      return 'General';
  }
}

