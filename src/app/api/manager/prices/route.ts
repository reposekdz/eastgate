import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token, "access") as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");

        if (!branchId) {
            return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
        }

        const [rooms, menuItems, events] = await Promise.all([
            prisma.room.findMany({
                where: { branchId },
                select: { id: true, number: true, type: true, price: true, weekendPrice: true, floor: true, status: true, description: true, imageUrl: true },
                orderBy: { number: "asc" },
            }),
            prisma.menuItem.findMany({
                where: { branchId },
                select: { id: true, name: true, category: true, price: true, available: true, description: true, imageUrl: true },
                orderBy: { name: "asc" },
            }),
            prisma.event.findMany({
                where: { branchId },
                select: { id: true, name: true, type: true, totalAmount: true, status: true, date: true },
                orderBy: { date: "desc" },
                take: 20,
            }),
        ]);

        return NextResponse.json({ success: true, rooms, menuItems, events });
    } catch (error) {
        console.error("Error fetching prices:", error);
        return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(token, "access") as any;
        if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const body = await request.json();
        const { id, type, price, weekendPrice, imageUrl, description, available } = body;

        if (!id || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let updated;

        if (type === "room") {
            updated = await prisma.room.update({
                where: { id },
                data: { price, weekendPrice, imageUrl, description },
            });
        } else if (type === "menu") {
            updated = await prisma.menuItem.update({
                where: { id },
                data: { price, imageUrl, description, available },
            });
        } else if (type === "event") {
            updated = await prisma.event.update({
                where: { id },
                data: { totalAmount: price },
            });
        }

        await prisma.activityLog.create({
            data: {
                userId: decoded.userId,
                branchId: decoded.branchId,
                action: "price_update",
                entity: type,
                entityId: id,
                details: { price, weekendPrice, imageUrl },
            },
        });

        return NextResponse.json({ success: true, item: updated });
    } catch (error) {
        console.error("Error updating price:", error);
        return NextResponse.json({ error: "Failed to update price" }, { status: 500 });
    }
}
