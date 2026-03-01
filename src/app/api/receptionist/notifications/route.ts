import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    let notifications = [
      {
        id: "notif-001",
        type: "check_in",
        title: "New Check-in",
        message: "Mohammed Al-Rashid checked in to Room 105",
        priority: "normal",
        read: false,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        actionUrl: "/receptionist?tab=bookings",
        branchId,
      },
      {
        id: "notif-002",
        type: "service_request",
        title: "Urgent Service Request",
        message: "Room 301 - AC not working",
        priority: "urgent",
        read: false,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        actionUrl: "/receptionist?tab=services",
        branchId,
      },
      {
        id: "notif-003",
        type: "booking",
        title: "New Reservation",
        message: "Elena Petrova booked Presidential Suite for 5 nights",
        priority: "normal",
        read: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionUrl: "/receptionist?tab=bookings",
        branchId,
      },
      {
        id: "notif-004",
        type: "payment",
        title: "Payment Received",
        message: "Payment of RWF 2,340,000 received from James Okafor",
        priority: "normal",
        read: true,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        actionUrl: "/receptionist?tab=guests",
        branchId,
      },
      {
        id: "notif-005",
        type: "alert",
        title: "VIP Guest Arriving",
        message: "VIP guest Victoria Laurent arriving in 30 minutes",
        priority: "high",
        read: false,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        actionUrl: "/receptionist?tab=overview",
        branchId,
      },
    ];

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    return NextResponse.json({
      success: true,
      notifications,
      total: notifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, read } = body;

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully",
    });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markAllAsRead } = body;

    if (markAllAsRead) {
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid request",
    });
  } catch (error) {
    console.error("Notification action error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
