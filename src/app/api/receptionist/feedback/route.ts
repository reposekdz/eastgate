import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const feedbacks = await prisma.review.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      feedbacks,
      total: feedbacks.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, guestName, rating, comment, branchId } = body;

    const feedback = await prisma.review.create({
      data: {
        type: "hotel",
        rating,
        comment,
        guestName,
        guestId,
        branchId,
        verified: true,
        isPublished: false,
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
