import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/rooms/[id] - Update room status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const room = await prisma.room.update({
            where: { id },
            data: {
                ...(body.status && { status: body.status }),
                ...(body.price !== undefined && { price: body.price }),
                ...(body.description && { description: body.description }),
                ...(body.amenities && { amenities: body.amenities }),
                ...(body.images && { images: body.images }),
                ...(body.status === "CLEANING" && { lastCleaned: new Date() }),
                ...(body.status === "MAINTENANCE" && { lastMaintenance: new Date() }),
            },
            include: {
                branch: true,
                currentGuest: true,
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Error updating room:", error);
        return NextResponse.json(
            { error: "Failed to update room" },
            { status: 500 }
        );
    }
}

// PUT /api/rooms/[id] - Full room update
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const room = await prisma.room.update({
            where: { id },
            data: {
                number: body.number,
                floor: body.floor,
                type: body.type,
                price: body.price,
                description: body.description,
                view: body.view,
                size: body.size,
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Error updating room:", error);
        return NextResponse.json(
            { error: "Failed to update room" },
            { status: 500 }
        );
    }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.room.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting room:", error);
        return NextResponse.json(
            { error: "Failed to delete room" },
            { status: 500 }
        );
    }
}
