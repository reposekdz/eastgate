import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const activities = await prisma.activityLog.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        staff: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    const formattedActivities = activities.map((activity) => {
      let message = "";
      let messageRw = "";
      let type = "alert";
      let guest = activity.staff?.name || "System";
      let room = "";

      // Parse activity details
      const details = activity.details as any;
      
      switch (activity.action) {
        case "create":
          if (activity.entity === "booking") {
            type = "booking";
            message = "New reservation confirmed";
            messageRw = "Ifatwa rishya ryemejwe";
            guest = details?.guestName || guest;
            room = details?.roomNumber || "";
          } else if (activity.entity === "guest") {
            type = "check_in";
            message = `Checked in to Room ${details?.roomNumber || ""}`;
            messageRw = `Yinjiye mu Cyumba ${details?.roomNumber || ""}`;
            guest = details?.guestName || guest;
            room = details?.roomNumber || "";
          }
          break;
        case "update":
          if (activity.entity === "booking" && details?.status === "checked_out") {
            type = "check_out";
            message = `Checked out from Room ${details?.roomNumber || ""}`;
            messageRw = `Yasohotse mu Cyumba ${details?.roomNumber || ""}`;
            guest = details?.guestName || guest;
            room = details?.roomNumber || "";
          } else if (activity.entity === "service_request") {
            type = "service";
            message = details?.request || "Service requested";
            messageRw = details?.request || "Serivisi yasabwe";
            guest = details?.guestName || guest;
            room = details?.roomNumber || "";
          }
          break;
        case "payment":
          type = "payment";
          message = `Payment received: RWF ${details?.amount?.toLocaleString() || "0"}`;
          messageRw = `Kwishyura byakiriwe: RWF ${details?.amount?.toLocaleString() || "0"}`;
          guest = details?.guestName || guest;
          break;
      }

      return {
        id: activity.id,
        type,
        message,
        messageRw,
        time: activity.createdAt.toISOString(),
        guest,
        room,
        branchId: activity.branchId,
      };
    });

    return NextResponse.json({
      success: true,
      activities: formattedActivities,
    });
  } catch (error) {
    console.error("Activities fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entity, entityId, details, branchId, userId } = body;

    const newActivity = await prisma.activityLog.create({
      data: {
        userId,
        branchId,
        action,
        entity,
        entityId,
        details,
      },
    });

    return NextResponse.json({
      success: true,
      activity: newActivity,
    });
  } catch (error) {
    console.error("Activity creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create activity" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}