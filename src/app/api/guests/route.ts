import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// GET - Fetch guests with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const loyaltyTier = searchParams.get("loyaltyTier");
    const userBranchId = session.user.branchId as string;
    const userRole = session.user.role as string;

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole) && userBranchId) {
      where.branchId = userBranchId;
    }

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Filter by loyalty tier
    if (loyaltyTier) {
      where.loyaltyTier = loyaltyTier;
    }

    const guests = await prisma.guest.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // Get statistics
    const stats = await prisma.guest.groupBy({
      by: ["loyaltyTier"],
      where: where.branchId ? { branchId: where.branchId } : {},
      _count: true,
      _sum: {
        totalSpent: true,
        loyaltyPoints: true,
      },
    });

    return NextResponse.json({
      success: true,
      guests,
      stats,
    });
  } catch (error) {
    console.error("Guests fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}

// POST - Create new guest (or register guest)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    // Allow guest registration without session
    const body = await req.json();
    const {
      name,
      email,
      phone,
      avatar,
      nationality,
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "name and email are required" },
        { status: 400 }
      );
    }

    // Check if guest already exists
    const existingGuest = await prisma.guest.findUnique({
      where: { email },
    });

    if (existingGuest) {
      return NextResponse.json({ error: "Guest with this email already exists" }, { status: 400 });
    }

    // Determine branch ID
    let branchId = "";
    if (session?.user?.branchId) {
      branchId = session.user.branchId;
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        phone,
        avatar,
        nationality,
        loyaltyTier: "standard",
        loyaltyPoints: 0,
        totalStays: 0,
        totalSpent: 0,
        branchId,
      },
    });

    // Log if staff created
    if (session?.user) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.email || undefined,
          branchId,
          action: "guest_created",
          entity: "guest",
          entityId: guest.id,
          details: { name, email },
        },
      });
    }

    return NextResponse.json({
      success: true,
      guest,
    });
  } catch (error) {
    console.error("Guest creation error:", error);
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
}

// PUT - Update guest
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      email,
      phone,
      avatar,
      nationality,
      loyaltyTier,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Guest ID is required" },
        { status: 400 }
      );
    }

    // Check if guest exists
    const existingGuest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!existingGuest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email && email !== existingGuest.email) {
      // Check if new email is taken
      const emailExists = await prisma.guest.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (loyaltyTier) updateData.loyaltyTier = loyaltyTier;

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: updateData,
    });

    // Log update
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "guest_updated",
        entity: "guest",
        entityId: id,
        details: { name, performedBy: session.user.name },
      },
    });

    return NextResponse.json({
      success: true,
      guest: updatedGuest,
    });
  } catch (error) {
    console.error("Guest update error:", error);
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

// DELETE - Delete guest
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers can delete guests
    const userRole = session.user.role as string;
    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Manager access only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Guest ID is required" },
        { status: 400 }
      );
    }

    // Check if guest exists
    const existingGuest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!existingGuest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Delete guest
    await prisma.guest.delete({
      where: { id },
    });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "guest_deleted",
        entity: "guest",
        entityId: id,
        details: { name: existingGuest.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Guest deleted successfully",
    });
  } catch (error) {
    console.error("Guest deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete guest" },
      { status: 500 }
    );
  }
}
