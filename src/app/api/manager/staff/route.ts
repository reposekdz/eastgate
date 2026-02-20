import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { ROLE_PERMISSIONS, isSuperAdmin, isManager } from "@/lib/auth";

// GET - Fetch all staff members
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Check permissions
    if (!isSuperAdmin(userRole) && !isManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build query
    let where: any = {};
    
    // Non-super admins can only see their branch
    if (!isSuperAdmin(userRole) && branchId) {
      where.branchId = branchId;
    } else if (!isSuperAdmin(userRole)) {
      where.branchId = userBranchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const staff = await prisma.$queryRaw`
      SELECT id, name, email, phone, role, department, shift, status, avatar, branch_id, join_date, last_login, created_at, updated_at
      FROM staff
      WHERE ${branchId ? `branch_id = ${isSuperAdmin(userRole) ? `'${branchId}'` : `'${userBranchId}'`}` : '1=1'}
        ${status ? `AND status = '${status}'` : ''}
        ${role ? `AND role = '${role}'` : ''}
        ${search ? `AND (name LIKE '%${search}%' OR email LIKE '%${search}%' OR department LIKE '%${search}%')` : ''}
      ORDER BY created_at DESC
    ` as any[];

    return NextResponse.json({ 
      success: true, 
      staff,
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

    // Check permissions
    if (!isSuperAdmin(userRole) && !isManager(userRole)) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, role, department, shift, status, branchId, password } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
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
    }

    // Determine branch ID
    const finalBranchId = branchId || userBranchId;

    // Create staff member
    const newStaff = await prisma.$executeRaw`
      INSERT INTO staff (id, name, email, phone, role, department, shift, status, password, branch_id, join_date, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()},
        ${name},
        ${email},
        ${phone || null},
        ${role},
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

    return NextResponse.json({ 
      success: true, 
      message: "Staff member created successfully",
      staffId: crypto.randomUUID()
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
    const userBranchId = session.user.branchId as string;

    // Check permissions
    if (!isSuperAdmin(userRole) && !isManager(userRole)) {
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
    if (!isSuperAdmin(userRole) && existingStaff[0].branch_id !== userBranchId) {
      return NextResponse.json({ error: "Cannot update staff from other branches" }, { status: 403 });
    }

    // Build update query
    let updates: string[] = [];
    let values: any[] = [];

    if (name) { updates.push("name = ?"); values.push(name); }
    if (email) { updates.push("email = ?"); values.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
    if (role) { updates.push("role = ?"); values.push(role); }
    if (department) { updates.push("department = ?"); values.push(department); }
    if (shift !== undefined) { updates.push("shift = ?"); values.push(shift); }
    if (status) { updates.push("status = ?"); values.push(status); }
    if (branchId && isSuperAdmin(userRole)) { updates.push("branch_id = ?"); values.push(branchId); }
    
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

    await prisma.$executeRaw`
      UPDATE staff 
      SET name = ${name}, email = ${email}, phone = ${phone}, role = ${role}, 
          department = ${department}, shift = ${shift}, status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Staff member updated successfully"
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

// DELETE - Delete a staff member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    // Only super admin can delete staff
    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admins can delete staff" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Check if staff exists
    const existingStaff = await prisma.$queryRaw`
      SELECT id FROM staff WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingStaff.length === 0) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Delete staff
    await prisma.$executeRaw`
      DELETE FROM staff WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Staff member deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
