import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected route prefixes that require authentication
const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is a protected route
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth cookie (Zustand persist stores in localStorage,
  // but we also check a lightweight cookie set at login for SSR protection)
  const authCookie = request.cookies.get("eastgate-auth");

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

    // Role-based route access control
    const routePermissions: Record<string, string[]> = {
      "/admin": [
        "super_admin",
        "super_manager",
        "branch_manager",
        "accountant",
        "event_manager",
      ],
      "/manager": ["super_admin", "super_manager", "branch_manager"],
      "/receptionist": [
        "super_admin",
        "super_manager",
        "branch_manager",
        "receptionist",
      ],
      "/waiter": [
        "super_admin",
        "super_manager",
        "branch_manager",
        "waiter",
        "restaurant_staff",
      ],
    };

    const matchedPrefix = protectedPrefixes.find((prefix) =>
      pathname.startsWith(prefix)
    );

    if (matchedPrefix) {
      const allowedRoles = routePermissions[matchedPrefix];
      if (!allowedRoles.includes(role)) {
        // Redirect to login with an access denied message
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "insufficient_permissions");
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch {
    // Invalid cookie data — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/receptionist/:path*", "/waiter/:path*"],
};
