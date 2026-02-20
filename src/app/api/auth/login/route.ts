import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // For demo: accept demo123, admin123, or email prefix as password
    const isValid = password === "demo123" || 
                   password === "admin123" || 
                   password === email.split('@')[0];

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create simple token (in production use proper JWT)
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branch_id || user.branchId,
    })).toString('base64');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branch_id || user.branchId,
        avatar: user.avatar,
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
