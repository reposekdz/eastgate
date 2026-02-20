import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdmin, isManager } from "@/lib/auth";

// GET - Fetch all rooms
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;
        const userBranchId = session.user.branchId as string;

        // Check permissions
        if (!isSuperAdmin(userRole) && !isManager(userRole)) {
            return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const floor = searchParams.get("floor");
        const search = searchParams.get("search");

        // Build query
        let query = "SELECT * FROM rooms WHERE 1=1";
        const params: any[] = [];

        // Non-super admins can only see their branch
        if (!isSuperAdmin(userRole)) {
            query += " AND branch_id = ?";
            params.push(userBranchId);
        } else if (branchId && branchId !== "all") {
            query += " AND branch_id = ?";
            params.push(branchId);
        }

        if (status && status !== "all") {
            query += " AND status = ?";
            params.push(status);
        }

        if (type && type !== "all") {
            query += " AND room_type = ?";
            params.push(type);
        }

        if (floor) {
            query += " AND floor = ?";
            params.push(parseInt(floor));
        }

        if (search) {
            query += " AND (number LIKE ? OR description LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY floor ASC, number ASC";

        const rooms = await prisma.$queryRawUnsafe(query, ...params) as any[];

        return NextResponse.json({
            success: true,
            rooms,
            count: rooms.length
        });
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}

// POST - Create a new room
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;
        const userBranchId = session.user.branchId as string;

        // Check permissions - only super admin and managers can create rooms
        if (!isSuperAdmin(userRole) && !isManager(userRole)) {
            return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { number, floor, type, price, description, imageUrl, branchId } = body;

        // Validate required fields
        if (!number || !floor || !type || !price) {
            return NextResponse.json({ error: "Room number, floor, type, and price are required" }, { status: 400 });
        }

        // Determine branch
        const finalBranchId = (isSuperAdmin(userRole) && branchId) ? branchId : userBranchId;

        // Check if room number already exists in the branch
        const existingRoom = await prisma.$queryRaw`
      SELECT id FROM rooms WHERE number = ${number} AND branch_id = ${finalBranchId} LIMIT 1
    ` as any[];

        if (existingRoom.length > 0) {
            return NextResponse.json({ error: "Room with this number already exists in this branch" }, { status: 400 });
        }

        // Create room
        const roomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await prisma.$executeRaw`
      INSERT INTO rooms (id, number, floor, room_type, status, price, description, image_url, branch_id, created_at, updated_at)
      VALUES (
        ${roomId},
        ${number},
        ${parseInt(floor)},
        ${type},
        'available',
        ${parseFloat(price)},
        ${description || null},
        ${imageUrl || null},
        ${finalBranchId},
        NOW(),
        NOW()
      )
    `;

        return NextResponse.json({
            success: true,
            message: "Room created successfully",
            roomId
        });
    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}

// PUT - Update a room
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;
        const userBranchId = session.user.branchId as string;

        // Check permissions
        if (!isSuperAdmin(userRole) && !isManager(userRole)) {
            return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { id, number, floor, type, status, price, description, imageUrl } = body;

        if (!id) {
            return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
        }

        // Check if room exists
        const existingRoom = await prisma.$queryRaw`
      SELECT id, branch_id FROM rooms WHERE id = ${id} LIMIT 1
    ` as any[];

        if (existingRoom.length === 0) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Non-super admins can only update their branch's rooms
        if (!isSuperAdmin(userRole) && existingRoom[0].branch_id !== userBranchId) {
            return NextResponse.json({ error: "Cannot update rooms from other branches" }, { status: 403 });
        }

        // Build update query
        const updates: string[] = [];
        const params: any[] = [];

        if (number) {
            updates.push("number = ?");
            params.push(number);
        }
        if (floor !== undefined) {
            updates.push("floor = ?");
            params.push(parseInt(floor));
        }
        if (type) {
            updates.push("room_type = ?");
            params.push(type);
        }
        if (status) {
            updates.push("status = ?");
            params.push(status);
        }
        if (price !== undefined) {
            updates.push("price = ?");
            params.push(parseFloat(price));
        }
        if (description !== undefined) {
            updates.push("description = ?");
            params.push(description);
        }
        if (imageUrl !== undefined) {
            updates.push("image_url = ?");
            params.push(imageUrl);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        updates.push("updated_at = NOW()");
        params.push(id);

        const query = `UPDATE rooms SET ${updates.join(", ")} WHERE id = ?`;
        await prisma.$queryRawUnsafe(query, ...params);

        return NextResponse.json({
            success: true,
            message: "Room updated successfully"
        });
    } catch (error) {
        console.error("Error updating room:", error);
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}

// DELETE - Delete a room
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role as string;
        const userBranchId = session.user.branchId as string;

        // Check permissions - only super admin can delete rooms
        if (!isSuperAdmin(userRole)) {
            return NextResponse.json({ error: "Forbidden - Only super admins can delete rooms" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
        }

        // Check if room exists
        const existingRoom = await prisma.$queryRaw`
      SELECT id FROM rooms WHERE id = ${id} LIMIT 1
    ` as any[];

        if (existingRoom.length === 0) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check if room has active bookings
        const activeBookings = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM bookings WHERE room_id = ${id} AND status IN ('confirmed', 'checked_in')
    ` as any[];

        if (activeBookings[0]?.count > 0) {
            return NextResponse.json({
                error: "Cannot delete room with active bookings. Please cancel or complete existing bookings first."
            }, { status: 400 });
        }

        // Delete room
        await prisma.$executeRaw`
      DELETE FROM rooms WHERE id = ${id}
    `;

        return NextResponse.json({
            success: true,
            message: "Room deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting room:", error);
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
}
