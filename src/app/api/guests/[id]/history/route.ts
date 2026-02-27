import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          include: { room: { select: { number: true, type: true } } },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          include: { items: { include: { menuItem: { select: { name: true } } } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    const totalSpent = guest.bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0) + guest.orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalVisits = guest.bookings.filter(b => b.status === "checked_out").length;
    const lastVisit = guest.bookings[0]?.checkOutTime || null;

    return NextResponse.json({
      success: true,
      guest: {
        ...guest,
        stats: { totalSpent, totalVisits, lastVisit },
      },
    });
  } catch (error) {
    console.error("Guest history error:", error);
    return NextResponse.json({ error: "Failed to fetch guest history" }, { status: 500 });
  }
}
