import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const canAssignRoom = ["receptionist", "branch_manager", "super_admin", "super_manager", "waiter", "restaurant_staff"].includes(user.role.toLowerCase());
    
    if (!canAssignRoom) {
      return errorResponse("Insufficient permissions", [], 403);
    }

    const body = await req.json();
    const { roomId, checkIn, checkOut, adults = 1, children = 0, specialRequests } = body;

    if (!roomId || !checkIn || !checkOut) {
      return errorResponse("Missing required fields", [], 400);
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return errorResponse("Guest not found", [], 404);
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return errorResponse("Room not found", [], 404);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * room.price;

    const bookingCount = await prisma.booking.count();
    const bookingRef = `BK${String(bookingCount + 1).padStart(8, "0")}`;

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        guestName: guest.name,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        guestId: guest.id,
        roomId,
        roomNumber: room.number,
        roomType: room.type,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        adults,
        children,
        totalAmount,
        specialRequests,
        status: "confirmed",
        branchId: guest.branchId,
      }
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { status: "occupied" }
    });

    return successResponse({ booking }, 201);
  } catch (error: any) {
    console.error("Room assignment error:", error);
    return errorResponse("Failed to assign room", [], 500);
  }
}