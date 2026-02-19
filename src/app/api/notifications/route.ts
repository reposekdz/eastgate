import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// Notification categories
const NOTIFICATION_CATEGORIES = {
  ORDER: ["NEW_ORDER", "ORDER_PREPARING", "ORDER_READY", "ORDER_COMPLETED", "ORDER_CANCELLED"],
  BOOKING: ["NEW_BOOKING", "CHECK_IN", "CHECK_OUT", "BOOKING_CANCELLED"],
  PAYMENT: ["PAYMENT_RECEIVED", "PAYMENT_PENDING", "PAYMENT_FAILED", "REFUND_PROCESSED"],
  STOCK: ["LOW_STOCK", "OUT_OF_STOCK", "EXPIRING_SOON", "PURCHASE_ORDER_RECEIVED"],
  SYSTEM: ["SYSTEM_ALERT", "MAINTENANCE_DUE", "STAFF_SCHEDULE", "REPORT_READY"],
};

// GET /api/notifications - Get notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userId = session.user.id;

    // Build where clause
    let whereClause: any = {
      userId,
    };

    if (unreadOnly) {
      whereClause.read = false;
    }

    if (category) {
      whereClause.type = category.toUpperCase();
    }

    if (type) {
      whereClause.title = { contains: type.replace(/_/g, " ") };
    }

    // Get notifications
    const [notifications, unreadCount, allCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    // Get notification preferences
    const preferences = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      totalCount: allCount,
      preferences: {
        email: preferences?.email,
        phone: preferences?.phone,
      },
      categories: NOTIFICATION_CATEGORIES,
      pagination: { limit, offset, total: allCount },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 });
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      actionUrl,
      sendEmail,
      sendSMS,
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "User ID, type, title, and message required" },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type.toUpperCase(),
        title,
        message,
        actionUrl: actionUrl || null,
        read: false,
      },
    });

    // In production, also send email/SMS if requested
    if (sendEmail || sendSMS) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true },
      });

      if (sendEmail && user?.email) {
        // Send email via your email service
        console.log(`Sending email to ${user.email}: ${title}`);
      }

      if (sendSMS && user?.phone) {
        // Send SMS via your SMS service
        console.log(`Sending SMS to ${user.phone}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// PUT /api/notifications - Mark as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;
    const userId = session.user.id;

    if (markAllRead) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true, readAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "Notification IDs required" },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `${notificationIds.length} notification(s) marked as read`,
    });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";
    const userId = session.user.id;

    if (deleteAll) {
      // Delete all notifications
      await prisma.notification.deleteMany({
        where: { userId },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications deleted",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    // Delete specific notification
    await prisma.notification.delete({
      where: { id: notificationId, userId },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
