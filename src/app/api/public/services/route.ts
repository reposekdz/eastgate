import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all services for public view
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const branchId = searchParams.get("branchId") || "br-001";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = "SELECT * FROM services WHERE branch_id = ?";
    const params: any[] = [branchId];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }

    query += " ORDER BY name ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const services = await prisma.$queryRawUnsafe(query, ...params) as any[];

    // Get service types/categories
    const types = await prisma.$queryRaw`
      SELECT DISTINCT type FROM services WHERE branch_id = ${branchId} ORDER BY type ASC
    ` as any[];

    return NextResponse.json({
      success: true,
      services,
      types: types.map((t: any) => t.type),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get services error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch services",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Create a new service (for admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name,
      type,
      price,
      duration,
      description,
      imageUrl,
      available = true,
      branchId = "br-001"
    } = body;

    if (!name || !type || price === undefined) {
      return NextResponse.json({
        success: false,
        error: "Name, type, and price are required",
      }, { status: 400 });
    }

    const serviceId = `SVC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await prisma.$executeRaw`
      INSERT INTO services (id, name, type, price, duration, description, image_url, available, branch_id, created_at, updated_at)
      VALUES (
        ${serviceId},
        ${name},
        ${type},
        ${price},
        ${duration || 60},
        ${description || null},
        ${imageUrl || null},
        ${available ? 1 : 0},
        ${branchId},
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Service created successfully",
      serviceId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Create service error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create service",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// PUT - Update a service (for admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      serviceId,
      name,
      type,
      price,
      duration,
      description,
      imageUrl,
      available
    } = body;

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: "Service ID is required",
      }, { status: 400 });
    }

    // Build dynamic update query
    let updates: string[] = [];
    let params: any[] = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (type) { updates.push("type = ?"); params.push(type); }
    if (price !== undefined) { updates.push("price = ?"); params.push(price); }
    if (duration) { updates.push("duration = ?"); params.push(duration); }
    if (description) { updates.push("description = ?"); params.push(description); }
    if (imageUrl) { updates.push("image_url = ?"); params.push(imageUrl); }
    if (available !== undefined) { updates.push("available = ?"); params.push(available ? 1 : 0); }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No fields to update",
      }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    params.push(serviceId);

    const query = `UPDATE services SET ${updates.join(", ")} WHERE id = ?`;
    await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Update service error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update service",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// DELETE - Delete a service (for admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: "Service ID is required",
      }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM services WHERE id = ${serviceId}
    `;

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Delete service error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete service",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
