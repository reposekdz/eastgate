import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isSuperAdminOrManager, isBranchManager } from "@/lib/auth";

// GET - Fetch all staff members (for admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin, super manager, and branch managers can access
    if (!isSuperAdminOrManager(userRole) && !isBranchManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build query
    let whereClause = "1=1";
    const params: any[] = [];

    // Non-super admins can only see their branch
    if (!isSuperAdmin(userRole) && session.user.branchId) {
      whereClause += ` AND branch_id = ?`;
      params.push(session.user.branchId);
    } else if (branchId) {
      whereClause += ` AND branch_id = ?`;
      params.push(branchId);
    }

    if (status) {
      whereClause += ` AND status = ?`;
      params.push(status);
    }

    if (role) {
      whereClause += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      whereClause += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const staff = await prisma.$queryRaw`
      SELECT id, name, email, phone, role, department, shift, status, avatar, branch_id, join_date, last_login, created_at, updated_at
      FROM staff
      WHERE ${whereClause}
      ORDER BY created_at DESC
    ` as any[];

    // Get branch info
    const branches = await prisma.$queryRaw`
      SELECT id, name FROM branches WHERE is_active = true ORDER BY name ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      staff,
      branches,
      count: staff.length
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST - Create a new staff member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only super admin, super manager, and branch managers can create staff
    if (!isSuperAdminOrManager(userRole) && !isBranchManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, role, department, shift, status, branchId, password, createdBy } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Branch managers can only create certain roles
    if (isBranchManager(userRole)) {
      const allowedRoles = ['WAITER', 'RECEPTIONIST', 'CHEF', 'KITCHEN_STAFF', 'STAFF', 'MANAGER'];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ 
          error: `Branch managers can only create: ${allowedRoles.join(', ')}` 
        }, { status: 403 });
      }
    }

    // Check if email already exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id FROM staff WHERE email = ${email} LIMIT 1
    ` as any[];

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine branch ID
    let finalBranchId = branchId || userBranchId;
    
    // Only super admins can assign to any branch
    if (!isSuperAdmin(userRole) && !isSuperAdminOrManager(userRole)) {
      finalBranchId = userBranchId;
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
        ${role || 'STAFF'},
        ${department || 'General'},
        ${shift || null},
        ${status || 'active'},
        ${hashedPassword},
        ${finalBranchId},
        NOW(),
        NOW(),
        NOW()
      )
    `;

    // Log activity
    try {
      await prisma.$executeRaw`
        INSERT INTO activity_logs (id, user_id, branch_id, action, entity, created_at)
        VALUES (
          ${crypto.randomUUID()},
          ${createdBy || session.user.id},
          ${finalBranchId},
          'create_staff',
          'staff',
          NOW()
        )
      `;
    } catch (e) {
      // Ignore activity log errors
    }

    return NextResponse.json({
      success: true,
      message: "Staff member created successfully",
      staff: {
        id: staffId,
        name,
        email,
        role: role || 'STAFF',
        branchId: finalBranchId
      }
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

// PUT - Update a staff member
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin, super manager, and branch managers can update staff
    if (!isSuperAdminOrManager(userRole) && !isBranchManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, email, phone, role, department, shift, status, branchId, password } = body;

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

    // Non-super admins can only update their branch's staff
    if (!isSuperAdmin(userRole) && existingStaff[0].branch_id !== session.user.branchId) {
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
    if (branchId && isSuperAdminOrManager(userRole)) { updates.push("branch_id = ?"); values.push(branchId); }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
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
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

// DELETE - Delete/deactivate a staff member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin and super manager can delete staff
    if (!isSuperAdminOrManager(userRole) && !isBranchManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Check if staff exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id, branch_id, role FROM staff WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingStaff.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Non-super admins can only delete their branch's staff
    if (!isSuperAdmin(userRole) && existingStaff[0].branch_id !== session.user.branchId) {
      return NextResponse.json({ error: "Cannot delete staff from other branches" }, { status: 403 });
    }

    // Don't allow deleting super admin
    if (existingStaff[0].role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
    }

    // Soft delete - set status to inactive
    await prisma.$executeRaw`
      UPDATE staff SET status = 'inactive', updated_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully"
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
