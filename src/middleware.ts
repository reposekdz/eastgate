import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected route prefixes that require authentication
const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter"];
// Authenticated but no role check (e.g. force credential change)
const authOnlyPaths = ["/change-credentials"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get("eastgate-auth");

  if (pathname.startsWith("/change-credentials")) {
    if (!authCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const authData = JSON.parse(authCookie.value);
      if (!authData.isAuthenticated || !authData.role) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  if (!authCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const authData = JSON.parse(authCookie.value);
    if (!authData.isAuthenticated || !authData.role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = authData.role;
    const routePermissions: Record<string, string[]> = {
      "/admin": [
        "super_admin",
        "super_manager",
        "branch_manager",
        "branch_admin",
        "accountant",
        "event_manager",
      ],
      "/manager": ["super_admin", "super_manager", "branch_manager", "branch_admin"],
      "/receptionist": [
        "super_admin",
        "super_manager",
        "branch_manager",
        "branch_admin",
        "receptionist",
      ],
      "/waiter": [
        "super_admin",
        "super_manager",
        "branch_manager",
        "waiter",
        "restaurant_staff",
        "kitchen_staff",
      ],
    };

    const matchedPrefix = protectedPrefixes.find((p) => pathname.startsWith(p));
    if (matchedPrefix) {
      const allowedRoles = routePermissions[matchedPrefix];
      if (!allowedRoles.includes(role)) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "insufficient_permissions");
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/receptionist/:path*", "/waiter/:path*", "/change-credentials"],
};
