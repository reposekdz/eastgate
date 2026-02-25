import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
const p: any = prisma;
import { verifyToken } from "@/lib/auth-advanced";

/**
 * GET /api/suppliers
 * Fetch suppliers for a branch
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") || session.branchId;
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = { branchId, isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    const p: any = prisma;
    const suppliers = await p.supplier.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        contactPerson: true,
        email: true,
        phone: true,
        rating: true,
        paymentTerms: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: { suppliers },
    });
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, contactPerson, email, phone, rating, leadTime, minimumOrder, branchId } = body;

    if (!name || !category || !contactPerson || !email) {
      return NextResponse.json(
        { success: false, error: "Name, category, contact person, and email are required" },
        { status: 400 }
      );
    }

    const supplier = await p.supplier.create({
      data: {
        name,
        category,
        contactPerson,
        email,
        phone: phone || "",
        rating: rating || 5,
        paymentTerms: leadTime || "Net 3",
        isActive: true,
        branchId: branchId || session.branchId,
      },
      select: {
        id: true,
        name: true,
        category: true,
        contactPerson: true,
        email: true,
        phone: true,
        rating: true,
        paymentTerms: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { supplier },
    }, { status: 201 });
  } catch (error) {
    console.error("Suppliers POST error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create supplier" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/suppliers
 * Update supplier information
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const existingSupplier = await p.supplier.findUnique({
      where: { id },
      select: { branchId: true },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const updatedSupplier = await p.supplier.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        category: true,
        contactPerson: true,
        email: true,
        phone: true,
        rating: true,
        paymentTerms: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { supplier: updatedSupplier },
    });
  } catch (error) {
    console.error("Suppliers PATCH error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update supplier" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suppliers
 * Deactivate a supplier (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const existingSupplier = await p.supplier.findUnique({
      where: { id },
      select: { branchId: true },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    const deactivatedSupplier = await p.supplier.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { supplier: deactivatedSupplier, message: "Supplier deactivated" },
    });
  } catch (error) {
    console.error("Suppliers DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to deactivate supplier" },
      { status: 500 }
    );
  }
}

