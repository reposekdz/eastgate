import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// GET - Fetch single staff member
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: params.id },
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
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch staff member" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update staff member (profile, shift, password reset)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, email, phone, department, status, shift, forcePasswordReset, password } = body;

    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;
    if (shift !== undefined) updateData.shift = shift;
    if (forcePasswordReset !== undefined) updateData.forcePasswordReset = forcePasswordReset;
    
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    await prisma.staff.update({
      where: { id: params.id },
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

// DELETE - Deactivate staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingStaff = await prisma.staff.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
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
