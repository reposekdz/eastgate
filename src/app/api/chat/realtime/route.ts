import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get real-time messages across all branches
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const branchId = searchParams.get("branchId");
    const conversationId = searchParams.get("conversationId");
    const crossBranch = searchParams.get("crossBranch") === "true";

    if (conversationId) {
      // Get specific conversation messages
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderEmail: conversationId },
            { recipientId: conversationId }
          ]
        },
        orderBy: { createdAt: "asc" },
        take: 100
      });

      return NextResponse.json({ success: true, messages });
    }

    // Get all conversations with real-time data
    const whereClause: any = {};
    if (!crossBranch && branchId) {
      whereClause.branchId = branchId;
    }

    const conversations = await prisma.$queryRaw`
      SELECT 
        m.sender_email as id,
        m.sender_name as name,
        m.sender_phone as phone,
        m.branch_id as branchId,
        b.name as branchName,
        MAX(m.created_at) as lastMessageTime,
        COUNT(*) as messageCount,
        MAX(m.message) as lastMessage,
        SUM(CASE WHEN m.read = false AND m.sender = 'guest' THEN 1 ELSE 0 END) as unreadCount
      FROM messages m
      LEFT JOIN branches b ON m.branch_id = b.id
      WHERE m.sender = 'guest'
      ${branchId && !crossBranch ? `AND m.branch_id = '${branchId}'` : ''}
      GROUP BY m.sender_email, m.sender_name, m.sender_phone, m.branch_id, b.name
      ORDER BY lastMessageTime DESC
      LIMIT 50
    ` as any[];

    return NextResponse.json({
      success: true,
      conversations,
      crossBranch,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Get real-time messages error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch messages"
    }, { status: 500 });
  }
}

// POST - Send real message with advanced features
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
      staffId,
      messageType = "text",
      priority = "normal"
    } = body;

    if (!sender || !senderName || !message || !branchId) {
      return NextResponse.json({
        success: false,
        error: "Required fields missing"
      }, { status: 400 });
    }

    // Create real message
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

    // Update staff activity if staff message
    if (sender === "staff" && staffId) {
      await prisma.staff.update({
        where: { id: staffId },
        data: { lastLogin: new Date() }
      });
    }

    // Mark guest messages as read when staff responds
    if (sender === "staff" && senderEmail) {
      await prisma.message.updateMany({
        where: {
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
    console.error("Send real message error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to send message"
    }, { status: 500 });
  }
}