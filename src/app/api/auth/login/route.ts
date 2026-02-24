import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find staff by email
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { branch: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, staff.password || "");

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if staff is active
    if (staff.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Account is not active" },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    });

    // Return user data (excluding password)
    return NextResponse.json({
      success: true,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        branchId: staff.branchId,
        branchName: staff.branch.name,
        avatar: staff.avatar || `https://i.pravatar.cc/40?u=${staff.email}`,
        phone: staff.phone,
        department: staff.department,
        mustChangePassword: staff.mustChangePassword,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
