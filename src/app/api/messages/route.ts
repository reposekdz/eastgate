import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch messages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const read = searchParams.get("read");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (read === "true") where.read = true;
    else if (read === "false") where.read = false;

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender, senderName, senderEmail, senderPhone, message, branchId } = body;

    if (!sender || !senderName || !message || !branchId) {
      return NextResponse.json(
        { success: false, error: "sender, senderName, message, and branchId are required" },
        { status: 400 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        sender,
        senderName,
        senderEmail,
        senderPhone,
        message,
        branchId,
        read: false,
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Mark as read
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, read } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.update({
      where: { id },
      data: { read: read !== false },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Message update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update message" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
