import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const loyaltyTier = searchParams.get("loyaltyTier");
    const isVip = searchParams.get("isVip");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "totalSpent";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (loyaltyTier) where.loyaltyTier = loyaltyTier;
    if (isVip === "true") where.isVip = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [guests, stats] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy,
        include: {
          branch: { select: { name: true, location: true } },
          _count: { select: { bookings: true, orders: true, reviews: true } },
        },
      }),
      prisma.guest.aggregate({
        where,
        _count: true,
        _sum: { totalSpent: true, loyaltyPoints: true },
        _avg: { totalSpent: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      guests,
      stats: {
        total: stats._count,
        totalRevenue: stats._sum?.totalSpent || 0,
        totalPoints: stats._sum?.loyaltyPoints || 0,
        avgSpent: stats._avg?.totalSpent || 0,
        avgRating: 0,
      },
    });
  } catch (error) {
    console.error("Guests fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guests" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const guest = await prisma.guest.create({
      data: {
        ...body,
        loyaltyTier: "bronze",
        loyaltyPoints: 0,
      },
    });

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error("Guest creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create guest" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const guest = await prisma.guest.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error("Guest update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update guest" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
