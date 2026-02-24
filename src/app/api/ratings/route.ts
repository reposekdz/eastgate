import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { rating, guestName, guestEmail, comment, branchId } = await req.json();

    if (!rating || !guestName || !branchId) {
      return NextResponse.json(
        { success: false, error: "Rating, name, and branch are required" },
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
        type: "overall",
        rating: parseInt(rating),
        comment,
        guestName,
        guestEmail,
        branchId,
        isPublished: true,
      },
    });

    const avgRating = await prisma.review.aggregate({
      where: { branchId, isPublished: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.branch.update({
      where: { id: branchId },
      data: { 
        avgRating: avgRating._avg.rating || 0,
        totalRooms: { increment: 0 }
      },
    });

    return NextResponse.json({
      success: true,
      review,
      avgRating: avgRating._avg.rating || 0,
      totalReviews: avgRating._count,
    });
  } catch (error) {
    console.error("Rating submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit rating" },
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

    const where: any = { isPublished: true };
    if (branchId) where.branchId = branchId;

    const [reviews, avgRating, ratingDistribution] = await Promise.all([
      prisma.review.findMany({
        where,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { branch: { select: { name: true } } },
      }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where,
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      avgRating: avgRating._avg.rating || 0,
      totalReviews: avgRating._count,
      distribution: ratingDistribution,
    });
  } catch (error) {
    console.error("Ratings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ratings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
