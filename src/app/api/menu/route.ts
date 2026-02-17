import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// GET /api/menu - Get all menu items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const available = searchParams.get("available");
        const popular = searchParams.get("popular");
        const branchId = searchParams.get("branchId");

        const filters: any = {};

        if (category) filters.category = category;
        if (available === "true") filters.available = true;
        if (popular === "true") filters.popular = true;

        // Branch logic:
        // If branchId is provided, show global items (branchId: null) AND items for that branch.
        // If not provided, show only global items? Or all?
        // Usually, a guest views a specific branch's menu.

        if (branchId) {
            filters.OR = [
                { branchId: null },
                { branchId: branchId }
            ];
        } else {
            // If no branch specified, maybe show mostly global items?
            // Or if admin, show everything?
            // Let's default to global items only if no branch specified, unless role is admin.
            const session = await auth();
            if (session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "SUPER_MANAGER") {
                // No additional filter, show all
            } else {
                filters.branchId = null;
            }
        }

        const menuItems = await prisma.menuItem.findMany({
            where: filters,
            orderBy: [
                { popular: "desc" },
                { category: "asc" },
                { name: "asc" },
            ],
        });

        return NextResponse.json(menuItems);
    } catch (error) {
        console.error("Error fetching menu items:", error);
        return NextResponse.json(
            { error: "Failed to fetch menu items" },
            { status: 500 }
        );
    }
}

// POST /api/menu - Create menu item
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Allow Super Admin, Super Manager, and Branch Manager
        if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();

        // If Branch Manager, force branchId to their branch
        let branchId = body.branchId;
        if (session.user.role === "BRANCH_MANAGER") {
            branchId = session.user.branchId;
        } else if (!branchId && (session.user.role === "SUPER_ADMIN" || session.user.role === "SUPER_MANAGER")) {
            // If admin doesn't specify branch, it's global (null)
            branchId = null;
        }

        const menuItem = await prisma.menuItem.create({
            data: {
                name: body.name,
                nameKinyarwanda: body.nameKinyarwanda,
                category: body.category,
                description: body.description,
                price: body.price,
                cost: body.cost,
                images: body.images || [],
                ingredients: body.ingredients || [],
                allergens: body.allergens || [],
                dietary: body.dietary || [],
                calories: body.calories,
                protein: body.protein,
                carbs: body.carbs,
                fat: body.fat,
                available: body.available !== undefined ? body.available : true,
                preparationTime: body.preparationTime,
                popular: body.popular || false,
                requiresInventory: body.requiresInventory || false,
                lowStockAlert: body.lowStockAlert || false,
                branchId: branchId, // Set branchId
            },
        });

        return NextResponse.json(menuItem, { status: 201 });
    } catch (error) {
        console.error("Error creating menu item:", error);
        return NextResponse.json(
            { error: "Failed to create menu item" },
            { status: 500 }
        );
    }
}
