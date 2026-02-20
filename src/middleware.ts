import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/manager", "/receptionist", "/waiter", "/kitchen", "/dashboard", "/profile"];

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
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
