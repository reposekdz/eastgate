import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET - Fetch all staff members (for admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const staff = await prisma.staff.findMany({
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
        joinDate: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      staff,
      branches,
      count: staff.length,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch staff" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new staff member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, department, shift, status, branchId, password } = body;

    if (!name || !email || !password || !branchId) {
      return NextResponse.json(
        { success: false, error: "Name, email, password, and branch are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone,
        role: role || "STAFF",
        department: department || "General",
        shift,
        status: status || "active",
        password: hashedPassword,
        branchId,
        joinDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member created successfully",
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        branchId: staff.branchId,
      },
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create staff member" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a staff member
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phone, role, department, shift, status, branchId, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (shift !== undefined) updateData.shift = shift;
    if (status) updateData.status = status;
    if (branchId) updateData.branchId = branchId;

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await prisma.staff.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update staff member" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete/deactivate a staff member
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (existingStaff.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Cannot delete super admin" },
        { status: 403 }
      );
    }

    await prisma.staff.update({
      where: { id },
      data: { status: "inactive" },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete staff member" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}