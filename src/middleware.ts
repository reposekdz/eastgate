import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter", "/kitchen", "/dashboard", "/profile", "/super-admin", "/branch"];

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const authCookie = req.cookies.get("eastgate-auth");
  const isProtected = protectedPrefixes.some((prefix) => nextUrl.pathname.startsWith(prefix));

  let session = null;
  if (authCookie?.value) {
    try {
      session = JSON.parse(authCookie.value);
    } catch {
      session = null;
    }
  }

  if (nextUrl.pathname === "/change-password") {
    if (!session?.isAuthenticated) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isProtected) return NextResponse.next();

  if (!session?.isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.role;
  const routePermissions: Record<string, string[]> = {
    "/admin": ["SUPER_ADMIN", "SUPER_MANAGER"],
    "/manager": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"],
    "/super-admin": ["SUPER_ADMIN", "SUPER_MANAGER"],
    "/branch": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"],
    "/receptionist": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER", "RECEPTIONIST"],
    "/waiter": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER", "WAITER", "STAFF"],
    "/kitchen": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER", "CHEF", "KITCHEN_STAFF"],
    "/dashboard": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER", "RECEPTIONIST", "WAITER", "CHEF", "KITCHEN_STAFF", "STAFF"],
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
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};



