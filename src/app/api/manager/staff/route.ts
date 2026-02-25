import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";
import { hash } from "bcryptjs";

/**
 * GET /api/manager/staff
 * Fetch staff members for a branch (managers can only see their own branch, super admin sees all)
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: any = {};

    if (session.role === "BRANCH_MANAGER" || session.role === "MANAGER") {
      where.branchId = session.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    if (role) where.role = role;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        status: true,
        avatar: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        staff,
        count: staff.length,
      },
    });
  } catch (error) {
    console.error("Staff GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/staff
 * Create a new staff member (manager scope limited to their branch)
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, password, role, department, branchId } = body;

    if (!name || !email || !password || !role || !branchId) {
      return NextResponse.json(
        { success: false, error: "Name, email, password, role, and branch ID are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (session.role === "BRANCH_MANAGER" && branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Managers can only create staff for their own branch" },
        { status: 403 }
      );
    }

    const existingStaff = await prisma.staff.findUnique({ where: { email } });
    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone: phone || "",
        password: hashedPassword,
        role,
        department: department || "General",
        status: "active",
        branchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        status: true,
        branchId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { staff },
    }, { status: 201 });
  } catch (error) {
    console.error("Staff POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create staff" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manager/staff
 * Update staff member details
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { branchId: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    if (session.role === "BRANCH_MANAGER" && staff.branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Cannot update staff from other branches" },
        { status: 403 }
      );
    }

    if (updateData.password) {
      updateData.password = await hash(updateData.password, 12);
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        status: true,
        branchId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { staff: updated },
    });
  } catch (error) {
    console.error("Staff PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update staff" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/staff
 * Delete a staff member
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { branchId: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    if (session.role === "BRANCH_MANAGER" && staff.branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete staff from other branches" },
        { status: 403 }
      );
    }

    await prisma.staff.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { message: "Staff member deleted" },
    });
  } catch (error) {
    console.error("Staff DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete staff" },
      { status: 500 }
    );
  }
}
