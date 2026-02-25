/**
 * Guest Dashboard API
 * Guests view their bookings, loyalty points, and account info
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-advanced";
import { successResponse, errorResponse } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", [], 401);

    // Get guest by email or user ID (guests don't have typical user IDs)
    const { searchParams } = new URL(req.url);
    const guestEmail = searchParams.get("email") || user.email;

    if (!guestEmail) {
      return errorResponse("Guest email is required", [], 400);
    }

    // Fetch guest profile
    const guest = await prisma.guest.findUnique({
      where: { email: guestEmail },
    });

    if (!guest) {
      return errorResponse("Guest profile not found", [], 404);
    }

    // Fetch guest's bookings with room details
    const [bookings, upcomingBookings, pastBookings, reviews, payments] =
      await Promise.all([
        // All bookings
        prisma.booking.findMany({
          where: { guestId: guest.id },
          include: {
            room: {
              select: {
                id: true,
                number: true,
                type: true,
                price: true,
                imageUrl: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
                location: true,
                phone: true,
              },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                paymentMethod: true,
              },
            },
          },
          orderBy: { checkIn: "desc" },
        }),

        // Upcoming bookings
        prisma.booking.findMany({
          where: {
            guestId: guest.id,
            checkIn: { gte: new Date() },
            status: { in: ["pending", "confirmed"] },
          },
          include: {
            room: { select: { number: true, type: true, price: true } },
            branch: { select: { name: true, location: true } },
          },
          orderBy: { checkIn: "asc" },
          take: 5,
        }),

        // Past bookings
        prisma.booking.findMany({
          where: {
            guestId: guest.id,
            checkOut: { lt: new Date() },
            status: { in: ["checked_out", "cancelled"] },
          },
          include: {
            room: { select: { number: true, type: true } },
            branch: { select: { name: true } },
          },
          orderBy: { checkOut: "desc" },
          take: 5,
        }),

        // Guest reviews
        prisma.review.findMany({
          where: { guestName: guest.name },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            branch: { select: { name: true } },
          },
        }),

        // Payments made by guest
        prisma.payment.findMany({
          where: {
            booking: { guestId: guest.id },
          },
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    // Calculate statistics
    const totalSpent = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalNights = bookings.reduce((sum, b) => sum + b.nights, 0);
    const totalStays = bookings.filter((b) => b.status === "checked_out").length;

    return successResponse({
      profile: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        avatar: guest.avatar,
        nationality: guest.nationality,
        loyaltyTier: guest.loyaltyTier,
        loyaltyPoints: guest.loyaltyPoints,
        isVip: guest.isVip,
      },
      statistics: {
        totalStays,
        totalNights,
        totalSpent,
        averageSpentPerStay: totalStays > 0 ? Math.round(totalSpent / totalStays) : 0,
        memberSince: guest.createdAt,
        lastVisit: guest.lastVisit,
      },
      upcomingBookings,
      pastBookings,
      allBookingsCount: bookings.length,
      reviews,
      recentPayments: payments,
    });
  } catch (error: any) {
    console.error("Guest dashboard fetch error:", error);
    return errorResponse("Failed to fetch guest dashboard", [], 500);
  }
}
