/**
 * Token Refresh API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken, setAuthCookies, verifyToken } from "@/lib/auth-advanced";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("eastgate-refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No refresh token provided" },
        { status: 401 }
      );
    }

    const tokens = await refreshAccessToken(refreshToken);

    if (!tokens) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Try to extract user info from new access token for client cookie
    const payload = verifyToken(tokens.accessToken, "access");
    await setAuthCookies(tokens, payload ? {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
    } : undefined);

    return NextResponse.json({
      success: true,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (error) {
    console.error("[REFRESH API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
