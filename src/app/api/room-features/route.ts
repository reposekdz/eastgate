import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Default modern room features
    const defaultFeatures = [
      { name: "Smart Room Controls", description: "Control lighting, temperature, and entertainment with voice commands or mobile app", icon: "Smartphone" },
      { name: "High-Speed WiFi", description: "Complimentary fiber-optic internet throughout your stay", icon: "Wifi" },
      { name: "Modern Workspace", description: "Ergonomic desk with USB charging ports and ambient lighting", icon: "Monitor" },
      { name: "Premium Bedding", description: "Luxury linens and memory foam mattresses for ultimate comfort", icon: "Bed" },
      { name: "Smart TV", description: "65-inch 4K TV with streaming services and Bluetooth audio", icon: "Tv" },
      { name: "Spa Bathroom", description: "Rainfall shower, heated floors, and premium toiletries", icon: "Bath" },
    ];

    // Try to fetch from database if the model exists
    try {
      const features = await prisma.$queryRaw<Array<{ name: string; description: string; icon: string }>>`
        SELECT name, description, icon FROM room_features WHERE is_active = true LIMIT 10
      `;
      
      if (features && features.length > 0) {
        return NextResponse.json({ success: true, data: features });
      }
    } catch {
      // If table doesn't exist, return default features
    }

    return NextResponse.json({
      success: true,
      data: defaultFeatures,
    });
  } catch (error) {
    console.error("Room features fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch room features" },
      { status: 500 }
    );
  }
}
