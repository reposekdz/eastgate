import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch public messages/conversations for a guest
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const branchId = searchParams.get("branchId") || "br-001";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!email) {
    return NextResponse.json({
      success: false,
      error: "Email is required to fetch messages",
    }, { status: 400 });
  }

  try {
    // Get messages for this guest
    const messages = await prisma.$queryRaw`
      SELECT * FROM messages 
      WHERE sender_email = ${email} OR recipient_id = ${email}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as any;

    // Get unique conversation threads
    const conversations = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN sender_email = ${email} THEN recipient_id 
          ELSE sender_email 
        END as conversation_with,
        MAX(created_at) as last_message_time,
        COUNT(*) as message_count,
        MAX(message) as last_message
      FROM messages 
      WHERE sender_email = ${email} OR recipient_id = ${email}
      GROUP BY conversation_with
      ORDER BY last_message_time DESC
      LIMIT 20
    ` as any;

    return NextResponse.json({
      success: true,
      messages,
      conversations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch messages",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Send a new message (public guest message)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      senderName, 
      senderEmail, 
      senderPhone,
      message,
      recipientId,
      branchId = "br-001"
    } = body;

    if (!senderName || !senderEmail || !message) {
      return NextResponse.json({
        success: false,
        error: "Name, email, and message are required",
      }, { status: 400 });
    }

    // Insert the new message
    const messageId = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await prisma.$executeRaw`
      INSERT INTO messages (id, sender, sender_name, sender_email, sender_phone, message, recipient_id, branch_id, read, starred, archived, created_at, updated_at)
      VALUES (
        ${messageId},
        'guest',
        ${senderName},
        ${senderEmail},
        ${senderPhone || null},
        ${message},
        ${recipientId || 'reception'},
        ${branchId},
        0,
        0,
        0,
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to send message",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: "Email is required",
      }, { status: 400 });
    }

    // Mark messages as read
    await prisma.$executeRaw`
      UPDATE messages 
      SET read = 1, updated_at = NOW()
      WHERE (sender_email = ${email} OR recipient_id = ${email})
        AND read = 0
    `;

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Mark read error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to mark messages as read",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
