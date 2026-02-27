import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-advanced/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { reportType, format, startDate, endDate, branchId } = await req.json();

    const where: any = {
      createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
    };
    if (branchId) where.branchId = branchId;

    let data: any = {};

    switch (reportType) {
      case "revenue":
        const [bookings, orders, payments] = await Promise.all([
          prisma.booking.findMany({
            where: { ...where, status: "checked_out" },
            select: { paidAmount: true, checkedOutAt: true, guestName: true, roomNumber: true, paymentMethod: true },
          }),
          prisma.order.findMany({
            where: { createdAt: where.createdAt, status: "served" },
            select: { total: true, createdAt: true, guestName: true, orderNumber: true },
          }),
          prisma.payment.findMany({
            where: { createdAt: where.createdAt, status: "completed" },
            select: { amount: true, paymentMethod: true, createdAt: true, transactionId: true },
          }),
        ]);
        data = { bookings, orders, payments };
        break;

      case "occupancy":
        const rooms = await prisma.room.findMany({
          where: { branchId: branchId || decoded.branchId },
          select: { number: true, type: true, status: true, floor: true },
        });
        const bookingStats = await prisma.booking.groupBy({
          by: ["status"],
          where,
          _count: true,
        });
        data = { rooms, bookingStats };
        break;

      case "staff":
        const staff = await prisma.staff.findMany({
          where: { branchId: branchId || decoded.branchId },
          select: { name: true, email: true, role: true, department: true, status: true, hireDate: true },
        });
        data = { staff };
        break;

      case "inventory":
        const inventory = await prisma.inventory.findMany({
          where: { branchId: branchId || decoded.branchId },
          select: { name: true, category: true, quantity: true, unit: true, unitPrice: true, reorderLevel: true },
        });
        data = { inventory };
        break;

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    if (format === "csv") {
      const csv = convertToCSV(data, reportType);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data,
      reportType,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Export report error:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}

function convertToCSV(data: any, reportType: string): string {
  let rows: string[] = [];

  switch (reportType) {
    case "revenue":
      rows.push("Type,Amount,Date,Reference,Payment Method");
      data.bookings?.forEach((b: any) => {
        rows.push(`Booking,${b.paidAmount},${b.checkedOutAt},${b.roomNumber},${b.paymentMethod || "N/A"}`);
      });
      data.orders?.forEach((o: any) => {
        rows.push(`Order,${o.total},${o.createdAt},${o.orderNumber || "N/A"},N/A`);
      });
      break;

    case "occupancy":
      rows.push("Room Number,Type,Status,Floor");
      data.rooms?.forEach((r: any) => {
        rows.push(`${r.number},${r.type},${r.status},${r.floor}`);
      });
      break;

    case "staff":
      rows.push("Name,Email,Role,Department,Status,Hire Date");
      data.staff?.forEach((s: any) => {
        rows.push(`${s.name},${s.email},${s.role},${s.department},${s.status},${s.hireDate}`);
      });
      break;

    case "inventory":
      rows.push("Item,Category,Quantity,Unit,Unit Price,Reorder Level");
      data.inventory?.forEach((i: any) => {
        rows.push(`${i.name},${i.category},${i.quantity},${i.unit},${i.unitPrice},${i.reorderLevel}`);
      });
      break;
  }

  return rows.join("\n");
}
