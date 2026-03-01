import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    const where: any = { branchId: user.branchId };

    const allRooms = await prisma.room.findMany({
      where,
      include: {
        bookings: {
          where: {
            status: { in: ["confirmed", "checked_in"] },
            ...(checkIn && checkOut ? {
              OR: [
                {
                  checkIn: { lte: new Date(checkOut) },
                  checkOut: { gte: new Date(checkIn) },
                }
              ]
            } : {})
          }
        }
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }]
    });

    const availableRooms = allRooms.filter(room => room.bookings.length === 0 && room.status === "available");

    return successResponse({
      rooms: availableRooms.map(room => ({
        id: room.id,
        number: room.number,
        type: room.type,
        price: room.price,
        floor: room.floor,
        maxOccupancy: room.maxOccupancy,
        imageUrl: room.imageUrl,
        description: room.description,
        isAvailable: true
      })),
      total: availableRooms.length
    });
  } catch (error: any) {
    console.error("Room availability error:", error);
    return errorResponse("Failed to fetch room availability", [], 500);
  }
}