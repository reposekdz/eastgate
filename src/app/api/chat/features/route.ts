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
      quickReply,
      branchId = "br-001"
    } = body;

    if (!action || !conversationId) {
      return NextResponse.json({
        success: false,
        error: "action and conversationId are required"
      }, { status: 400 });
    }

    switch (action) {
      case "setPriority":
        if (priority) {
          await prisma.message.updateMany({
            where: { senderEmail: conversationId },
            data: { starred: priority === "high" }
          });
        }
        break;

      case "addTags":
        if (messageId && Array.isArray(tags) && tags.length > 0) {
          const msg = await prisma.message.findUnique({
            where: { id: messageId },
            select: { message: true }
          });
          if (msg) {
            await prisma.message.update({
              where: { id: messageId },
              data: { 
                message: `${msg.message} #${tags.join(' #')}`
              }
            });
          }
        }
        break;

      case "sendFile":
        if (fileUrl) {
          await prisma.message.create({
            data: {
              sender: "staff",
              senderName: "Staff",
              senderEmail: conversationId,
              message: `📎 File shared: ${fileUrl}`,
              branchId,
              read: false
            }
          });
        }
        break;

      case "sendVoice":
        if (voiceUrl) {
          await prisma.message.create({
            data: {
              sender: "staff",
              senderName: "Staff", 
              senderEmail: conversationId,
              message: `🎤 Voice message: ${voiceUrl}`,
              branchId,
              read: false
            }
          });
        }
        break;

      case "sendLocation":
        if (location && location.name && location.address) {
          await prisma.message.create({
            data: {
              sender: "staff",
              senderName: "Staff",
              senderEmail: conversationId,
              message: `📍 Location: ${location.name} - ${location.address}`,
              branchId, 
              read: false
            }
          });
        }
        break;

      case "quickReply":
        if (quickReply) {
          await prisma.message.create({
            data: {
              sender: "staff",
              senderName: "Staff",
              senderEmail: conversationId,
              message: quickReply,
              branchId,
              read: false
            }
          });
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Chat features error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to process chat feature"
    }, { status: 500 });
  }
}