/**
 * Advanced API Middleware
 * Authentication, authorization, rate limiting, and logging
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyToken,
  TokenPayload,
  checkRateLimit,
  clearRateLimit,
} from "@/lib/auth-advanced";
import {
  hasPermission,
  checkResourceAccess,
  ROLE_DEFINITIONS,
} from "@/lib/rbac-system";
import { errorResponse } from "@/lib/validators";

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Extract and verify token from request
 */
export function extractToken(req: NextRequest): string | null {
  // Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("eastgate-auth="));
    if (authCookie) {
      return authCookie.split("=")[1];
    }
  }

  return null;
}

/**
 * Middleware: Verify authentication
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const token = extractToken(req);

      if (!token) {
        return errorResponse("No authentication token provided", [], 401);
      }

      const payload = verifyToken(token, "access");

      if (!payload) {
        return errorResponse("Invalid or expired token", [], 401);
      }

      // Attach user to request context
      (req as any).user = payload;

      return handler(req, context);
    } catch (error) {
      console.error("Auth error:", error);
      return errorResponse("Authentication failed", [], 401);
    }
  };
}

// ============================================
// AUTHORIZATION MIDDLEWARE
// ============================================

/**
 * Middleware: Check permission
 */
export function withPermission(
  requiredPermission: string,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, context: any) => {
    const user = (req as any).user as TokenPayload;

    if (!hasPermission(user.permissions, requiredPermission)) {
      return errorResponse(
        `Permission denied: ${requiredPermission} required`,
        [],
        403
      );
    }

    return handler(req, context);
  });
}

/**
 * Middleware: Check role
 */
export function withRole(
  requiredRole: string,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, context: any) => {
    const user = (req as any).user as TokenPayload;

    const requiredRoleDef = ROLE_DEFINITIONS[requiredRole];
    const userRoleDef = ROLE_DEFINITIONS[user.role];

    if (!userRoleDef || !requiredRoleDef) {
      return errorResponse("Invalid role configuration", [], 500);
    }

    if (userRoleDef.level < requiredRoleDef.level) {
      return errorResponse(`Role "${requiredRole}" or higher required`, [], 403);
    }

    return handler(req, context);
  });
}

/**
 * Middleware: Check resource access
 */
export function withResourceAccess(
  resource: string,
  action: string,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, context: any) => {
    const user = (req as any).user as TokenPayload;

    const accessContext = {
      role: user.role,
      userId: user.id,
      branchId: user.branchId,
      // Additional context from request
      ...context,
    };

    if (!checkResourceAccess(resource, action, accessContext)) {
      return errorResponse(
        `Access denied to ${resource}:${action}`,
        [],
        403
      );
    }

    return handler(req, context);
  });
}

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

interface RateLimitConfig {
  maxAttempts?: number;
  windowMs?: number;
}

/**
 * Middleware: Rate limiting
 */
export function withRateLimit(
  keyGenerator: (req: NextRequest) => string,
  config: RateLimitConfig = {}
) {
  const { maxAttempts = 5, windowMs = 60000 } = config;

  return (
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest, context: any) => {
      const key = keyGenerator(req);

      if (!checkRateLimit(key, maxAttempts, windowMs)) {
        return errorResponse(
          `Too many requests. Try again later.`,
          [],
          429
        );
      }

      return handler(req, context);
    };
  };
}

// ============================================
// LOGGING MIDDLEWARE
// ============================================

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  duration: number;
  ip?: string;
}

const requestLogs: LogEntry[] = [];

/**
 * Middleware: Request logging
 */
export function withLogging(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const startTime = Date.now();
    const user = (req as any).user;
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    try {
      const response = await handler(req, context);

      const duration = Date.now() - startTime;
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: new URL(req.url).pathname,
        statusCode: response.status,
        userId: user?.id,
        duration,
        ip,
      };

      requestLogs.push(logEntry);

      // Keep only last 1000 logs in memory
      if (requestLogs.length > 1000) {
        requestLogs.shift();
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("Request error:", error);

      return errorResponse("Internal server error", [], 500);
    }
  };
}

/**
 * Get request logs
 */
export function getRequestLogs(filters?: {
  userId?: string;
  startTime?: Date;
  endTime?: Date;
}): LogEntry[] {
  let logs = [...requestLogs];

  if (filters?.userId) {
    logs = logs.filter((log) => log.userId === filters.userId);
  }

  if (filters?.startTime) {
    logs = logs.filter((log) => new Date(log.timestamp) >= filters.startTime!);
  }

  if (filters?.endTime) {
    logs = logs.filter((log) => new Date(log.timestamp) <= filters.endTime!);
  }

  return logs;
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: "string" | "number" | "boolean" | "array" | "object";
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

/**
 * Middleware: Validate request body
 */
export function withValidation(
  schema: ValidationSchema,
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const body = await req.json();
      const errors: Array<{ field: string; message: string }> = [];

      // Validate each field
      for (const [field, rules] of Object.entries(schema)) {
        const value = body[field];

        if (rules.required && value === undefined) {
          errors.push({
            field,
            message: `${field} is required`,
          });
          continue;
        }

        if (value === undefined) continue;

        if (rules.type && typeof value !== rules.type) {
          errors.push({
            field,
            message: `${field} must be of type ${rules.type}`,
          });
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters`,
          });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} must be at most ${rules.maxLength} characters`,
          });
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({
            field,
            message: `${field} format is invalid`,
          });
        }
      }

      if (errors.length > 0) {
        return errorResponse("Validation failed", errors as any, 400);
      }

      // Attach validated body to request
      (req as any).validatedBody = body;

      return handler(req, context);
    } catch (error) {
      return errorResponse("Invalid request body", [], 400);
    }
  };
}

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

/**
 * Middleware: Global error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("Unhandled error:", error);

      if (error instanceof SyntaxError) {
        return errorResponse("Invalid JSON", [], 400);
      }

      if (error instanceof TypeError) {
        return errorResponse("Type error in request processing", [], 400);
      }

      return errorResponse("Internal server error", [], 500);
    }
  };
}

// ============================================
// MIDDLEWARE COMPOSITION
// ============================================

/**
 * Compose multiple middleware
 */
export function compose<P extends (h: any) => any>(
  ...middleware: P[]
): (handler: any) => any {
  return (handler: any) =>
    middleware.reduceRight((prev, current) => current(prev), handler);
}

/**
 * Create protected API handler
 */
export function createProtectedHandler(
  requiredPermission?: string,
  requiredRole?: string,
  resourceAccess?: { resource: string; action: string }
) {
  const middlewares: Array<(h: any) => any> = [withErrorHandling];

  middlewares.push(
    withLogging(
      withRateLimit(
        (req) => req.headers.get("x-forwarded-for") || "unknown",
        { maxAttempts: 100, windowMs: 60000 }
      ) as any
    )
  );

  middlewares.push(withAuth);

  if (requiredPermission) {
    middlewares.push((handler) => withPermission(requiredPermission, handler));
  }

  if (requiredRole) {
    middlewares.push((handler) => withRole(requiredRole, handler));
  }

  if (resourceAccess) {
    middlewares.push((handler) =>
      withResourceAccess(resourceAccess.resource, resourceAccess.action, handler)
    );
  }

  return compose(...middlewares);
}
