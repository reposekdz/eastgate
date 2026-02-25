/**
 * Room Image Upload API
 * Managers and admins can upload images for rooms
 */

import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getCurrentUser } from "@/lib/auth-advanced";
import { successResponse, errorResponse } from "@/lib/validators";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "rooms");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", [], 401);

    const isManager = user.role === "BRANCH_MANAGER" || user.role === "SUPER_ADMIN" || user.role === "SUPER_MANAGER";
    if (!isManager) {
      return errorResponse("Only managers can upload room images", [], 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const roomId = formData.get("roomId") as string;

    if (!file) {
      return errorResponse("File is required", [], 400);
    }

    if (!roomId) {
      return errorResponse("Room ID is required", [], 400);
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File size exceeds 5MB limit", [], 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Only JPEG, PNG, and WebP images are allowed", [], 400);
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = file.name.split(".").pop();
    const filename = `${roomId}-${timestamp}-${random}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file
    const buffer = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));

    // Return public URL
    const imageUrl = `/uploads/rooms/${filename}`;

    return successResponse({
      imageUrl,
      filename,
      size: file.size,
      type: file.type,
    }, 201);
  } catch (error: any) {
    console.error("Image upload error:", error);
    return errorResponse("Failed to upload image", [], 500);
  }
}

/**
 * DELETE /api/rooms/upload
 * Delete a room image
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", [], 401);

    const isManager = user.role === "BRANCH_MANAGER" || user.role === "SUPER_ADMIN" || user.role === "SUPER_MANAGER";
    if (!isManager) {
      return errorResponse("Only managers can delete room images", [], 403);
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return errorResponse("Filename is required", [], 400);
    }

    const filepath = join(UPLOAD_DIR, filename);

    // Check if file exists and delete
    if (existsSync(filepath)) {
      const { unlink } = await import("fs/promises");
      await unlink(filepath);
    }

    return successResponse({ message: "Image deleted successfully" });
  } catch (error: any) {
    console.error("Image delete error:", error);
    return errorResponse("Failed to delete image", [], 500);
  }
}
