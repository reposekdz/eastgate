import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/manager/prices - Get all prices (rooms and menu) for a branch
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only managers can access prices
        if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get("branchId") || session.user.branchId;

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
                status: true,
            },
            orderBy: { number: "asc" },
        });

        // Get menu items (global + branch specific)
        const menuItems = await prisma.menuItem.findMany({
            where: {
                OR: [
                    { branchId: null },
                    { branchId: branchId }
                ]
            },
            select: {
                id: true,
                name: true,
                nameKinyarwanda: true,
                category: true,
                price: true,
                available: true,
            },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });

        // Get services (spa) - services don't have fixed prices in this system
        const services = await prisma.service.findMany({
            where: { branchId },
            select: {
                id: true,
                description: true,
                status: true,
            },
            distinct: ["description"],
        });

        return NextResponse.json({
            rooms: rooms.map(r => ({
                id: r.id,
                name: `Room ${r.number} (${r.type})`,
                nameRw: `Icyumba ${r.number}`,
                category: "room",
                price: r.price,
                status: r.status,
            })),
            menu: menuItems.map(m => ({
                id: m.id,
                name: m.name,
                nameRw: m.nameKinyarwanda || m.name,
                category: m.category,
                price: m.price,
                available: m.available,
            })),
            spa: services.map(s => ({
                id: s.id,
                name: s.description,
                nameRw: s.description,
                category: "spa",
                price: 0,
                status: s.status,
            })),
        });
    } catch (error) {
        console.error("Error fetching prices:", error);
        return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
    }
}

// PATCH /api/manager/prices - Update a price
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const { itemId, category, newPrice, reason } = body;

        if (!itemId || !category || !newPrice) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let updated;
        
        if (category === "room") {
            updated = await prisma.room.update({
                where: { id: itemId },
                data: { price: newPrice },
            });
        } else if (category === "menu") {
            // Check permission for menu items
            const existing = await prisma.menuItem.findUnique({ where: { id: itemId } });
            if (!existing) {
                return NextResponse.json({ error: "Item not found" }, { status: 404 });
            }
            if (session.user.role === "BRANCH_MANAGER" && existing.branchId !== session.user.branchId) {
                return NextResponse.json({ error: "Cannot edit global items" }, { status: 403 });
            }
            
            updated = await prisma.menuItem.update({
                where: { id: itemId },
                data: { price: newPrice },
            });
        } else {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating price:", error);
        return NextResponse.json({ error: "Failed to update price" }, { status: 500 });
    }
}

// POST /api/manager/prices - Bulk update prices
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const { category, percentage, branchId } = body;

        if (!category || percentage === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const targetBranchId = branchId || session.user.branchId;
        if (!targetBranchId) {
            return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
        }

        let updatedCount = 0;

        if (category === "room") {
            const rooms = await prisma.room.findMany({ where: { branchId: targetBranchId } });
            for (const room of rooms) {
                const newPrice = Math.round(room.price * (1 + percentage / 100));
                await prisma.room.update({
                    where: { id: room.id },
                    data: { price: newPrice },
                });
                updatedCount++;
            }
        } else if (category === "menu") {
            const items = await prisma.menuItem.findMany({
                where: {
                    OR: [{ branchId: null }, { branchId: targetBranchId }]
                }
            });
            for (const item of items) {
                const newPrice = Math.round(item.price * (1 + percentage / 100));
                await prisma.menuItem.update({
                    where: { id: item.id },
                    data: { price: newPrice },
                });
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (error) {
        console.error("Error bulk updating prices:", error);
        return NextResponse.json({ error: "Failed to update prices" }, { status: 500 });
    }
}
