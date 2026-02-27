import bcrypt from "bcryptjs";
import { generateToken } from "./jwt";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

export async function generateTokens(payload: any) {
  const accessToken = generateToken(payload);
  const refreshToken = generateToken({ ...payload, type: "refresh" });

  return {
    accessToken,
    refreshToken,
    expiresIn: 604800,
  };
}

export async function setAuthCookies(tokens: any, user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("eastgate-token", tokens.accessToken);
    localStorage.setItem("eastgate-refresh-token", tokens.refreshToken);
  }
}

export * from "./jwt";
