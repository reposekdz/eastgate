/**
 * Middleware with JWT & RBAC
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter", "/kitchen", "/housekeeping", "/stock-manager", "/dashboard", "/profile"];
const publicPrefixes = ["/login", "/register", "/public", "/api/public", "/api/auth"];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
  super_manager: ["*"],
  branch_manager: ["/manager", "/dashboard", "/profile"],
  receptionist: ["/receptionist", "/dashboard", "/profile"],
  waiter: ["/waiter", "/dashboard", "/profile"],
  restaurant_staff: ["/waiter", "/dashboard", "/profile"],
  chef: ["/kitchen", "/dashboard", "/profile"],
  kitchen_staff: ["/kitchen", "/dashboard", "/profile"],
  housekeeping: ["/housekeeping", "/dashboard", "/profile"],
  stock_manager: ["/stock-manager", "/dashboard", "/profile"],
  accountant: ["/admin", "/dashboard", "/profile"],
  event_manager: ["/admin", "/dashboard", "/profile"],
};

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

function hasAccess(role: string, path: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  return permissions.some(perm => path.startsWith(perm));
}

export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  if (publicPrefixes.some(prefix => nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (!protectedPrefixes.some(prefix => nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const authCookie = req.cookies.get("eastgate-auth");
  
  if (!authCookie?.value) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded = JSON.parse(decodeURIComponent(authCookie.value));
    
    if (!decoded.isAuthenticated || !decoded.user) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    const role = decoded.user.role.toLowerCase();
    
    if (!hasAccess(role, nextUrl.pathname)) {
      const correctDashboard = ROLE_DASHBOARD_MAP[role];
      if (correctDashboard) {
        return NextResponse.redirect(new URL(correctDashboard, nextUrl));
      }
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", decoded.user.id);
    response.headers.set("x-user-role", decoded.user.role);
    response.headers.set("x-user-branch", decoded.user.branchId);
    return response;
  } catch (e) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
