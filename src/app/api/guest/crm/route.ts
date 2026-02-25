/**
 * Guest CRM API
 * Advanced guest relationship management with interactions, preferences, and communications
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interaction types
const INTERACTION_TYPES = [
  "phone_call",
  "email",
  "meeting",
  "complaint",
  "compliment",
  "request",
  "feedback",
  "follow_up",
  "personal_note",
];

// GET - Fetch CRM data for guests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");
    const branchId = searchParams.get("branchId");
    const includeInteractions = searchParams.get("interactions") === "true";
    const includePreferences = searchParams.get("preferences") === "true";
    const includeHistory = searchParams.get("history") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!guestId) {
      // Return all guests with CRM data
      const guests = await prisma.guest.findMany({
        where: branchId ? { branchId } : {},
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          loyaltyTier: true,
          loyaltyPoints: true,
          totalSpent: true,
          totalStays: true,
          isVip: true,
          lastVisit: true,
          preferences: true,
          specialRequests: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { lastVisit: "desc" },
        take: 50,
      });

      return NextResponse.json({
        success: true,
        guests,
      });
    }

    // Get specific guest details
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          take: includeHistory ? 20 : 5,
          select: {
            id: true,
            bookingRef: true,
            roomNumber: true,
            roomType: true,
            checkIn: true,
            checkOut: true,
            totalAmount: true,
            status: true,
            rating: true,
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: includeHistory ? 20 : 5,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 });
    }

    const response: any = {
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        avatar: guest.avatar,
        nationality: guest.nationality,
        idType: guest.idType,
        idNumber: guest.idNumber,
        dateOfBirth: guest.dateOfBirth,
        gender: guest.gender,
        address: guest.address,
        city: guest.city,
        country: guest.country,
        loyaltyTier: guest.loyaltyTier,
        loyaltyPoints: guest.loyaltyPoints,
        totalSpent: guest.totalSpent,
        totalStays: guest.totalStays,
        isVip: guest.isVip,
        lastVisit: guest.lastVisit,
        preferences: guest.preferences,
        specialRequests: guest.specialRequests,
        notes: guest.notes,
        createdAt: guest.createdAt,
      },
    };

    // Include booking history
    if (includeHistory) {
      response.bookings = guest.bookings;
      response.orders = guest.orders;
      
      // Calculate statistics
      const totalNights = guest.bookings.reduce((sum, b) => {
        if (b.checkIn && b.checkOut) {
          const nights = Math.ceil((b.checkOut.getTime() - b.checkIn.getTime()) / (1000 * 60 * 60 * 24));
          return sum + nights;
        }
        return sum;
      }, 0);
      
      response.stats = {
        totalBookings: guest.bookings.length,
        totalNights,
        totalSpent: guest.totalSpent,
        avgStayLength: guest.bookings.length > 0 ? Math.round(totalNights / guest.bookings.length) : 0,
        avgOrderValue: guest.orders.length > 0 
          ? guest.orders.reduce((sum, o) => sum + o.total, 0) / guest.orders.length 
          : 0,
        favoriteRoomType: guest.bookings.length > 0
          ? guest.bookings.reduce((acc, b) => {
              acc[b.roomType] = (acc[b.roomType] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          : {},
      };
    }

    // Get activity logs for this guest
    if (includeInteractions) {
      const activityLogs = await prisma.activityLog.findMany({
        where: {
          entity: "guest",
          entityId: guestId,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      response.interactions = activityLogs;
    }

    // Calculate guest value score (0-100)
    const valueScore = Math.min(100, Math.round(
      (guest.totalSpent / 10000) * 30 + // 30% based on total spent
      (guest.totalStays / 20) * 30 +    // 30% based on stays
      (guest.loyaltyPoints / 5000) * 20 + // 20% based on loyalty
      (guest.isVip ? 20 : 0)            // 20% for VIP status
    ));
    
    response.guestScore = valueScore;

    // Get similar guests (same country, similar spending)
    if (branchId) {
      const similarGuests = await prisma.guest.findMany({
        where: {
          branchId,
          id: { not: guestId },
          country: guest.country,
          totalSpent: {
            gte: guest.totalSpent * 0.7,
            lte: guest.totalSpent * 1.3,
          },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          totalSpent: true,
          totalStays: true,
        },
      });
      response.similarGuests = similarGuests;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("CRM GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch CRM data", message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create interaction or update guest data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, action, data, staffId } = body;

    if (!guestId) {
      return NextResponse.json({ success: false, error: "Guest ID is required" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 });
    }

    if (action === "update_preferences") {
      // Update guest preferences
      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: { preferences: data },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: guest.branchId,
          action: "preferences_updated",
          entity: "guest",
          entityId: guestId,
          details: { preferences: data },
        },
      });

      return NextResponse.json({
        success: true,
        guest: updatedGuest,
        message: "Guest preferences updated",
      });
    }

    if (action === "add_note") {
      // Add note to guest
      const currentNotes = guest.notes || "";
      const newNote = `\n[${new Date().toISOString()}] ${data.note}`;
      
      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: { notes: currentNotes + newNote },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: guest.branchId,
          action: "note_added",
          entity: "guest",
          entityId: guestId,
          details: { note: data.note },
        },
      });

      return NextResponse.json({
        success: true,
        guest: updatedGuest,
        message: "Note added to guest",
      });
    }

    if (action === "set_vip") {
      // Set VIP status
      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: { isVip: data.isVip },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: guest.branchId,
          action: data.isVip ? "vip_added" : "vip_removed",
          entity: "guest",
          entityId: guestId,
        },
      });

      return NextResponse.json({
        success: true,
        guest: updatedGuest,
        message: data.isVip ? "Guest set as VIP" : "VIP status removed",
      });
    }

    if (action === "log_interaction") {
      // Log an interaction
      if (!INTERACTION_TYPES.includes(data.type)) {
        return NextResponse.json(
          { success: false, error: "Invalid interaction type" },
          { status: 400 }
        );
      }

      // Log as activity
      const interaction = await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: guest.branchId,
          action: `interaction_${data.type}`,
          entity: "guest",
          entityId: guestId,
          details: {
            type: data.type,
            summary: data.summary,
            outcome: data.outcome,
            followUp: data.followUp,
          },
        },
      });

      return NextResponse.json({
        success: true,
        interaction,
        message: "Interaction logged",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("CRM POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process CRM action", message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update guest information
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, ...updateData } = body;

    if (!guestId) {
      return NextResponse.json({ success: false, error: "Guest ID is required" }, { status: 400 });
    }

    // Remove non-updatable fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.totalSpent;
    delete updateData.totalStays;
    delete updateData.loyaltyPoints;

    const guest = await prisma.guest.update({
      where: { id: guestId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      guest,
      message: "Guest updated successfully",
    });
  } catch (error: any) {
    console.error("CRM PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update guest", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove guest note
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json({ success: false, error: "Guest ID is required" }, { status: 400 });
    }

    // Clear guest notes
    await prisma.guest.update({
      where: { id: guestId },
      data: { notes: "" },
    });

    return NextResponse.json({
      success: true,
      message: "Guest notes cleared",
    });
  } catch (error: any) {
    console.error("CRM DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear notes", message: error.message },
      { status: 500 }
    );
  }
}
