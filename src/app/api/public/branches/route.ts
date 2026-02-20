import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all branches for public view
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  try {
    let query = "SELECT * FROM branches";
    const params: any[] = [];

    if (branchId) {
      query += " WHERE id = ?";
      params.push(branchId);
    }

    query += " ORDER BY name ASC";

    const branches = await prisma.$queryRawUnsafe(query, ...params) as any[];

    // For each branch, get additional stats
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      
      const roomCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM rooms WHERE branch_id = ${branch.id}
      ` as any[];
      
      const staffCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM staff WHERE branch_id = ${branch.id}
      ` as any[];

      branch.roomCount = roomCount[0]?.count || 0;
      branch.staffCount = staffCount[0]?.count || 0;
    }

    return NextResponse.json({
      success: true,
      branches,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get branches error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch branches",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Create a new branch (for admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name,
      location,
      address,
      phone,
      email,
      manager
    } = body;

    if (!name || !location) {
      return NextResponse.json({
        success: false,
        error: "Name and location are required",
      }, { status: 400 });
    }

    const newBranchId = `BR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await prisma.$executeRaw`
      INSERT INTO branches (id, name, location, address, phone, email, manager, created_at, updated_at)
      VALUES (
        ${newBranchId},
        ${name},
        ${location},
        ${address || null},
        ${phone || null},
        ${email || null},
        ${manager || null},
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Branch created successfully",
      branchId: newBranchId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Create branch error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create branch",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// PUT - Update a branch (for admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      branchId,
      name,
      location,
      address,
      phone,
      email,
      manager
    } = body;

    if (!branchId) {
      return NextResponse.json({
        success: false,
        error: "Branch ID is required",
      }, { status: 400 });
    }

    let updates: string[] = [];
    let params: any[] = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (location) { updates.push("location = ?"); params.push(location); }
    if (address) { updates.push("address = ?"); params.push(address); }
    if (phone) { updates.push("phone = ?"); params.push(phone); }
    if (email) { updates.push("email = ?"); params.push(email); }
    if (manager) { updates.push("manager = ?"); params.push(manager); }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No fields to update",
      }, { status: 400 });
    }

    updates.push("updated_at = NOW()");
    params.push(branchId);

    const query = `UPDATE branches SET ${updates.join(", ")} WHERE id = ?`;
    await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json({
      success: true,
      message: "Branch updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Update branch error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update branch",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
