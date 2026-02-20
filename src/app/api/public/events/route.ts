import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all events for public view
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId") || "br-001";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = "SELECT * FROM events WHERE branch_id = ?";
    const params: any[] = [branchId];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }

    if (status) {
      query += " AND status = ?";
      params.push(status);
    } else {
      // Default to upcoming and ongoing for public
      query += " AND status IN ('upcoming', 'ongoing')";
    }

    query += " ORDER BY date ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const events = await prisma.$queryRawUnsafe(query, ...params) as any[];

    // Get event types
    const types = await prisma.$queryRaw`
      SELECT DISTINCT type FROM events WHERE branch_id = ${branchId} ORDER BY type ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      events,
      types: types.map((t: any) => t.type),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch events",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Create a new event (for admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name,
      type,
      date,
      startTime,
      endTime,
      hall,
      capacity,
      organizer,
      description,
      branchId = "br-001"
    } = body;

    if (!name || !type || !date || !hall) {
      return NextResponse.json({
        success: false,
        error: "Name, type, date, and hall are required",
      }, { status: 400 });
    }

    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await prisma.$executeRaw`
      INSERT INTO events (id, name, type, date, start_time, end_time, hall, capacity, attendees, status, total_amount, organizer, description, branch_id, created_at, updated_at)
      VALUES (
        ${eventId},
        ${name},
        ${type},
        ${date},
        ${startTime || '09:00'},
        ${endTime || '18:00'},
        ${hall},
        ${capacity || 100},
        0,
        'upcoming',
        0,
        ${organizer || null},
        ${description || null},
        ${branchId},
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      eventId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Create event error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create event",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// PUT - Update an event (for admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      eventId,
      name,
      type,
      date,
      startTime,
      endTime,
      hall,
      capacity,
      attendees,
      status,
      totalAmount,
      organizer,
      description
    } = body;

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required",
      }, { status: 400 });
    }

    let updates: string[] = [];
    let params: any[] = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (type) { updates.push("type = ?"); params.push(type); }
    if (date) { updates.push("date = ?"); params.push(date); }
    if (startTime) { updates.push("start_time = ?"); params.push(startTime); }
    if (endTime) { updates.push("end_time = ?"); params.push(endTime); }
    if (hall) { updates.push("hall = ?"); params.push(hall); }
    if (capacity) { updates.push("capacity = ?"); params.push(capacity); }
    if (attendees !== undefined) { updates.push("attendees = ?"); params.push(attendees); }
    if (status) { updates.push("status = ?"); params.push(status); }
    if (totalAmount !== undefined) { updates.push("total_amount = ?"); params.push(totalAmount); }
    if (organizer) { updates.push("organizer = ?"); params.push(organizer); }
    if (description) { updates.push("description = ?"); params.push(description); }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No fields to update",
      }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    params.push(eventId);

    const query = `UPDATE events SET ${updates.join(", ")} WHERE id = ?`;
    await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update event",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// DELETE - Delete an event (for admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required",
      }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM events WHERE id = ${eventId}
    `;

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Delete event error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete event",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
