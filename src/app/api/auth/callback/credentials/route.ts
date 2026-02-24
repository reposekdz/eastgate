import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.staff.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is not active. Please contact administrator." },
        { status: 401 }
      );
    }

    // Verify password
    let isValidPassword = false;
    
    if (user.password && typeof user.password === 'string' && user.password.startsWith('$2')) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Accept "2026" as default password for all users
      isValidPassword = password === "2026";
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.staff.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(() => {});

    // Return user data for session
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        branchId: user.branchId,
        image: user.avatar,
      },
    });
  } catch (error) {
    console.error("Credentials callback error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
