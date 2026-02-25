import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

/**
 * GET /api/guest/bookings
 * Fetch guest's booking history
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (session.role !== "GUEST") {
      return NextResponse.json({ success: false, error: "Only guests can access this endpoint" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "10"));

    const guest = await prisma.guest.findUnique({
      where: { email: session.email },
    });

    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest profile not found" }, { status: 404 });
    }

    const where: any = { guestId: guest.id };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { checkIn: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          bookingRef: true,
          status: true,
          checkIn: true,
          checkOut: true,
          totalAmount: true,
          specialRequests: true,
          createdAt: true,
          updatedAt: true,
          branchId: true,
          roomId: true,
          guestId: true,
          rating: true,
          promotionId: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const stats = {
      total,
      active: bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };

    const formattedBookings = bookings.map((booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...booking,
        nights,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        statistics: stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[GUEST_BOOKINGS] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

