/**
 * Logout API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, revokeToken } from "@/lib/auth-advanced";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("eastgate-token")?.value;
    const refreshToken = cookieStore.get("eastgate-refresh")?.value;

    if (accessToken) revokeToken(accessToken);
    if (refreshToken) revokeToken(refreshToken);

    await clearAuthCookies();

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("[LOGOUT API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
