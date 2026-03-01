import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("eastgate-auth");
    
    if (!authCookie) {
      return errorResponse("Unauthorized", [], 401);
    }

    let authData;
    try {
      authData = JSON.parse(decodeURIComponent(authCookie.value));
    } catch {
      return errorResponse("Invalid auth data", [], 401);
    }

    const user = authData.user;
    const guestId = params.id;
    const body = await req.json();
    const { action } = body;

    if (action === "checkout") {
      // Find active booking for guest
      const booking = await prisma.booking.findFirst({
        where: {
          guestId,
          status: "checked_in",
          branchId: user.branchId
        },
        include: { room: true }
      });

      if (!booking) {
        return errorResponse("No active booking found for guest", [], 404);
      }

      // Update booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "checked_out",
          checkedOutAt: new Date()
        }
      });

      // Update room status
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "cleaning" }
      });

      return successResponse({ message: "Guest checked out successfully" });
    }

    return errorResponse("Invalid action", [], 400);
  } catch (error: any) {
    console.error("Guest update error:", error);
    return errorResponse("Failed to update guest", [], 500);
  }
}