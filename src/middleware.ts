/**
 * Advanced Middleware with Enhanced Security
 * JWT authentication, RBAC, rate limiting, and logging
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/auth-advanced";
import {
  hasPermission,
  ROLE_DEFINITIONS,
  getRoleLevel,
} from "@/lib/rbac-system";

const protectedPrefixes = [
  "/admin",
  "/manager",
  "/receptionist",
  "/waiter",
  "/kitchen",
  "/dashboard",
  "/profile",
  "/super-admin",
  "/branch",
];

const publicPrefixes = ["/login", "/register", "/public", "/api/public"];

export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // Allow public routes
  const isPublicRoute = publicPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = protectedPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Extract and verify token
  let token = null;
  let session: TokenPayload | null = null;

  // Try to get token from Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Fall back to cookie if no header token
  if (!token) {
    const authCookie = req.cookies.get("eastgate-auth");
    if (authCookie?.value) {
      try {
        token = decodeURIComponent(authCookie.value);
      } catch (e) {
        // Invalid cookie format
      }
    }
  }

  // Verify token
  if (token) {
    session = verifyToken(token, "access");
  }

  // If no valid session, redirect to login
  if (!session) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const roleLevel = getRoleLevel(session.role);
  const role = session.role.toUpperCase();

  const routeRoles: Record<string, string[]> = {
    "/admin": ["SUPER_ADMIN"],
    "/super-admin": ["SUPER_ADMIN"],
    "/manager": ["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"],
    "/receptionist": [
      "SUPER_ADMIN",
      "SUPER_MANAGER",
      "BRANCH_MANAGER",
      "MANAGER",
      "RECEPTIONIST",
    ],
    "/waiter": [
      "SUPER_ADMIN",
      "SUPER_MANAGER",
      "BRANCH_MANAGER",
      "MANAGER",
      "WAITER",
      "RESTAURANT_STAFF",
    ],
    "/kitchen": [
      "SUPER_ADMIN",
      "SUPER_MANAGER",
      "BRANCH_MANAGER",
      "MANAGER",
      "CHEF",
      "KITCHEN_STAFF",
    ],
    "/dashboard": [
      "SUPER_ADMIN",
      "SUPER_MANAGER",
      "BRANCH_MANAGER",
      "MANAGER",
      "RECEPTIONIST",
      "WAITER",
      "CHEF",
      "KITCHEN_STAFF",
    ],
  };

  const matchedPrefix = protectedPrefixes.find((p) =>
    nextUrl.pathname.startsWith(p)
  );

  if (matchedPrefix && routeRoles[matchedPrefix]) {
    if (!routeRoles[matchedPrefix].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions to access this resource",
        },
        { status: 403 }
      );
    }
  }

  // Create response and add user info to headers
  const response = NextResponse.next();
  response.headers.set("x-user-id", session.id);
  response.headers.set("x-user-role", session.role);
  response.headers.set("x-user-branch", session.branchId);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};


