import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/messages - Get messages for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // inbox, sent, all
    const folder = searchParams.get("folder") || "inbox"; // inbox, sent, archive
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread") === "true";

    const userId = session.user.id;

    // Build query based on type and folder
    let whereClause: any = {};

    if (folder === "inbox") {
      whereClause = {
        recipientId: userId,
        senderId: { not: userId },
        ...(unreadOnly ? { read: false } : {}),
      };
    } else if (folder === "sent") {
      whereClause = {
        senderId: userId,
        recipientId: { not: userId },
      };
    } else if (folder === "archive") {
      whereClause = {
        OR: [
          { recipientId: userId, archivedByRecipient: true },
          { senderId: userId, archivedBySender: true },
        ],
      };
    }

    // Get messages with sender and recipient info
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            room: {
              select: {
                number: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });

    // Get total count
    const totalCount = await prisma.message.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      messages,
      unreadCount,
      totalCount,
      pagination: {
        limit,
        offset,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipientId,
      subject,
      content,
      messageType = "GENERAL",
      priority = "NORMAL",
      bookingId,
      metadata,
    } = body;

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: "Recipient and content are required" },
        { status: 400 }
      );
    }

    const senderId = session.user.id;

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        subject: subject || "",
        content,
        messageType: messageType as any,
        priority: priority as any,
        bookingId,
        metadata: metadata || {},
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "MESSAGE",
        title: `New message from ${session.user.name || 'Unknown'}`,
        message: subject || "You have a new message",
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages - Mark messages as read, archive, etc.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds, action, markAllRead } = body;

    const userId = session.user.id;

    if (markAllRead) {
      // Mark all messages as read
      await prisma.message.updateMany({
        where: {
          recipientId: userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "All messages marked as read",
      });
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "Message IDs required" },
        { status: 400 }
      );
    }

    // Perform action on messages
    switch (action) {
      case "read":
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            recipientId: userId,
          },
          data: {
            read: true,
            readAt: new Date(),
          },
        });
        break;

      case "unread":
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            recipientId: userId,
          },
          data: {
            read: false,
            readAt: null,
          },
        });
        break;

      case "archive":
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            OR: [
              { recipientId: userId },
              { senderId: userId },
            ],
          },
          data: {
            archivedByRecipient: { set: true },
            archivedBySender: { set: true },
          },
        });
        break;

      case "delete":
        // Soft delete - mark as deleted
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            OR: [
              { recipientId: userId },
              { senderId: userId },
            ],
          },
          data: {
            deletedByRecipient: { set: true },
            deletedBySender: { set: true },
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Messages ${action} successfully`,
    });
  } catch (error) {
    console.error("Message action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
