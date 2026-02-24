import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST - Advanced chat features
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action,
      conversationId,
      staffId,
      messageId,
      priority,
      tags,
      fileUrl,
      voiceUrl,
      location,
      quickReply
    } = body;

    switch (action) {
      case "setPriority":
        await prisma.message.updateMany({
          where: { senderEmail: conversationId },
          data: { starred: priority === "high" }
        });
        break;

      case "addTags":
        await prisma.message.update({
          where: { id: messageId },
          data: { 
            message: `${await prisma.message.findUnique({ where: { id: messageId }, select: { message: true } }).then(m => m?.message)} #${tags.join(' #')}`
          }
        });
        break;

      case "sendFile":
        await prisma.message.create({
          data: {
            sender: "staff",
            senderName: "Staff",
            senderEmail: conversationId,
            message: `📎 File shared: ${fileUrl}`,
            branchId: "br-001",
            read: false
          }
        });
        break;

      case "sendVoice":
        await prisma.message.create({
          data: {
            sender: "staff",
            senderName: "Staff", 
            senderEmail: conversationId,
            message: `🎤 Voice message: ${voiceUrl}`,
            branchId: "br-001",
            read: false
          }
        });
        break;

      case "sendLocation":
        await prisma.message.create({
          data: {
            sender: "staff",
            senderName: "Staff",
            senderEmail: conversationId,
            message: `📍 Location: ${location.name} - ${location.address}`,
            branchId: "br-001", 
            read: false
          }
        });
        break;

      case "quickReply":
        await prisma.message.create({
          data: {
            sender: "staff",
            senderName: "Staff",
            senderEmail: conversationId,
            message: quickReply,
            branchId: "br-001",
            read: false
          }
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}