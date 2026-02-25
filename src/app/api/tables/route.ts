/**
 * Restaurant Table Management API
 * Floor plan management, table reservations, and seating assignments
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

// GET - Fetch restaurant tables
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || session.branchId;
    const status = searchParams.get("status");
    const includeOrders = searchParams.get("includeOrders") === "true";

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const tables = await prisma.restaurantTable.findMany({
      where,
      orderBy: { number: "asc" },
    });

    // Get active orders for each table if requested
    let tablesWithOrders = tables;
    if (includeOrders) {
      tablesWithOrders = await Promise.all(
        tables.map(async (table) => {
          const activeOrder = await prisma.order.findFirst({
            where: {
              tableNumber: table.number,
              status: { in: ["pending", "preparing", "ready"] },
            },
            orderBy: { createdAt: "desc" },
            include: {
              guest: { select: { name: true, phone: true } },
              staff: { select: { name: true } },
            },
          });
          return { ...table, currentOrder: activeOrder };
        })
      );
    }

    // Calculate statistics
    const stats = {
      total: tables.length,
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
      totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
      currentGuests: tables
        .filter((t) => t.status === "occupied")
        .reduce((sum, t) => sum + t.capacity, 0),
    };

    // Group by capacity
    const byCapacity = {
      small: tables.filter((t) => t.capacity <= 2).length,
      medium: tables.filter((t) => t.capacity > 2 && t.capacity <= 4).length,
      large: tables.filter((t) => t.capacity > 4 && t.capacity <= 8).length,
      extraLarge: tables.filter((t) => t.capacity > 8).length,
    };

    // Get today's reservations (orders with table numbers)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: {
        branchId,
        tableNumber: { not: null },
        createdAt: { gte: today, lt: tomorrow },
      },
      select: {
        id: true,
        tableNumber: true,
        guestName: true,
        status: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group orders by table
    const tableReservations: Record<number, any[]> = {};
    todayOrders.forEach((order) => {
      if (order.tableNumber) {
        if (!tableReservations[order.tableNumber]) {
          tableReservations[order.tableNumber] = [];
        }
        tableReservations[order.tableNumber].push(order);
      }
    });

    return NextResponse.json({
      success: true,
      tables: tablesWithOrders,
      stats,
      byCapacity,
      todayReservations: tableReservations,
    });
  } catch (error: any) {
    console.error("Tables GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables", message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update table
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tables, branchId, staffId, action } = body;

    if (action === "bulk_create" && tables) {
      // Bulk create tables
      const createdTables = await Promise.all(
        tables.map((table: any) =>
          prisma.restaurantTable.create({
            data: {
              number: table.number,
              capacity: table.capacity || 4,
              status: "available",
              positionX: table.positionX,
              positionY: table.positionY,
              branchId,
            },
          })
        )
      );

      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId,
          action: "tables_created",
          entity: "tables",
          details: { count: createdTables.length },
        },
      });

      return NextResponse.json({
        success: true,
        tables: createdTables,
        message: `${createdTables.length} tables created`,
      });
    }

    if (action === "update_status") {
      // Update table status
      const { tableId, status, guestName, guestCount } = body;

      if (!tableId || !status) {
        return NextResponse.json(
          { success: false, error: "Table ID and status are required" },
          { status: 400 }
        );
      }

      const table = await prisma.restaurantTable.update({
        where: { id: tableId },
        data: { status },
      });

      // If occupying, log activity
      if (status === "occupied") {
        await prisma.activityLog.create({
          data: {
            userId: staffId,
            branchId,
            action: "table_occupied",
            entity: "table",
            entityId: tableId,
            details: { guestName, guestCount },
          },
        });
      }

      return NextResponse.json({
        success: true,
        table,
        message: `Table ${status}`,
      });
    }

    // Single table creation
    const { number, capacity, positionX, positionY } = body;

    if (!number || !branchId) {
      return NextResponse.json(
        { success: false, error: "Table number and branch ID are required" },
        { status: 400 }
      );
    }

    const table = await prisma.restaurantTable.create({
      data: {
        number,
        capacity: capacity || 4,
        status: "available",
        positionX,
        positionY,
        branchId,
      },
    });

    return NextResponse.json({
      success: true,
      table,
      message: "Table created successfully",
    });
  } catch (error: any) {
    console.error("Tables POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create table", message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update table
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, number, capacity, positionX, positionY, status, branchId, staffId } = body;

    if (!tableId) {
      return NextResponse.json({ success: false, error: "Table ID is required" }, { status: 400 });
    }

    const existingTable = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!existingTable) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (number !== undefined) updateData.number = number;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (positionX !== undefined) updateData.positionX = positionX;
    if (positionY !== undefined) updateData.positionY = positionY;
    if (status !== undefined) updateData.status = status;

    const table = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: updateData,
    });

    // Log activity
    if (branchId) {
      await prisma.activityLog.create({
        data: {
          userId: staffId,
          branchId,
          action: "table_updated",
          entity: "table",
          entityId: tableId,
          details: updateData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      table,
      message: "Table updated successfully",
    });
  } catch (error: any) {
    console.error("Tables PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update table", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove table
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ success: false, error: "Table ID is required" }, { status: 400 });
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      select: { id: true, status: true, number: true, branchId: true },
    });

    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found" }, { status: 404 });
    }

    if (table.status === "occupied") {
      return NextResponse.json(
        { success: false, error: "Cannot delete occupied table" },
        { status: 400 }
      );
    }

    const activeOrders = await prisma.order.count({
      where: {
        tableNumber: table.number,
        status: { in: ["pending", "preparing", "ready"] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete table with active orders" },
        { status: 400 }
      );
    }

    await prisma.restaurantTable.delete({ where: { id: tableId } });

    return NextResponse.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error: any) {
    console.error("Tables DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete table", message: error.message },
      { status: 500 }
    );
  }
}

