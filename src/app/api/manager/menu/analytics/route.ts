import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json({ success: false, error: "Branch ID required" }, { status: 400 });
    }

    const [
      totalItems,
      categoryStats,
      priceStats,
      dietaryStats,
      topItems,
      recentItems,
      profitMargins,
    ] = await Promise.all([
      prisma.menuItem.count({ where: { branchId } }),
      
      prisma.menuItem.groupBy({
        by: ["category"],
        where: { branchId },
        _count: true,
        _avg: { price: true, rating: true },
        _sum: { totalOrders: true },
      }),
      
      prisma.menuItem.aggregate({
        where: { branchId },
        _avg: { price: true, costPrice: true },
        _min: { price: true },
        _max: { price: true },
      }),
      
      prisma.menuItem.aggregate({
        where: { branchId },
        _count: {
          vegetarian: true,
          vegan: true,
          glutenFree: true,
          halal: true,
          spicy: true,
        },
      }),
      
      prisma.menuItem.findMany({
        where: { branchId },
        orderBy: { totalOrders: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          totalOrders: true,
          rating: true,
        },
      }),
      
      prisma.menuItem.findMany({
        where: { branchId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          createdAt: true,
        },
      }),
      
      prisma.menuItem.findMany({
        where: { 
          branchId,
          costPrice: { not: null },
        },
        select: {
          id: true,
          name: true,
          price: true,
          costPrice: true,
        },
      }),
    ]);

    const profitAnalysis = profitMargins.map(item => ({
      ...item,
      profit: item.price - (item.costPrice || 0),
      margin: item.costPrice ? ((item.price - item.costPrice) / item.price * 100).toFixed(2) : 0,
    }));

    const avgProfit = profitAnalysis.reduce((sum, item) => sum + item.profit, 0) / profitAnalysis.length;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalItems,
          avgPrice: priceStats._avg.price,
          avgCost: priceStats._avg.costPrice,
          minPrice: priceStats._min.price,
          maxPrice: priceStats._max.price,
          avgProfit,
        },
        categoryBreakdown: categoryStats.map(cat => ({
          category: cat.category,
          count: cat._count,
          avgPrice: cat._avg.price,
          avgRating: cat._avg.rating,
          totalOrders: cat._sum.totalOrders,
        })),
        dietary: {
          vegetarian: dietaryStats._count.vegetarian,
          vegan: dietaryStats._count.vegan,
          glutenFree: dietaryStats._count.glutenFree,
          halal: dietaryStats._count.halal,
          spicy: dietaryStats._count.spicy,
        },
        topPerformers: topItems,
        recentAdditions: recentItems,
        profitMargins: profitAnalysis.sort((a, b) => b.profit - a.profit).slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
