import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "eastgate-secret-key-change-in-production";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find staff by email
    const staff = await prisma.$queryRaw`
      SELECT * FROM staff WHERE email = ${email} LIMIT 1
    ` as any[];

    if (!staff || staff.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = staff[0];

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Account is not active. Please contact administrator." },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    let isValidPassword = false;
    
    if (user.password && typeof user.password === 'string' && user.password.startsWith('$2')) {
      // Use bcrypt to compare passwords (if it's a hashed password)
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Fallback for demo accounts - accepts these passwords for development
      isValidPassword = 
        password === "demo123" || 
        password === "admin123" ||
        password === "manager123" ||
        password === email.split('@')[0];
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branch_id || user.branchId,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update last login
    try {
      await prisma.$executeRaw`
        UPDATE staff SET last_login = NOW(), updated_at = NOW() WHERE id = ${user.id}
      `;
    } catch (e) {
      // Ignore update errors
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branch_id || user.branchId,
        avatar: user.avatar,
        department: user.department,
      },
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
