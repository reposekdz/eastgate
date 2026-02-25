/**
 * Advanced JWT Authentication System
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  branchId: string;
  permissions: string[];
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const tokenBlacklist = new Set<string>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "eastgate_jwt_access_secret_key_2026";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "eastgate_jwt_refresh_secret_key_2026";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  
  const [, value, unit] = match;
  const num = parseInt(value);
  
  switch (unit) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 3600;
    case "d": return num * 86400;
    default: return 900;
  }
}

export async function generateTokens(payload: Omit<TokenPayload, "type" | "iat" | "exp">): Promise<TokenPair> {
  const accessExpiry = parseExpiry(ACCESS_EXPIRY);
  const refreshExpiry = parseExpiry(REFRESH_EXPIRY);

  const accessToken = jwt.sign(
    { ...payload, type: "access" },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiry,
  };
}

export function verifyToken(token: string, type: "access" | "refresh"): TokenPayload | null {
  try {
    const secret = type === "access" ? ACCESS_SECRET : REFRESH_SECRET;
    
    if (tokenBlacklist.has(token)) {
      return null;
    }

    const payload = jwt.verify(token, secret) as TokenPayload;
    
    if (payload.type !== type) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function verifyTokenSync(token: string, type: "access" | "refresh"): TokenPayload | null {
  return verifyToken(token, type);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  const payload = verifyToken(refreshToken, "refresh");
  
  if (!payload) {
    return null;
  }

  const { type, iat, exp, ...userPayload } = payload;
  return generateTokens(userPayload);
}

export function revokeToken(token: string): void {
  tokenBlacklist.add(token);
  setTimeout(() => tokenBlacklist.delete(token), 86400000);
}

export async function setAuthCookies(tokens: TokenPair): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set("eastgate-token", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokens.expiresIn,
    path: "/",
  });

  cookieStore.set("eastgate-refresh", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: parseExpiry(REFRESH_EXPIRY),
    path: "/",
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("eastgate-token");
  cookieStore.delete("eastgate-refresh");
  cookieStore.delete("eastgate-auth");
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("eastgate-token");
  
  if (!token?.value) {
    return null;
  }

  return verifyToken(token.value, "access");
}

export function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 900000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require("bcryptjs");
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function isValidTokenFormat(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every(part => part.length > 0);
}
