import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced";

/**
 * POST /api/admin/rooms/upload-image
 * Upload room image and return URL
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const session = verifyToken(token, "access");
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    if (!["SUPER_ADMIN", "SUPER_MANAGER", "BRANCH_MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const roomId = formData.get("roomId") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    }

    if (!roomId) {
      return NextResponse.json({ success: false, error: "Room ID is required" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { branchId: true },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    if (session.role === "BRANCH_MANAGER" && room.branchId !== session.branchId) {
      return NextResponse.json({ success: false, error: "You can only upload images for your branch" }, { status: 403 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads", "rooms");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.error("[UPLOAD_IMAGE] Failed to create directory:", err);
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `room-${roomId}-${timestamp}-${random}.${extension}`;
    const filepath = join(uploadsDir, filename);

    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    const imageUrl = `/uploads/rooms/${filename}`;

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { imageUrl },
      select: {
        id: true,
        number: true,
        type: true,
        imageUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        filename,
        room: updatedRoom,
      },
    });
  } catch (error) {
    console.error("[UPLOAD_IMAGE] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}
