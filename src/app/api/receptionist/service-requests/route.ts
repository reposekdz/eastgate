import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/validators";
import { cookies } from "next/headers";

interface ServiceRequest {
  id: string;
  guest: string;
  room: string;
  type: string;
  typeRw: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  time: string;
  branchId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("eastgate-auth");
    
    if (!authCookie) {
      return errorResponse("Unauthorized", [], 401);
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    // Mock service request data - replace with real database queries
    const serviceRequests: ServiceRequest[] = [
      {
        id: "sr-1",
        guest: "Sarah Wilson",
        room: "201",
        type: "Extra towels requested",
        typeRw: "Amapeshyi y'inyongera yasabwe",
        priority: "medium",
        status: "pending",
        time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        branchId
      },
      {
        id: "sr-2",
        guest: "David Brown",
        room: "105",
        type: "Air conditioning not working",
        typeRw: "Ikirere gikora nabi",
        priority: "high",
        status: "in_progress",
        time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        branchId
      },
      {
        id: "sr-3",
        guest: "Lisa Chen",
        room: "308",
        type: "Room service - dinner",
        typeRw: "Serivisi y'icyumba - ifunguro rya nimugoroba",
        priority: "low",
        status: "completed",
        time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        branchId
      },
      {
        id: "sr-4",
        guest: "Robert Taylor",
        room: "150",
        type: "Bathroom leak urgent repair",
        typeRw: "Gusana kwa salle de bain gukeneye gusanwa byihutirwa",
        priority: "urgent",
        status: "pending",
        time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        branchId
      }
    ];

    return successResponse({ serviceRequests });
  } catch (error: any) {
    console.error("Service requests fetch error:", error);
    return errorResponse("Failed to fetch service requests", [], 500);
  }
}