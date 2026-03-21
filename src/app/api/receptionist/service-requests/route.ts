import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  try {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formattedRequests = serviceRequests.map((sr: any) => ({
      id: sr.id,
      guest: sr.guestName,
      room: sr.roomNumber,
      type: sr.type,
      typeRw: getTypeRw(sr.type),
      priority: sr.priority,
      status: sr.status,
      time: sr.createdAt.toISOString(),
      branchId: sr.branchId,
    }));

    return NextResponse.json({
      success: true,
      serviceRequests: formattedRequests,
      total: formattedRequests.length,
      summary: {
        pending: formattedRequests.filter((sr: any) => sr.status === "pending").length,
        inProgress: formattedRequests.filter((sr: any) => sr.status === "in_progress").length,
        completed: formattedRequests.filter((sr: any) => sr.status === "completed").length,
        urgent: formattedRequests.filter((sr: any) => sr.priority === "urgent").length,
      },
    });
  } catch (error) {
    console.error("Service requests fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}

function getTypeRw(type: string): string {
  const translations: Record<string, string> = {
    "Extra Pillows": "Umusego Wongeyeho",
    "Room Cleaning": "Gusukura Icyumba",
    "Airport Transfer": "Guhura ku Kibuga",
    "WiFi Issue": "Ikibazo cya WiFi",
    "Late Check-out": "Gusohoka Buhoro",
    "Towels": "Amaservieti",
    "Maintenance": "Gusana",
    "Room Service": "Serivisi y'Icyumba",
  };
  return translations[type] || type;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomNumber, guestName, guestId, type, request: requestText, priority, branchId } = body;

    const newServiceRequest = await prisma.serviceRequest.create({
      data: {
        roomNumber,
        guestName,
        guestId,
        type,
        request: requestText,
        priority: priority || "medium",
        status: "pending",
        branchId,
      },
    });

    return NextResponse.json({
      success: true,
      serviceRequest: newServiceRequest,
    });
  } catch (error) {
    console.error("Service request creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create service request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assignedTo, priority } = body;

    const updatedServiceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assignedTo && { assignedTo }),
        ...(priority && { priority }),
        ...(status === "completed" && { completedAt: new Date() }),
      },
    });

    return NextResponse.json({
      success: true,
      serviceRequest: updatedServiceRequest,
    });
  } catch (error) {
    console.error("Service request update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service request" },
      { status: 500 }
    );
  }
}