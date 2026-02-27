/**
 * Login API Route with JWT Authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { generateTokens, setAuthCookies, checkRateLimit, verifyPassword } from "@/lib/auth-advanced";
import prisma from "@/lib/prisma";

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  super_admin: "/admin",
  super_manager: "/admin",
  accountant: "/admin",
  event_manager: "/admin",
  branch_manager: "/manager",
  receptionist: "/receptionist",
  waiter: "/waiter",
  restaurant_staff: "/waiter",
  chef: "/kitchen",
  kitchen_staff: "/kitchen",
  housekeeping: "/housekeeping",
  stock_manager: "/stock-manager",
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
  super_manager: ["*"],
  branch_manager: ["/manager", "/dashboard", "/profile", "/api/bookings", "/api/guests", "/api/staff"],
  receptionist: ["/receptionist", "/dashboard", "/profile", "/api/bookings", "/api/guests", "/api/rooms"],
  waiter: ["/waiter", "/dashboard", "/profile", "/api/orders", "/api/menu", "/api/tables"],
  restaurant_staff: ["/waiter", "/dashboard", "/profile", "/api/orders", "/api/menu"],
  accountant: ["/admin", "/dashboard", "/profile", "/api/finance", "/api/reports"],
  event_manager: ["/admin", "/dashboard", "/profile", "/api/events", "/api/bookings"],
  chef: ["/kitchen", "/dashboard", "/profile", "/api/orders", "/api/menu"],
  kitchen_staff: ["/kitchen", "/dashboard", "/profile", "/api/orders"],
  housekeeping: ["/housekeeping", "/dashboard", "/profile", "/api/tasks"],
  stock_manager: ["/stock-manager", "/dashboard", "/profile", "/api/inventory"],
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, branchId } = await req.json();

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(`login:${clientIp}`, 10, 900000)) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.staff.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const userRole = user.role.toLowerCase();
    const isSuperUser = ["super_admin", "super_manager"].includes(userRole);
    
    if (!isSuperUser && branchId && user.branchId !== branchId) {
      return NextResponse.json(
        { success: false, error: "You don't have access to this branch" },
        { status: 403 }
      );
    }

    const tokens = await generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      permissions: ROLE_PERMISSIONS[userRole] || [],
    });

    await setAuthCookies(tokens, {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      name: user.name,
      avatar: user.avatar || undefined,
    });

    const redirectTo = ROLE_DASHBOARD_MAP[userRole] || "/dashboard";

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        avatar: user.avatar,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      redirectTo,
    });
  } catch (error) {
    console.error("[LOGIN API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
