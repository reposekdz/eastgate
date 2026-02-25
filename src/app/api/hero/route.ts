import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = { isActive: true };
    if (branchId) where.branchId = branchId;

    const heroContent = await prisma.heroContent.findFirst({
      where,
      orderBy: { order: "asc" },
    });

    if (!heroContent) {
      return NextResponse.json({
        success: true,
        data: {
          title: "Exceptional Hospitality",
          subtitle: "Redefining Luxury in East Africa",
          description: "Immerse yourself in world-class service where every detail is meticulously crafted. From personalized concierge to state-of-the-art amenities, experience hospitality that transcends expectations in Rwanda's most prestigious hotel.",
          imageUrl: "/images/hero-default.jpg",
          ctaText: "Explore Our Services",
          ctaLink: "/rooms",
        },
      });
    }

    return NextResponse.json({ success: true, data: heroContent });
  } catch (error) {
    console.error("Hero content fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hero content" },
      { status: 500 }
    );
  }
}
