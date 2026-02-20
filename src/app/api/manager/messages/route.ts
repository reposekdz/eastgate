import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all messages for manager/admin
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId") || session.user.branchId || "main-branch";
        const type = searchParams.get("type"); // "all", "unread", "starred"
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        let whereClause = { branchId };

        if (type === "unread") {
            whereClause = { ...whereClause, read: false };
        } else if (type === "starred") {
            whereClause = { ...whereClause, starred: true };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });

        // Get unread count
        const unreadCount = await prisma.message.count({
            where: { branchId, read: false },
        });

        // Get starred count
        const starredCount = await prisma.message.count({
            where: { branchId, starred: true },
        });

        // Get total count
        const totalCount = await prisma.message.count({
            where: { branchId },
        });

        return NextResponse.json({
            success: true,
            messages,
            stats: {
                total: totalCount,
                unread: unreadCount,
                starred: starredCount,
            },
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

// POST - Mark message as read
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, messageIds } = body;

        if (action === "markRead" && messageIds) {
            await prisma.message.updateMany({
                where: { id: { in: messageIds } },
                data: { read: true },
            });
        } else if (action === "markUnread" && messageIds) {
            await prisma.message.updateMany({
                where: { id: { in: messageIds } },
                data: { read: false },
            });
        } else if (action === "star" && messageIds) {
            await prisma.message.updateMany({
                where: { id: { in: messageIds } },
                data: { starred: true },
            });
        } else if (action === "unstar" && messageIds) {
            await prisma.message.updateMany({
                where: { id: { in: messageIds } },
                data: { starred: false },
            });
        } else if (action === "archive" && messageIds) {
            await prisma.message.updateMany({
                where: { id: { in: messageIds } },
                data: { archived: true },
            });
        } else if (action === "delete" && messageIds) {
            await prisma.message.deleteMany({
                where: { id: { in: messageIds } },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Action completed successfully",
        });
    } catch (error) {
        console.error("Error performing action:", error);
        return NextResponse.json(
            { error: "Failed to perform action" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a message
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("id");

        if (!messageId) {
            return NextResponse.json(
                { error: "Message ID is required" },
                { status: 400 }
            );
        }

        await prisma.message.delete({
            where: { id: messageId },
        });

        return NextResponse.json({
            success: true,
            message: "Message deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting message:", error);
        return NextResponse.json(
            { error: "Failed to delete message" },
            { status: 500 }
        );
    }
}
