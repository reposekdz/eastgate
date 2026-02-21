import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isManager } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET - Fetch all prices for a branch (rooms and menu items)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;

        // Check permissions
        if (!isSuperAdmin(userRole) && !isManager(userRole)) {
            return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId");

        if (!branchId) {
            return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
        }

        // Get rooms for this branch
        const rooms = await prisma.room.findMany({
            where: { branchId },
            select: {
                id: true,
                number: true,
                type: true,
                price: true,
                floor: true,
                status: true,
                description: true,
            },
            orderBy: { number: "asc" },
        });

        // Get menu items for this branch
        const menuItems = await prisma.menuItem.findMany({
            where: { branchId },
            select: {
                id: true,
                name: true,
                nameRw: true,
                category: true,
                price: true,
                available: true,
                description: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            rooms: rooms.map((r: any) => ({
                id: r.id,
                name: `Room ${r.number}`,
                nameRw: `Icyumba ${r.number}`,
                category: "room",
                price: r.price,
                status: r.status,
                description: r.description,
                type: r.type,
                floor: r.floor,
            })),
            menu: menuItems.map((m: any) => ({
                id: m.id,
                name: m.name,
                nameRw: m.nameRw || m.name,
                category: "menu",
                price: m.price,
                available: m.available,
                description: m.description,
                itemCategory: m.category,
            })),
        });
    } catch (error) {
        console.error("Error fetching prices:", error);
        return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
    }
}

// PATCH - Update a single price
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;

        // Check permissions
        if (!isSuperAdmin(userRole) && !isManager(userRole)) {
            return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const { id, category, newPrice } = body;

        if (!id || !category || newPrice === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let updated;

        switch (category) {
            case "room":
                updated = await prisma.room.update({
                    where: { id },
                    data: { price: newPrice },
                });
                break;
            case "menu":
                updated = await prisma.menuItem.update({
                    where: { id },
                    data: { price: newPrice },
                });
                break;
            default:
                return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        return NextResponse.json({ success: true, item: updated });
    } catch (error) {
        console.error("Error updating price:", error);
        return NextResponse.json({ error: "Failed to update price" }, { status: 500 });
    }
}

// POST - Bulk update prices by percentage
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;

        // Check permissions
        if (!isSuperAdmin(userRole) && !isManager(userRole)) {
            return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
        }

        const body = await request.json();
        const { branchId, category, percentage, increase } = body;

        if (!branchId || !category || percentage === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const multiplier = increase ? (1 + percentage / 100) : (1 - percentage / 100);

        let results;

        switch (category) {
            case "room": {
                const rooms = await prisma.room.findMany({ where: { branchId } });
                results = await Promise.all(
                    rooms.map((r: any) =>
                        prisma.room.update({
                            where: { id: r.id },
                            data: { price: Math.round(r.price * multiplier) },
                        })
                    )
                );
                break;
            }
            case "menu": {
                const items = await prisma.menuItem.findMany({ where: { branchId } });
                results = await Promise.all(
                    items.map((i: any) =>
                        prisma.menuItem.update({
                            where: { id: i.id },
                            data: { price: Math.round(i.price * multiplier) },
                        })
                    )
                );
                break;
            }
            default:
                return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${results?.length || 0} ${category} prices`,
            count: results?.length || 0,
        });
    } catch (error) {
        console.error("Error bulk updating prices:", error);
        return NextResponse.json({ error: "Failed to bulk update prices" }, { status: 500 });
    }
}
