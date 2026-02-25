/**
 * Loyalty Program API
 * Complete loyalty management with points, tiers, rewards, and redemptions
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Loyalty tier thresholds and benefits
const TIER_CONFIG = {
  bronze: { minPoints: 0, maxPoints: 999, discount: 0, bonusPoints: 1.0, name: "Bronze" },
  silver: { minPoints: 1000, maxPoints: 4999, discount: 5, bonusPoints: 1.25, name: "Silver" },
  gold: { minPoints: 5000, maxPoints: 14999, discount: 10, bonusPoints: 1.5, name: "Gold" },
  platinum: { minPoints: 15000, maxPoints: 999999, discount: 15, bonusPoints: 2.0, name: "Platinum" },
};

// Points earning rules
const POINTS_PER_CURRENCY = 1; // 1 point per currency unit spent

// GET - Fetch loyalty program overview and member statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const guestId = searchParams.get("guestId");
    const tier = searchParams.get("tier");
    const includeStats = searchParams.get("stats") === "true";

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (guestId) where.id = guestId;
    if (tier) where.loyaltyTier = tier;

    const guests = await prisma.guest.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        totalStays: true,
        totalSpent: true,
        isVip: true,
        lastVisit: true,
        createdAt: true,
      },
      orderBy: { loyaltyPoints: "desc" },
    });

    // Calculate tier statistics
    const tierStats = {
      bronze: guests.filter((g) => g.loyaltyTier === "bronze").length,
      silver: guests.filter((g) => g.loyaltyTier === "silver").length,
      gold: guests.filter((g) => g.loyaltyTier === "gold").length,
      platinum: guests.filter((g) => g.loyaltyTier === "platinum").length,
    };

    // Calculate total points in system
    const totalPoints = guests.reduce((sum, g) => sum + g.loyaltyPoints, 0);
    const totalValue = guests.reduce((sum, g) => sum + g.totalSpent, 0);

    // Points expiration check (points older than 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const expiringPoints = await prisma.guest.aggregate({
      where: {
        ...(branchId ? { branchId } : {}),
        lastVisit: { lt: twelveMonthsAgo },
        loyaltyPoints: { gt: 0 },
      },
      _sum: { loyaltyPoints: true },
    });

    // Recent tier upgrades
    const recentTierChanges = await prisma.activityLog.count({
      where: {
        action: "tier_upgrade",
        ...(branchId ? { branchId } : {}),
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    // Get top spenders
    const topSpenders = guests.slice(0, 10);

    // Get most visits
    const mostLoyal = [...guests].sort((a, b) => b.totalStays - a.totalStays).slice(0, 10);

    const response: any = {
      success: true,
      members: guests,
      tierConfig: TIER_CONFIG,
      tierStats,
    };

    if (includeStats) {
      response.stats = {
        totalMembers: guests.length,
        totalPoints: totalPoints,
        totalValue: Math.round(totalValue),
        expiringPoints: expiringPoints._sum.loyaltyPoints || 0,
        recentTierChanges,
        avgPointsPerMember: guests.length > 0 ? Math.round(totalPoints / guests.length) : 0,
        avgSpendPerMember: guests.length > 0 ? Math.round(totalValue / guests.length) : 0,
      };
      response.topSpenders = topSpenders;
      response.mostLoyal = mostLoyal;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Loyalty GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch loyalty data", message: error.message },
      { status: 500 }
    );
  }
}

// POST - Add points to a guest
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, points, reason, amount, branchId, staffId } = body;

    if (!guestId || !points || points <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid guestId and positive points are required" },
        { status: 400 }
      );
    }

    // Get current guest data
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 });
    }

    // Calculate points (either direct points or from amount spent)
    let pointsToAdd = points;
    if (amount && amount > 0) {
      const tierConfig = TIER_CONFIG[guest.loyaltyTier as keyof typeof TIER_CONFIG];
      pointsToAdd = Math.floor(amount * POINTS_PER_CURRENCY * tierConfig.bonusPoints);
    }

    // Update guest points
    const newPoints = guest.loyaltyPoints + pointsToAdd;
    
    // Check for tier upgrade
    let newTier = guest.loyaltyTier;
    if (newPoints >= TIER_CONFIG.platinum.minPoints) newTier = "platinum";
    else if (newPoints >= TIER_CONFIG.gold.minPoints) newTier = "gold";
    else if (newPoints >= TIER_CONFIG.silver.minPoints) newTier = "silver";
    
    const isUpgrade = newTier !== guest.loyaltyTier;

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        loyaltyPoints: newPoints,
        loyaltyTier: newTier,
        totalStays: guest.totalStays + (reason === "stay" ? 1 : 0),
        totalSpent: amount ? guest.totalSpent + amount : guest.totalSpent,
        lastVisit: new Date(),
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: staffId,
        branchId: branchId || guest.branchId,
        action: isUpgrade ? "tier_upgrade" : "points_earned",
        entity: "guest",
        entityId: guestId,
        details: {
          pointsAdded: pointsToAdd,
          previousPoints: guest.loyaltyPoints,
          newPoints: newPoints,
          reason,
          amount,
          tierChange: isUpgrade ? { from: guest.loyaltyTier, to: newTier } : null,
        },
      },
    });

    // Create notification for tier upgrade
    if (isUpgrade) {
      await prisma.notification.create({
        data: {
          userId: staffId,
          branchId: branchId || guest.branchId,
          type: "success",
          title: "Tier Upgrade!",
          message: `${guest.name} has been upgraded to ${TIER_CONFIG[newTier as keyof typeof TIER_CONFIG].name} tier!`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isUpgrade ? `Guest upgraded to ${newTier}!` : "Points added successfully",
      guest: {
        id: updatedGuest.id,
        name: updatedGuest.name,
        loyaltyPoints: updatedGuest.loyaltyPoints,
        loyaltyTier: updatedGuest.loyaltyTier,
        totalStays: updatedGuest.totalStays,
        totalSpent: updatedGuest.totalSpent,
      },
      pointsAdded: pointsToAdd,
      tierUpgrade: isUpgrade,
      newTier,
    });
  } catch (error: any) {
    console.error("Loyalty POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add points", message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Redeem points or change tier manually
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, action, points, newTier, branchId, staffId, rewardId } = body;

    if (!guestId) {
      return NextResponse.json({ success: false, error: "Guest ID is required" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 });
    }

    if (action === "redeem") {
      // Redeem points for rewards
      if (!points || points <= 0) {
        return NextResponse.json({ success: false, error: "Valid points required for redemption" }, { status: 400 });
      }

      if (guest.loyaltyPoints < points) {
        return NextResponse.json({ success: false, error: "Insufficient points" }, { status: 400 });
      }

      // Calculate reward value (100 points = $10 value)
      const rewardValue = (points / 100) * 10;

      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: { loyaltyPoints: guest.loyaltyPoints - points },
      });

      // Log redemption
      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: branchId || guest.branchId,
          action: "points_redeemed",
          entity: "guest",
          entityId: guestId,
          details: {
            pointsRedeemed: points,
            rewardValue,
            rewardId,
          },
        },
      });

      // Check for tier downgrade
      let newTierValue = guest.loyaltyTier;
      const newPoints = updatedGuest.loyaltyPoints;
      if (newPoints < TIER_CONFIG.silver.minPoints) newTierValue = "bronze";
      else if (newPoints < TIER_CONFIG.gold.minPoints) newTierValue = "silver";
      else if (newPoints < TIER_CONFIG.platinum.minPoints) newTierValue = "gold";

      if (newTierValue !== guest.loyaltyTier) {
        await prisma.guest.update({
          where: { id: guestId },
          data: { loyaltyTier: newTierValue },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Redeemed ${points} points for $${rewardValue.toFixed(2)} value`,
        guest: {
          id: updatedGuest.id,
          loyaltyPoints: updatedGuest.loyaltyPoints,
          loyaltyTier: newTierValue,
        },
        redemption: {
          pointsRedeemed: points,
          rewardValue: rewardValue.toFixed(2),
        },
      });
    } else if (action === "adjust_tier") {
      // Manual tier adjustment (admin only)
      if (!newTier || !Object.keys(TIER_CONFIG).includes(newTier)) {
        return NextResponse.json({ success: false, error: "Valid tier required (bronze, silver, gold, platinum)" }, { status: 400 });
      }

      const oldTier = guest.loyaltyTier;
      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: { loyaltyTier: newTier },
      });

      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: branchId || guest.branchId,
          action: "tier_adjusted",
          entity: "guest",
          entityId: guestId,
          details: { from: oldTier, to: newTier, reason: body.reason },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Tier adjusted from ${oldTier} to ${newTier}`,
        guest: {
          id: updatedGuest.id,
          loyaltyTier: updatedGuest.loyaltyTier,
        },
      });
    } else if (action === "bonus") {
      // Add bonus points (promotional)
      const bonusPoints = body.points || 0;
      const updatedGuest = await prisma.guest.update({
        where: { id: guestId },
        data: { loyaltyPoints: guest.loyaltyPoints + bonusPoints },
      });

      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId: branchId || guest.branchId,
          action: "bonus_points",
          entity: "guest",
          entityId: guestId,
          details: { bonusPoints, reason: body.reason },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Added ${bonusPoints} bonus points`,
        guest: {
          id: updatedGuest.id,
          loyaltyPoints: updatedGuest.loyaltyPoints,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Loyalty PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process loyalty action", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove points (due to cancellation, etc.)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");
    const points = parseInt(searchParams.get("points") || "0");
    const reason = searchParams.get("reason");

    if (!guestId || points <= 0) {
      return NextResponse.json({ success: false, error: "Valid guestId and points required" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ success: false, error: "Guest not found" }, { status: 404 });
    }

    const newPoints = Math.max(0, guest.loyaltyPoints - points);

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { loyaltyPoints: newPoints },
    });

    return NextResponse.json({
      success: true,
      message: `Removed ${points} points`,
      guest: {
        id: updatedGuest.id,
        loyaltyPoints: updatedGuest.loyaltyPoints,
      },
    });
  } catch (error: any) {
    console.error("Loyalty DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove points", message: error.message },
      { status: 500 }
    );
  }
}
