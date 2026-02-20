import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const staffId = searchParams.get("staffId");

    const where: any = {};
    if (branchId && branchId !== "all") where.branchId = branchId;
    if (staffId) where.id = staffId;

    const staff = await prisma.staff.findMany({
      where,
      include: {
        shifts: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        assignedServices: { where: { status: "completed" } },
        assignedRooms: true,
      },
    });

    const performance = await Promise.all(
      staff.map(async (s) => {
        const completedServices = s.assignedServices.length;
        const totalShifts = s.shifts.length;
        const avgRating = s.performanceScore || 0;
        
        const orders = await prisma.order.count({
          where: { assignedStaffId: s.id, status: "completed" },
        });

        const revenue = await prisma.payment.aggregate({
          where: { booking: { room: { assignedStaffId: s.id } }, status: "completed" },
          _sum: { amount: true },
        });

        return {
          id: s.id,
          name: s.name,
          role: s.role,
          branchId: s.branchId,
          completedServices,
          totalShifts,
          ordersHandled: orders,
          revenueGenerated: revenue._sum.amount || 0,
          performanceScore: avgRating,
          efficiency: totalShifts > 0 ? Math.round((completedServices / totalShifts) * 100) : 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: performance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
