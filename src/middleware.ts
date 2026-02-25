/**
 * Middleware with JWT & RBAC
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter", "/kitchen", "/dashboard", "/profile"];
const publicPrefixes = ["/login", "/register", "/public", "/api/public", "/api/auth"];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  SUPER_MANAGER: ["*"],
  BRANCH_MANAGER: ["/manager", "/dashboard", "/profile"],
  RECEPTIONIST: ["/receptionist", "/dashboard", "/profile"],
  WAITER: ["/waiter", "/dashboard", "/profile"],
  RESTAURANT_STAFF: ["/waiter", "/dashboard", "/profile"],
  CHEF: ["/kitchen", "/dashboard", "/profile"],
  KITCHEN_STAFF: ["/kitchen", "/dashboard", "/profile"],
  ACCOUNTANT: ["/admin", "/dashboard", "/profile"],
  EVENT_MANAGER: ["/admin", "/dashboard", "/profile"],
};

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  SUPER_MANAGER: "/admin",
  ACCOUNTANT: "/admin",
  EVENT_MANAGER: "/admin",
  BRANCH_MANAGER: "/manager",
  RECEPTIONIST: "/receptionist",
  WAITER: "/waiter",
  RESTAURANT_STAFF: "/waiter",
  CHEF: "/kitchen",
  KITCHEN_STAFF: "/kitchen",
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

    const role = decoded.user.role.toUpperCase();
    
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
