import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth";

// GET - Fetch all branches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;
    const userBranchId = session.user.branchId as string;

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Build query based on role
    let branches: any[];
    
    if (!isSuperAdmin(userRole)) {
      // Non-super admins can only see their branch
      branches = await prisma.$queryRaw`
        SELECT * FROM branches WHERE id = ${userBranchId} ORDER BY created_at DESC
      ` as any[];
    } else if (includeInactive) {
      branches = await prisma.$queryRaw`
        SELECT * FROM branches ORDER BY created_at DESC
      ` as any[];
    } else {
      branches = await prisma.$queryRaw`
        SELECT * FROM branches WHERE is_active = true ORDER BY created_at DESC
      ` as any[];
    }

    // Get staff count per branch
    const branchesWithStaff = await Promise.all(
      branches.map(async (branch: any) => {
        const staffCount = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM staff WHERE branch_id = ${branch.id} AND status = 'active'
        ` as any[];
        return {
          ...branch,
          staffCount: staffCount[0]?.count || 0
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      branches: branchesWithStaff,
      count: branchesWithStaff.length 
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

// POST - Create a new branch (Super Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin can create branches
    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admins can create branches" }, { status: 403 });
    }

    const body = await req.json();
    const { name, location, address, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }

    // Check if branch name already exists
    const existingBranch = await prisma.$queryRaw`
      SELECT id FROM branches WHERE name = ${name} LIMIT 1
    ` as any[];

    if (existingBranch.length > 0) {
      return NextResponse.json({ error: "Branch with this name already exists" }, { status: 400 });
    }

    // Create branch
    const branchId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO branches (id, name, location, address, phone, email, is_active, created_at, updated_at)
      VALUES (
        ${branchId},
        ${name},
        ${location || null},
        ${address || null},
        ${phone || null},
        ${email || null},
        true,
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Branch created successfully",
      branchId
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}

// PUT - Update a branch
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin can update branches
    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admins can update branches" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, location, address, phone, email, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Check if branch exists
    const existingBranch = await prisma.$queryRaw`
      SELECT id FROM branches WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingBranch.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Update branch
    if (name) {
      await prisma.$executeRaw`UPDATE branches SET name = ${name}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (location) {
      await prisma.$executeRaw`UPDATE branches SET location = ${location}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (address) {
      await prisma.$executeRaw`UPDATE branches SET address = ${address}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (phone) {
      await prisma.$executeRaw`UPDATE branches SET phone = ${phone}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (email) {
      await prisma.$executeRaw`UPDATE branches SET email = ${email}, updated_at = NOW() WHERE id = ${id}`;
    }
    if (isActive !== undefined) {
      await prisma.$executeRaw`UPDATE branches SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${id}`;
    }

    return NextResponse.json({ 
      success: true, 
      message: "Branch updated successfully"
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}

// DELETE - Delete a branch (Super Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    // Only super admin can delete branches
    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden - Only super admins can delete branches" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Check if branch exists
    const existingBranch = await prisma.$queryRaw`
      SELECT id FROM branches WHERE id = ${id} LIMIT 1
    ` as any[];

    if (existingBranch.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Check if branch has active staff
    const staffCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM staff WHERE branch_id = ${id} AND status = 'active'
    ` as any[];

    if (staffCount[0]?.count > 0) {
      return NextResponse.json({ 
        error: "Cannot delete branch with active staff. Please reassign staff first." 
      }, { status: 400 });
    }

    // Delete branch
    await prisma.$executeRaw`
      DELETE FROM branches WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Branch deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}
