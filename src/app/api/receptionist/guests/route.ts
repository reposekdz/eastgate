import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (branchId) where.branchId = branchId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
      ];
    }

    const guests = await prisma.guest.findMany({
      where,
      include: {
        bookings: {
          orderBy: { checkIn: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformedGuests = guests.map((guest) => {
      const latestBooking = guest.bookings[0];
      return {
        id: guest.id,
        fullName: guest.name,
        email: guest.email || "N/A",
        phone: guest.phone,
        nationality: guest.nationality,
        idType: "passport",
        idNumber: guest.idNumber,
        roomNumber: latestBooking?.roomNumber || "N/A",
        checkInDate: latestBooking?.checkIn?.toISOString() || new Date().toISOString(),
        checkOutDate: latestBooking?.checkOut?.toISOString() || new Date().toISOString(),
        numberOfGuests: latestBooking?.numberOfGuests || 1,
        specialRequests: latestBooking?.specialRequests || "",
        status: latestBooking?.status || "checked_out",
        branchId: guest.branchId,
      };
    });

    return NextResponse.json({
      success: true,
      guests: transformedGuests,
      total: transformedGuests.length,
    });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guests" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
