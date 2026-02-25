import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get chat conversations with real messages from database
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";
    const conversationId = searchParams.get("conversationId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (conversationId) {
      // Get specific conversation messages
      const messages = await prisma.message.findMany({
        where: {
          branchId,
          OR: [
            { id: conversationId },
            { recipientId: conversationId }
          ]
        },
        orderBy: { createdAt: "asc" },
        take: limit
      });

      return NextResponse.json({
        success: true,
        messages: messages || [],
        conversationId
      });
    }

    // Get all conversations using Prisma (no raw SQL)
    const conversations = await prisma.message.groupBy({
      by: ["senderEmail"],
      where: {
        branchId,
        sender: "guest"
      },
      _max: { createdAt: true },
      _count: { id: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: 20
    });

    // Enrich with latest message details
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const latestMessage = await prisma.message.findFirst({
          where: {
            branchId,
            senderEmail: conv.senderEmail
          },
          orderBy: { createdAt: "desc" },
          select: {
            senderName: true,
            senderEmail: true,
            message: true,
            createdAt: true
          }
        });

        const unreadCount = await prisma.message.count({
          where: {
            branchId,
            senderEmail: conv.senderEmail,
            sender: "guest",
            read: false
          }
        });

        return {
          id: conv.senderEmail,
          name: latestMessage?.senderName || "Guest",
          email: conv.senderEmail,
          lastMessageTime: conv._max.createdAt,
          messageCount: conv._count.id,
          lastMessage: latestMessage?.message,
          unreadCount,
          branchId
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: enrichedConversations,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Get conversations error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch conversations"
    }, { status: 500 });
  }
}

// POST - Send message in conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      sender, 
      senderName, 
      senderEmail, 
      message, 
      branchId, 
      recipientId,
      staffId 
    } = body;

    if (!sender || !senderName || !message || !branchId) {
      return NextResponse.json({
        success: false,
        error: "sender, senderName, message, and branchId are required"
      }, { status: 400 });
    }

    // Create new message
    const newMessage = await prisma.message.create({
      data: {
        sender,
        senderName,
        senderEmail: senderEmail || null,
        message,
        branchId,
        recipientId: recipientId || null,
        read: false
      }
    });

    // If staff is responding, mark previous guest messages as read
    if (sender === "staff" && senderEmail) {
      await prisma.message.updateMany({
        where: {
          branchId,
          senderEmail,
          sender: "guest",
          read: false
        },
        data: { read: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to send message"
    }, { status: 500 });
  }
}