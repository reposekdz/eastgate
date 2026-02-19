import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic for real-time data
export const dynamic = 'force-dynamic';

// Predefined service types
const SERVICE_TYPES = {
  SPA: ["MASSAGE", "FACIAL", "BODY_TREATMENT", "AROMATHERAPY"],
  FITNESS: ["GYM", "YOGA", "PERSONAL_TRAINING", "CLASSES"],
  POOL: ["ACCESS", "LESSONS", "AQUA_AEROBICS"],
  TRANSPORT: ["AIRPORT_PICKUP", "AIRPORT_DROPOFF", "CITY_TOUR", "CAR_RENTAL"],
  PARKING: ["SELF_PARKING", "VALET"],
  DINING: ["ROOM_SERVICE", "BUFFET", "SPECIAL_EVENT"],
  CONCIERGE: ["BOOKING", "INFORMATION", "SPECIAL_REQUEST"],
};

// GET /api/manager/services - Get services for branch manager
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Get services from database + predefined services
    let services: any[] = [];

    // Get custom services from DB
    const whereClause: any = {};
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const dbServices = await prisma.service.findMany({
      where: whereClause,
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Add predefined services info
    const allServiceTypes = Object.keys(SERVICE_TYPES).flatMap(cat => 
      SERVICE_TYPES[cat as keyof typeof SERVICE_TYPES].map(st => ({ category: cat, type: st }))
    );

    const result = {
      dbServices,
      serviceTypes: allServiceTypes,
      pagination: {
        limit,
        offset,
      },
    };

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Failed to get services" },
      { status: 500 }
    );
  }
}

// POST /api/manager/services - Create a new service (booking)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const userBranchId = session.user.branchId;

    // Only managers can create service requests
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      guestId,
      serviceName,
      type,
      description,
      scheduledFor,
      roomNumber,
      priority,
    } = body;

    if (!serviceName || !type) {
      return NextResponse.json(
        { error: "Service name and type are required" },
        { status: 400 }
      );
    }

    // Create service request
    const service = await prisma.service.create({
      data: {
        type: type.toUpperCase(),
        description: description || "",
        status: "PENDING",
        priority: priority?.toUpperCase() || "NORMAL",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        roomNumber: roomNumber || "",
        guestId,
        branchId: userBranchId,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for staff
    const staff = await prisma.user.findMany({
      where: {
        branchId: userBranchId,
        role: { in: ["STAFF", "BRANCH_MANAGER"] },
      },
    });

    await prisma.notification.createMany({
      data: staff.map(s => ({
        userId: s.id,
        type: "SERVICE",
        title: "New Service Request",
        message: `${serviceName} - ${type}`,
        read: false,
      })),
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

// PUT /api/manager/services - Update service status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;

    // Only staff can update services
    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER", "STAFF"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const {
      serviceId,
      status,
      staffId,
      rating,
      feedback,
      completedAt,
    } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID required" }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (staffId) updateData.staffId = staffId;
    if (rating) updateData.rating = rating;
    if (feedback) updateData.feedback = feedback;
    if (completedAt) updateData.completedAt = new Date(completedAt);

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}
