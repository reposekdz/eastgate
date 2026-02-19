import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// GET /api/manager/suppliers - Get suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!userBranchId && !["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Branch not assigned" }, { status: 403 });
    }

    // Build where clause
    let whereClause: any = {};
    
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      if (searchParams.get("branchId")) {
        whereClause.branchId = searchParams.get("branchId");
      }
      // Super admin can see all suppliers including those without branch
      if (!searchParams.get("branchId")) {
        whereClause.OR = [
          { branchId: null },
          { branchId: userBranchId },
        ];
      }
    } else {
      whereClause.OR = [
        { branchId: userBranchId },
        { branchId: null },
      ];
    }

    if (category) whereClause.category = category;
    if (active !== null && active !== undefined) whereClause.isActive = active === "true";
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Get suppliers
    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where: whereClause,
        include: {
          branch: { select: { id: true, name: true } },
          _count: { select: { stockItems: true, purchases: true } },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.supplier.count({ where: whereClause }),
    ]);

    // Get stats by category
    const categoryStats = await prisma.supplier.groupBy({
      by: ["category"],
      where: whereClause,
      _count: true,
    });

    return NextResponse.json({
      success: true,
      suppliers,
      totalCount,
      stats: {
        byCategory: categoryStats,
        totalActive: suppliers.filter(s => s.isActive).length,
        totalInactive: suppliers.filter(s => !s.isActive).length,
      },
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    return NextResponse.json({ error: "Failed to get suppliers" }, { status: 500 });
  }
}

// POST /api/manager/suppliers - Create supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      category,
      paymentTerms,
      rating,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    // Determine branch
    let branchId = userBranchId;
    if (userRole === "SUPER_ADMIN" || userRole === "SUPER_MANAGER") {
      branchId = body.branchId || null; // Can be null for system-wide suppliers
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        category: category || null,
        paymentTerms: paymentTerms || null,
        rating: rating || null,
        notes: notes || null,
        branchId,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("Create supplier error:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}

// PUT /api/manager/suppliers - Update supplier
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      supplierId,
      name,
      contactPerson,
      email,
      phone,
      address,
      category,
      paymentTerms,
      rating,
      isActive,
      notes,
    } = body;

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID required" }, { status: 400 });
    }

    // Check if supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Update supplier
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (category !== undefined) updateData.category = category;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (rating !== undefined) updateData.rating = rating;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("Update supplier error:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

// DELETE /api/manager/suppliers - Deactivate supplier
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    if (!["SUPER_ADMIN", "SUPER_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID required" }, { status: 400 });
    }

    // Soft delete - deactivate
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Supplier deactivated" });
  } catch (error) {
    console.error("Delete supplier error:", error);
    return NextResponse.json({ error: "Failed to deactivate supplier" }, { status: 500 });
  }
}
