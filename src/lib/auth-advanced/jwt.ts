import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "eastgate-hotel-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
