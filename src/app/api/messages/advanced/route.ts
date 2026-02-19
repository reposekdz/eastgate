import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/messages/advanced - Get advanced messaging
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const type = searchParams.get("type"); // DIRECT, GROUP, BROADCAST
    const unread = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userId = session.user.id;
    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Get user's conversations
    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            include: {
              sender: {
                select: { id: true, name: true, avatar: true, role: true },
              },
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(p => p.id === userId);
      if (!isParticipant && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          read: false,
        },
        data: { read: true, readAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        conversation,
        messages: conversation.messages,
      });
    }

    // Get user's conversations list
    let whereClause: any = {
      participants: { some: { id: userId } },
    };

    if (type) whereClause.type = type;

    const [conversations, unreadCount] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        include: {
          participants: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: { receiverId: userId, read: false },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.message.count({
        where: { receiverId: userId, read: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      conversations: conversations.map(c => ({
        ...c,
        lastMessage: c.messages[0] || null,
        unreadCount: c._count.messages,
      })),
      unreadCount,
      pagination: { limit, offset },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}

// POST /api/messages/advanced - Send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      action, // SEND_MESSAGE, CREATE_CONVERSATION, CREATE_GROUP, ADD_PARTICIPANT
      conversationId,
      receiverId,
      content,
      subject,
      attachments,
      type,
      groupName,
      participantIds,
    } = body;

    const senderId = session.user.id;
    const userRole = session.user.role;

    switch (action) {
      case "SEND_MESSAGE": {
        if (!receiverId && !conversationId) {
          return NextResponse.json(
            { error: "Receiver or conversation ID required" },
            { status: 400 }
          );
        }

        let targetConversationId = conversationId;

        // If no conversation, find or create one
        if (!conversationId) {
          // Find existing conversation
          let conversation = await prisma.conversation.findFirst({
            where: {
              type: "DIRECT",
              AND: [
                { participants: { some: { id: senderId } } },
                { participants: { some: { id: receiverId } } },
              ],
            },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                type: "DIRECT",
                participants: {
                  connect: [{ id: senderId }, { id: receiverId }],
                },
              },
            });
          }

          targetConversationId = conversation.id;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId: targetConversationId,
            senderId,
            receiverId: receiverId || (async () => {
              const conv = await prisma.conversation.findUnique({
                where: { id: targetConversationId },
                include: { participants: true },
              });
              return conv?.participants.find(p => p.id !== senderId)?.id;
            })(),
            content,
            subject: subject || null,
            attachments: attachments || [],
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: targetConversationId },
          data: { updatedAt: new Date() },
        });

        // Create notification for receiver
        if (message.receiverId) {
          await prisma.notification.create({
            data: {
              userId: message.receiverId,
              type: "SYSTEM",
              title: "New Message",
              message: `New message from ${session.user.name}: ${content.substring(0, 50)}...`,
              actionUrl: `/messages?conversationId=${targetConversationId}`,
            },
          });
        }

        return NextResponse.json({
          success: true,
          message,
          conversationId: targetConversationId,
        });
      }

      case "CREATE_CONVERSATION": {
        if (!participantIds || participantIds.length === 0) {
          return NextResponse.json(
            { error: "Participants required" },
            { status: 400 }
          );
        }

        const conversation = await prisma.conversation.create({
          data: {
            type: type || "GROUP",
            name: groupName || null,
            participants: {
              connect: [...participantIds, senderId].map(id => ({ id })),
            },
          },
          include: {
            participants: { select: { id: true, name: true } },
          },
        });

        return NextResponse.json({
          success: true,
          conversation,
        });
      }

      case "ADD_PARTICIPANT": {
        if (!conversationId || !participantIds) {
          return NextResponse.json(
            { error: "Conversation ID and participants required" },
            { status: 400 }
          );
        }

        const conversation = await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            participants: {
              connect: participantIds.map(id => ({ id })),
            },
          },
          include: {
            participants: { select: { id: true, name: true } },
          },
        });

        return NextResponse.json({
          success: true,
          conversation,
        });
      }

      case "BROADCAST": {
        // Only admins can broadcast
        if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
          return NextResponse.json(
            { error: "Insufficient permissions for broadcast" },
            { status: 403 }
          );
        }

        const { targetRole, branchId, content: broadcastContent, subject: broadcastSubject } = body;

        // Get recipients
        let recipientFilter: any = {};
        if (targetRole) recipientFilter.role = targetRole;
        if (branchId) recipientFilter.branchId = branchId;

        const recipients = await prisma.user.findMany({
          where: recipientFilter,
          select: { id: true },
        });

        // Create broadcast conversation
        const conversation = await prisma.conversation.create({
          data: {
            type: "BROADCAST",
            name: `Broadcast: ${broadcastSubject || "General"}`,
            participants: {
              connect: recipients.map(r => ({ id: r.id })),
            },
          },
        });

        // Create message for all recipients
        const messages = await Promise.all(
          recipients.map(recipient =>
            prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderId,
                receiverId: recipient.id,
                content: broadcastContent,
                subject: broadcastSubject,
                isBroadcast: true,
              },
            })
          )
        );

        return NextResponse.json({
          success: true,
          broadcast: {
            conversationId: conversation.id,
            recipientCount: recipients.length,
            messagesSent: messages.length,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// PUT /api/messages/advanced - Update message/conversation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, conversationId, action, participantId } = body;
    const userId = session.user.id;

    switch (action) {
      case "MARK_READ": {
        if (conversationId) {
          await prisma.message.updateMany({
            where: {
              conversationId,
              receiverId: userId,
              read: false,
            },
            data: { read: true, readAt: new Date() },
          });
        }
        return NextResponse.json({
          success: true,
          message: "Messages marked as read",
        });
      }

      case "DELETE_MESSAGE": {
        if (!messageId) {
          return NextResponse.json({ error: "Message ID required" }, { status: 400 });
        }

        // Soft delete - mark as deleted
        await prisma.message.update({
          where: { id: messageId, senderId: userId },
          data: {
            content: "[Message deleted]",
            isDeleted: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Message deleted",
        });
      }

      case "LEAVE_CONVERSATION": {
        if (!conversationId) {
          return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
        }

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            participants: { disconnect: { id: userId } },
          },
        });

        return NextResponse.json({
          success: true,
          message: "Left conversation",
        });
      }

      case "REMOVE_PARTICIPANT": {
        if (!conversationId || !participantId) {
          return NextResponse.json(
            { error: "Conversation ID and participant ID required" },
            { status: 400 }
          );
        }

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            participants: { disconnect: { id: participantId } },
          },
        });

        return NextResponse.json({
          success: true,
          message: "Participant removed",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/messages/advanced - Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const messageId = searchParams.get("messageId");

    const userId = session.user.id;

    if (messageId) {
      // Delete specific message
      await prisma.message.delete({
        where: { id: messageId, senderId: userId },
      });
      return NextResponse.json({ success: true, message: "Message deleted" });
    }

    if (conversationId) {
      // Leave conversation (soft delete)
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          participants: { disconnect: { id: userId } },
        },
      });
      return NextResponse.json({ success: true, message: "Left conversation" });
    }

    return NextResponse.json(
      { error: "Conversation or message ID required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
