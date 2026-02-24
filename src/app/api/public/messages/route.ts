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
    // Get messages for this guest using Prisma
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderEmail: email },
          { recipientId: email }
        ],
        branchId
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    });

    // Get conversation summary
    const conversationSummary = await prisma.message.groupBy({
      by: ['senderEmail'],
      where: {
        OR: [
          { senderEmail: email },
          { recipientId: email }
        ],
        branchId
      },
      _count: { id: true },
      _max: { createdAt: true }
    });

    return NextResponse.json({
      success: true,
      messages,
      conversationSummary,
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

    // Create the new message using Prisma
    const newMessage = await prisma.message.create({
      data: {
        sender: "guest",
        senderName,
        senderEmail,
        senderPhone: senderPhone || null,
        message,
        recipientId: recipientId || "reception",
        branchId,
        read: false,
        starred: false,
        archived: false
      }
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      messageId: newMessage.id,
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
    const { email, branchId = "br-001" } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: "Email is required",
      }, { status: 400 });
    }

    // Mark messages as read using Prisma
    await prisma.message.updateMany({
      where: {
        OR: [
          { senderEmail: email },
          { recipientId: email }
        ],
        branchId,
        read: false
      },
      data: {
        read: true
      }
    });

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
