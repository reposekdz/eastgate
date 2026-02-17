import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected route prefixes that require authentication
const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter", "/kitchen", "/dashboard", "/profile"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isProtected = protectedPrefixes.some((prefix) => nextUrl.pathname.startsWith(prefix));

  // 1. If hitting change-password page, allow if authenticated
  if (nextUrl.pathname === "/change-password") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  // 2. If unprotected route, allow
  if (!isProtected) return NextResponse.next();

  // 3. If protected but not authenticated, redirect to login
  if (!session) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Force password change if required
  if (session.user?.mustChangePassword && nextUrl.pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", nextUrl));
  }

  // 5. Role-based access control
  const role = session.user?.role;
  const routePermissions: Record<string, string[]> = {
    "/admin": ["super_admin", "super_manager"],
    "/manager": ["super_admin", "super_manager", "branch_manager"],
    "/receptionist": ["super_admin", "super_manager", "branch_manager", "receptionist"],
    "/waiter": ["super_admin", "super_manager", "branch_manager", "waiter", "restaurant_staff"],
    "/kitchen": ["super_admin", "super_manager", "branch_manager", "chef", "kitchen_staff"],
    "/dashboard": ["super_admin", "super_manager", "branch_manager", "receptionist", "waiter", "chef", "kitchen_staff", "accountant", "event_manager"],
  };

  const matchedPrefix = protectedPrefixes.find((p) => nextUrl.pathname.startsWith(p));
  if (matchedPrefix && routePermissions[matchedPrefix]) {
    const allowedRoles = routePermissions[matchedPrefix];
    if (!allowedRoles.includes(role)) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("error", "insufficient_permissions");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
