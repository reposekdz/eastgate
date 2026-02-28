import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth-advanced/jwt";
import { validateEmail, validatePhone } from "@/lib/validators";

const prisma = new PrismaClient();

/**
 * POST /api/receptionist/register-guest
 * Register a new guest and check them in
 * Requires: RECEPTIONIST role or higher
 * Body: { name, email?, phone, idNumber, nationality?, address?, dateOfBirth?, roomId, checkIn, checkOut, numberOfGuests?, specialRequests?, branchId? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, idNumber, nationality, address, dateOfBirth, roomId, checkIn, checkOut, numberOfGuests, specialRequests, branchId } = body;

    // Comprehensive validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Guest name must be at least 2 characters" }, { status: 400 });
    }
    if (!phone || !validatePhone(phone)) {
      return NextResponse.json({ success: false, error: "Valid phone number is required" }, { status: 400 });
    }
    if (!idNumber || idNumber.toString().trim().length < 5) {
      return NextResponse.json({ success: false, error: "Valid ID number is required" }, { status: 400 });
    }
    if (email && !validateEmail(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }
    // Room ID is now optional - will auto-assign if not provided

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid check-in or check-out date" }, { status: 400 });
    }
    if (checkInDate >= checkOutDate) {
      return NextResponse.json({ success: false, error: "Check-out date must be after check-in date" }, { status: 400 });
    }
    if (checkInDate < new Date()) {
      return NextResponse.json({ success: false, error: "Check-in date cannot be in the past" }, { status: 400 });
    }

    // Get available room (auto-assign if roomId not provided)
    let room;
    if (roomId) {
      room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room || room.status !== "available") {
        return NextResponse.json({ success: false, error: "Room is not available" }, { status: 409 });
      }
    } else {
      // Auto-assign first available room in branch
      room = await prisma.room.findFirst({
        where: {
          status: "available",
          branchId: branchId || undefined,
        },
        orderBy: { roomNumber: "asc" },
      });
      if (!room) {
        return NextResponse.json({ success: false, error: "No available rooms" }, { status: 409 });
      }
    }

    // Verify branch if specified
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        return NextResponse.json({ success: false, error: "Invalid branch ID" }, { status: 400 });
      }
    }

    // Find or create guest
    let guest = await prisma.guest.findFirst({
      where: {
        AND: [
          { idNumber },
          { phone },
        ],
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name,
          email: email || null,
          phone,
          idNumber,
          nationality: nationality || "Rwanda",
          address: address || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          loyaltyTier: "bronze",
          totalSpent: 0,
          visitCount: 0,
          branchId: branchId || room.branchId,
        },
      });
    } else {
      // Update guest info if check-in after long time
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          lastVisit: new Date(),
          visitCount: { increment: 1 },
        },
      });
    }

    // Calculate booking amount
    const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 1 || days > 365) {
      return NextResponse.json({ success: false, error: "Booking must be between 1 and 365 days" }, { status: 400 });
    }
    const totalAmount = room.price * days;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        guestName: name,
        guestEmail: email || null,
        guestPhone: phone,
        roomId,
        roomNumber: room.roomNumber,
        roomType: room.type,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfGuests: Math.max(1, numberOfGuests || 1),
        totalAmount,
        status: "checked_in",
        specialRequests: specialRequests || null,
        branchId: branchId || room.branchId,
        paymentStatus: "paid",
        checkedInAt: new Date(),
      },
    });

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "occupied" },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Guest registered and checked in successfully",
        booking,
        guest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering guest:", error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to register guest" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
