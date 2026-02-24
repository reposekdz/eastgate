import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { type, rating, title, comment, guestName, guestEmail, branchId, roomId } = await req.json();

    if (!type || !rating || !guestName || !branchId) {
      return NextResponse.json(
        { success: false, error: "Required fields missing" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        type,
        rating: parseInt(rating),
        title,
        comment,
        guestName,
        guestEmail,
        branchId,
        roomId,
        isPublished: false,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = { isPublished: true };
    if (branchId) where.branchId = branchId;
    if (type) where.type = type;

    const [reviews, avgRating, totalReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          branch: { select: { name: true } },
          room: { select: { number: true, type: true } },
        },
      }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      avgRating: avgRating._avg.rating || 0,
      totalReviews,
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
