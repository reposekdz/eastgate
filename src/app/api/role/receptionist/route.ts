import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/role/receptionist - Receptionist dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only receptionist and above can access
    if (!["RECEPTIONIST", "BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!userBranchId) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayCheckIns,
      todayCheckOuts,
      todayBookings,
      availableRooms,
      occupiedRooms,
      pendingPayments,
      todayRevenue,
    ] = await Promise.all([
      // Today's check-ins
      prisma.booking.count({
        where: {
          branchId: userBranchId,
          checkInDate: { gte: today, lt: tomorrow },
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
      }),

      // Today's check-outs
      prisma.booking.count({
        where: {
          branchId: userBranchId,
          checkOutDate: { gte: today, lt: tomorrow },
          status: "CHECKED_IN",
        },
      }),

      // Today's new bookings
      prisma.booking.count({
        where: {
          branchId: userBranchId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // Available rooms
      prisma.room.count({
        where: { branchId: userBranchId, status: "AVAILABLE" },
      }),

      // Occupied rooms
      prisma.room.count({
        where: { branchId: userBranchId, status: "OCCUPIED" },
      }),

      // Pending payments
      prisma.booking.count({
        where: {
          branchId: userBranchId,
          paymentStatus: "PENDING",
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
        },
      }),

      // Today's revenue
      prisma.payment.aggregate({
        where: {
          branchId: userBranchId,
          status: "PAID",
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      }),
    ]);

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { branchId: userBranchId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        guest: { select: { firstName: true, lastName: true, phone: true } },
        room: { select: { number: true, type: true } },
      },
    });

    // Get expected arrivals/departures today
    const expectedArrivals = await prisma.booking.findMany({
      where: {
        branchId: userBranchId,
        checkInDate: { gte: today, lt: tomorrow },
        status: "CONFIRMED",
      },
      include: {
        guest: { select: { firstName: true, lastName: true, phone: true } },
        room: { select: { number: true, type: true } },
      },
    });

    const expectedDepartures = await prisma.booking.findMany({
      where: {
        branchId: userBranchId,
        checkOutDate: { gte: today, lt: tomorrow },
        status: "CHECKED_IN",
      },
      include: {
        guest: { select: { firstName: true, lastName: true, phone: true } },
        room: { select: { number: true, type: true } },
      },
    });

    return NextResponse.json({
      success: true,
      dashboard: {
        todayStats: {
          checkIns: todayCheckIns,
          checkOuts: todayCheckOuts,
          newBookings: todayBookings,
          availableRooms,
          occupiedRooms,
          pendingPayments,
          todayRevenue: (todayRevenue._sum.amount || 0) / 100,
        },
        expectedArrivals,
        expectedDepartures,
        recentBookings: recentBookings.map(b => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          guest: `${b.guest.firstName} ${b.guest.lastName}`,
          phone: b.guest.phone,
          room: b.room.number,
          status: b.status,
          paymentStatus: b.paymentStatus,
          checkIn: b.checkInDate,
          checkOut: b.checkOutDate,
        })),
      },
    });
  } catch (error) {
    console.error("Receptionist dashboard error:", error);
    return NextResponse.json({ error: "Failed to get dashboard" }, { status: 500 });
  }
}

// POST /api/role/receptionist - Receptionist actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["RECEPTIONIST", "BRANCH_MANAGER", "SUPER_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { action, bookingId, guestId, data } = body;

    switch (action) {
      case "CHECK_IN": {
        if (!bookingId) {
          return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
        }

        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CHECKED_IN",
            actualCheckIn: new Date(),
          },
          include: {
            guest: true,
            room: true,
          },
        });

        // Update room status
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "OCCUPIED" },
        });

        // Update guest stats
        await prisma.guest.update({
          where: { id: booking.guestId },
          data: {
            totalStays: { increment: 1 },
            lastVisit: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          booking,
          message: "Guest checked in successfully",
        });
      }

      case "CHECK_OUT": {
        if (!bookingId) {
          return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
        }

        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: "CHECKED_OUT",
            actualCheckOut: new Date(),
          },
          include: {
            guest: true,
            room: true,
          },
        });

        // Update room status
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "CLEANING" },
        });

        return NextResponse.json({
          success: true,
          booking,
          message: "Guest checked out successfully",
        });
      }

      case "CREATE_BOOKING": {
        const { guestId, roomId, checkInDate, checkOutDate, adults, children, roomRate, totalAmount, notes } = data;

        if (!guestId || !roomId || !checkInDate || !checkOutDate) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Generate booking number
        const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        // Calculate nights
        const nights = Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Reserve room
        await prisma.room.update({
          where: { id: roomId },
          data: { status: "RESERVED" },
        });

        const booking = await prisma.booking.create({
          data: {
            bookingNumber,
            guestId,
            roomId,
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            nights,
            adults: adults || 1,
            children: children || 0,
            roomRate,
            totalAmount,
            finalAmount: totalAmount,
            taxAmount: Math.round(totalAmount * 0.18),
            status: "CONFIRMED",
            paymentStatus: "PENDING",
            branchId: userBranchId,
            createdById: session.user.id,
            notes,
          },
          include: {
            guest: true,
            room: true,
          },
        });

        return NextResponse.json({
          success: true,
          booking,
          message: "Booking created successfully",
        });
      }

      case "UPDATE_GUEST": {
        if (!guestId || !data) {
          return NextResponse.json({ error: "Guest ID and data required" }, { status: 400 });
        }

        const guest = await prisma.guest.update({
          where: { id: guestId },
          data: data,
        });

        return NextResponse.json({
          success: true,
          guest,
          message: "Guest updated successfully",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Receptionist action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
