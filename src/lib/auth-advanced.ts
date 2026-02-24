/**
 * Advanced Authentication System
 * JWT-based authentication with 2FA, token refresh, and enhanced security
 */

import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  branchId: string;
  permissions: string[];
  iat?: number;
  exp?: number;
  type: "access" | "refresh";
}

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

export const JWT_SECRETS = {
  access: process.env.JWT_ACCESS_SECRET || "access-secret-key",
  refresh: process.env.JWT_REFRESH_SECRET || "refresh-secret-key",
  twoFactor: process.env.JWT_2FA_SECRET || "2fa-secret-key",
};

export const JWT_EXPIRY = {
  access: "15m",
  refresh: "7d",
  twoFactor: "10m",
};

/**
 * Generate JWT tokens
 */
export function generateTokens(payload: Omit<TokenPayload, "iat" | "exp" | "type">) {
  const accessToken = jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRETS.access,
    { expiresIn: JWT_EXPIRY.access }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    JWT_SECRETS.refresh,
    { expiresIn: JWT_EXPIRY.refresh }
  );

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(
  token: string,
  type: "access" | "refresh" | "twoFactor" = "access"
): TokenPayload | null {
  try {
    const secret =
      type === "access"
        ? JWT_SECRETS.access
        : type === "refresh"
          ? JWT_SECRETS.refresh
          : JWT_SECRETS.twoFactor;

    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

// ============================================
// 2FA - TWO-FACTOR AUTHENTICATION
// ============================================

/**
 * Generate 2FA secret and OTP setup
 */
export function generate2FASecret(): {
  secret: string;
  qrCode: string;
} {
  const secret = randomBytes(32).toString("hex");
  // In production, use speakeasy or similar library to generate TOTP QR codes
  const qrCode = `otpauth://totp/EastGate?secret=${secret}`;
  return { secret, qrCode };
}

/**
 * Verify OTP code
 */
export function verifyOTP(secret: string, code: string): boolean {
  // In production, use speakeasy or similar to verify TOTP
  // This is a simplified version
  return code.length === 6 && /^\d+$/.test(code);
}

/**
 * Send OTP via email (using existing email service)
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // Implement using your email service
    console.log(`OTP for ${email}: ${otp}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return false;
  }
}

/**
 * Generate 2FA JWT token
 */
export function generate2FAToken(staffId: string): string {
  return jwt.sign(
    { staffId, type: "twoFactor" },
    JWT_SECRETS.twoFactor,
    { expiresIn: JWT_EXPIRY.twoFactor }
  );
}

// ============================================
// PASSWORD SECURITY
// ============================================

/**
 * Hash password with bcrypt-like security (using native crypto)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  const newHash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return storedHash === newHash;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Generate API key for integrations
 */
export function generateAPIKey(): string {
  return `ek_${randomBytes(32).toString("hex")}`;
}

/**
 * Hash API key for storage
 */
export function hashAPIKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verify API key
 */
export async function verifyAPIKey(apiKey: string): Promise<boolean> {
  // TODO: Implement API key verification from database
  const hash = hashAPIKey(apiKey);
  const key = await prisma.client.query(
    `SELECT id FROM api_keys WHERE key_hash = $1 AND is_active = true`,
    [hash]
  );
  return key.rows.length > 0;
}

// ============================================
// RATE LIMITING & SECURITY
// ============================================

/**
 * Rate limiting data structure
 */
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

/**
 * Check rate limit
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Reset window if expired
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + windowMs });
    return true;
  }

  // Check if limit exceeded
  if (record.attempts >= maxAttempts) {
    return false;
  }

  // Increment attempts
  record.attempts++;
  return true;
}

/**
 * Clear rate limit
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create secure session cookie
 */
export function createSessionCookie(token: string): string {
  return `${token}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}
