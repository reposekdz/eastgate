import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";
import { hashPassword } from "@/lib/auth-advanced";

/**
 * GET /api/manager/staff
 * Fetch staff members for a branch
 * Managers can only see their own branch staff
 * Super Admin can see all
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!["SUPER_ADMIN", "manager", "senior_manager", "super_manager"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const where: any = {};

    // Scope access by branch
    if (session.role === "manager") {
      if (!session.branchId) {
        return NextResponse.json(
          { success: false, error: "Branch not assigned to manager" },
          { status: 403 }
        );
      }
      where.branchId = session.branchId;
    } else if (branchId && session.role === "SUPER_ADMIN") {
      where.branchId = branchId;
    }

    if (role) where.role = role;
    if (department) where.department = department;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          department: true,
          shift: true,
          status: true,
          avatar: true,
          branchId: true,
          salary: true,
          hireDate: true,
          activityStatus: true,
          lastActivityAt: true,
          createdAt: true,
          updatedAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.staff.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          staff: staff.map((s) => ({
            ...s,
            isOnline: s.activityStatus === "online",
            lastActivity: s.lastActivityAt,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Staff fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/staff
 * Create a new staff member
 * Managers can only create for their own branch
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!["SUPER_ADMIN", "manager", "senior_manager", "super_manager"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      role, // waiter, stock_manager, receptionist, kitchen_staff
      department, // restaurant, reception, kitchen, housekeeping, stock
      shift, // morning, afternoon, night
      branchId,
      salary,
      idNumber,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !role || !branchId) {
      return NextResponse.json(
        { success: false, error: "Name, email, password, role, and branch ID required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Restrict managers to their own branch
    if (session.role === "manager" && branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Managers can only add staff to their branch" },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone: phone || "",
        password: hashedPassword,
        role,
        department: department || "restaurant",
        shift: shift || "morning",
        status: "active",
        avatar: null,
        branchId,
        salary: salary || 0,
        idNumber: idNumber || "",
        createdBy: session.id,
        activityStatus: "offline",
        permissions: getDefaultPermissions(role),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        shift: true,
        status: true,
        avatar: true,
        branchId: true,
        salary: true,
        hireDate: true,
        createdAt: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId,
        action: "staff_created",
        entity: "staff",
        entityId: staff.id,
        details: { staffRole: role, department },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          staff: {
            ...staff,
            credentials: {
              email,
              temporaryPassword: password, // Return once for display
            },
          },
        },
        message: `Staff member ${name} created successfully. Credentials sent.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Staff creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create staff" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manager/staff/[id]
 * Update staff member details
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID required" },
        { status: 400 }
      );
    }

    // Verify staff exists and user has access
    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { branchId: true, role: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.role === "manager" && staff.branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Cannot update staff from other branch" },
        { status: 403 }
      );
    }

    // Prevent invalid role changes
    const allowedRoles = ["waiter", "stock_manager", "receptionist", "kitchen_staff"];
    if (updateData.role && !allowedRoles.includes(updateData.role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update permissions if role changed
    if (updateData.role) {
      updateData.permissions = getDefaultPermissions(updateData.role);
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
        avatar: true,
        updatedAt: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId: staff.branchId,
        action: "staff_updated",
        entity: "staff",
        entityId: id,
        details: updateData,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { staff: updated },
        message: "Staff updated successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Staff update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manager/staff/[id]
 * Deactivate staff member
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = verifyToken(token, "access");
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Staff ID required" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { branchId: true, name: true },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.role === "manager" && staff.branchId !== session.branchId) {
      return NextResponse.json(
        { success: false, error: "Cannot remove staff from other branch" },
        { status: 403 }
      );
    }

    // Deactivate instead of delete
    await prisma.staff.update({
      where: { id },
      data: { status: "inactive" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        branchId: staff.branchId,
        action: "staff_deactivated",
        entity: "staff",
        entityId: id,
        details: { staffName: staff.name },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Staff member ${staff.name} deactivated`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Staff deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to deactivate staff" },
      { status: 500 }
    );
  }
}

/**
 * Get default permissions based on role
 */
function getDefaultPermissions(role: string): Record<string, boolean> {
  const permissions: Record<string, Record<string, boolean>> = {
    waiter: {
      take_orders: true,
      view_menu: true,
      update_order_status: true,
      add_payment: true,
      view_table_status: true,
      manage_own_orders: true,
    },
    stock_manager: {
      view_inventory: true,
      manage_inventory: true,
      create_purchase_orders: true,
      approve_purchase_orders: true,
      view_stock_reports: true,
      manage_suppliers: true,
    },
    receptionist: {
      manage_bookings: true,
      check_in_guests: true,
      check_out_guests: true,
      view_rooms: true,
      view_payments: true,
      manage_guest_services: true,
      issue_invoices: true,
    },
    kitchen_staff: {
      view_orders: true,
      update_order_status: true,
      view_menu_items: true,
      mark_item_ready: true,
      view_kitchen_dashboard: true,
    },
  };

  return permissions[role] || {};
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
