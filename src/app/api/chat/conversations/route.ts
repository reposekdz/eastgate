import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get chat conversations with real messages from database
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || "br-001";
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "50");

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
        messages,
        conversationId
      });
    }

    // Get all conversations grouped by sender
    const conversations = await prisma.$queryRaw`
      SELECT 
        sender_email as id,
        sender_name as name,
        sender_phone as phone,
        MAX(created_at) as lastMessageTime,
        COUNT(*) as messageCount,
        MAX(message) as lastMessage,
        SUM(CASE WHEN \`read\` = 0 THEN 1 ELSE 0 END) as unreadCount,
        branch_id as branchId
      FROM messages 
      WHERE branch_id = ${branchId}
        AND sender = 'guest'
      GROUP BY sender_email, sender_name, sender_phone, branch_id
      ORDER BY lastMessageTime DESC
      LIMIT 20
    ` as any[];

    return NextResponse.json({
      success: true,
      conversations,
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