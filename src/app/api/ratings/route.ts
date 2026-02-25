import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const { rating, guestName, guestEmail, comment, branchId } = await req.json();

    if (!rating || !guestName || !branchId) {
      return errorResponse("Rating, name, and branch are required", [], 400);
    }

    if (rating < 1 || rating > 5) {
      return errorResponse("Rating must be between 1 and 5", [], 400);
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
        rating: avgRating._avg.rating || 0,
        totalRooms: { increment: 0 }
      },
    });

    return successResponse({
      review,
      avgRating: avgRating._avg.rating || 0,
      totalReviews: avgRating._count,
    }, 201);
  } catch (error) {
    console.error("Rating submission error:", error);
    return errorResponse("Failed to submit rating", [], 500);
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

    return successResponse({
      reviews,
      avgRating: avgRating._avg.rating || 0,
      totalReviews: avgRating._count,
      distribution: ratingDistribution,
    });
  } catch (error) {
    console.error("Ratings fetch error:", error);
    return errorResponse("Failed to fetch ratings", [], 500);
  }
}
