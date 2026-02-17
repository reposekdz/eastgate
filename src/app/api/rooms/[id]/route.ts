import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/rooms/[id] - Update room status
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const room = await prisma.room.update({
            where: { id: params.id },
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
