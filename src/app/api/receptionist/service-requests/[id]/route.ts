import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, priority, assignedTo, notes } = body;

    const updatedRequest = {
      id: params.id,
      status,
      priority,
      assignedTo,
      notes,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      serviceRequest: updatedRequest,
      message: "Service request updated successfully",
    });
  } catch (error) {
    console.error("Service request update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json({
      success: true,
      message: "Service request deleted successfully",
    });
  } catch (error) {
    console.error("Service request delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete service request" },
      { status: 500 }
    );
  }
}
