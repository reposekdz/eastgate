import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/menu/[id] - Update menu item
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Fetch existing item
        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Permission check
        if (session.user.role === "SUPER_ADMIN" || session.user.role === "SUPER_MANAGER") {
            // Admins can edit anything
        } else if (session.user.role === "BRANCH_MANAGER") {
            // Branch Managers can only edit their OWN branch items
            // They cannot edit global items (items with branchId: null)
            if (existingItem.branchId !== session.user.branchId) {
                return NextResponse.json(
                    { error: "Access denied: Cannot edit global items or items from other branches" },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const updatedItem = await prisma.menuItem.update({
            where: { id },
            data: {
                name: body.name,
                nameKinyarwanda: body.nameKinyarwanda,
                category: body.category,
                description: body.description,
                price: body.price,
                cost: body.cost,
                images: body.images,
                ingredients: body.ingredients,
                allergens: body.allergens,
                dietary: body.dietary,
                calories: body.calories,
                protein: body.protein,
                carbs: body.carbs,
                fat: body.fat,
                available: body.available,
                preparationTime: body.preparationTime,
                popular: body.popular,
                requiresInventory: body.requiresInventory,
                lowStockAlert: body.lowStockAlert,
                // Do not allow changing branchId
            },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error("Error updating menu item:", error);
        return NextResponse.json(
            { error: "Failed to update menu item" },
            { status: 500 }
        );
    }
}

// DELETE /api/menu/[id] - Delete menu item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch existing item
        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Permission check
        if (session.user.role === "SUPER_ADMIN" || session.user.role === "SUPER_MANAGER") {
            // Admins can delete anything
        } else if (session.user.role === "BRANCH_MANAGER") {
            if (existingItem.branchId !== session.user.branchId) {
                return NextResponse.json(
                    { error: "Access denied: Cannot delete global items or items from other branches" },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await prisma.menuItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        // Check for foreign key constraint (e.g., used in OrderItems)
        if ((error as any).code === 'P2003') {
            return NextResponse.json(
                { error: "Cannot delete item because it is referenced in past orders." },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to delete menu item" },
            { status: 500 }
        );
    }
}
