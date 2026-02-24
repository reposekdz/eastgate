import { NextRequest, NextResponse } from "next/server";
import { getRevenueByBranch, getAllRevenue, getBranchRevenueAnalytics, getGlobalRevenueAnalytics } from "@/lib/revenue-db";

export async function POST(req: NextRequest) {
  try {
    const { type, branchId, startDate, endDate, format = "json" } = await req.json();

    if (!type || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let reportData: any;

    switch (type) {
      case "branch_summary":
        if (!branchId) throw new Error("Branch ID required");
        reportData = await generateBranchSummary(branchId, new Date(startDate), new Date(endDate));
        break;
      
      case "branch_detailed":
        if (!branchId) throw new Error("Branch ID required");
        reportData = await generateBranchDetailed(branchId, new Date(startDate), new Date(endDate));
        break;
      
      case "global_summary":
        reportData = await generateGlobalSummary(new Date(startDate), new Date(endDate));
        break;
      
      case "comparison":
        reportData = await generateBranchComparison(new Date(startDate), new Date(endDate));
        break;
      
      case "payment_methods":
        reportData = await generatePaymentMethodsReport(branchId, new Date(startDate), new Date(endDate));
        break;
      
      default:
        throw new Error("Invalid report type");
    }

    if (format === "csv") {
      return new NextResponse(convertToCSV(reportData), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="revenue-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateBranchSummary(branchId: string, startDate: Date, endDate: Date) {
  const revenues = await getRevenueByBranch(branchId, startDate, endDate);
  
  const totalRevenue = revenues.reduce((sum, r) => sum + r.netAmount, 0);
  const totalTax = revenues.reduce((sum, r) => sum + r.tax, 0);
  const totalDiscount = revenues.reduce((sum, r) => sum + r.discount, 0);
  const totalCommission = revenues.reduce((sum, r) => sum + r.commission, 0);
  
  return {
    branchId,
    period: { startDate, endDate },
    summary: {
      totalRevenue,
      totalTax,
      totalDiscount,
      totalCommission,
      netRevenue: totalRevenue - totalCommission,
      transactionCount: revenues.length,
      averageTransaction: revenues.length > 0 ? totalRevenue / revenues.length : 0,
    },
    byType: groupBy(revenues, "type"),
    byCategory: groupBy(revenues, "category"),
    byPaymentMethod: groupBy(revenues, "paymentMethod"),
  };
}

async function generateBranchDetailed(branchId: string, startDate: Date, endDate: Date) {
  const revenues = await getRevenueByBranch(branchId, startDate, endDate);
  
  return {
    branchId,
    period: { startDate, endDate },
    transactions: revenues.map(r => ({
      date: r.date,
      orderId: r.orderId,
      type: r.type,
      category: r.category,
      amount: r.amount,
      tax: r.tax,
      discount: r.discount,
      netAmount: r.netAmount,
      paymentMethod: r.paymentMethod,
      status: r.status,
    })),
    summary: {
      totalRevenue: revenues.reduce((sum, r) => sum + r.netAmount, 0),
      transactionCount: revenues.length,
    },
  };
}

async function generateGlobalSummary(startDate: Date, endDate: Date) {
  const revenues = await getAllRevenue(startDate, endDate);
  
  const branchRevenues: Map<string, number> = new Map();
  revenues.forEach(r => {
    branchRevenues.set(r.branchId, (branchRevenues.get(r.branchId) || 0) + r.netAmount);
  });
  
  return {
    period: { startDate, endDate },
    totalRevenue: revenues.reduce((sum, r) => sum + r.netAmount, 0),
    totalTransactions: revenues.length,
    branches: Array.from(branchRevenues.entries()).map(([branchId, revenue]) => ({
      branchId,
      revenue,
      percentage: (revenue / revenues.reduce((sum, r) => sum + r.netAmount, 0)) * 100,
    })),
    byType: groupBy(revenues, "type"),
    byCategory: groupBy(revenues, "category"),
  };
}

async function generateBranchComparison(startDate: Date, endDate: Date) {
  const revenues = await getAllRevenue(startDate, endDate);
  const branches = ["kigali", "ngoma", "kirehe", "gatsibo"];
  
  const comparison = await Promise.all(
    branches.map(async branchId => {
      const branchRevs = revenues.filter(r => r.branchId === branchId);
      return {
        branchId,
        revenue: branchRevs.reduce((sum, r) => sum + r.netAmount, 0),
        transactions: branchRevs.length,
        averageTransaction: branchRevs.length > 0 ? branchRevs.reduce((sum, r) => sum + r.netAmount, 0) / branchRevs.length : 0,
        byType: groupBy(branchRevs, "type"),
      };
    })
  );
  
  return {
    period: { startDate, endDate },
    branches: comparison,
  };
}

async function generatePaymentMethodsReport(branchId: string | null, startDate: Date, endDate: Date) {
  const revenues = branchId 
    ? await getRevenueByBranch(branchId, startDate, endDate)
    : await getAllRevenue(startDate, endDate);
  
  const methods: Map<string, { revenue: number; count: number; avgTransaction: number }> = new Map();
  
  revenues.forEach(r => {
    const method = methods.get(r.paymentMethod) || { revenue: 0, count: 0, avgTransaction: 0 };
    method.revenue += r.netAmount;
    method.count += 1;
    methods.set(r.paymentMethod, method);
  });
  
  methods.forEach((stats, method) => {
    stats.avgTransaction = stats.revenue / stats.count;
  });
  
  return {
    branchId: branchId || "all",
    period: { startDate, endDate },
    paymentMethods: Array.from(methods.entries()).map(([method, stats]) => ({
      method,
      ...stats,
      percentage: (stats.revenue / revenues.reduce((sum, r) => sum + r.netAmount, 0)) * 100,
    })),
  };
}

function groupBy(revenues: any[], field: string): Record<string, { revenue: number; count: number }> {
  const grouped: Record<string, { revenue: number; count: number }> = {};
  
  revenues.forEach(r => {
    const key = r[field];
    if (!grouped[key]) {
      grouped[key] = { revenue: 0, count: 0 };
    }
    grouped[key].revenue += r.netAmount;
    grouped[key].count += 1;
  });
  
  return grouped;
}

function convertToCSV(data: any): string {
  if (!data.transactions) {
    return JSON.stringify(data);
  }
  
  const headers = ["Date", "Order ID", "Type", "Category", "Amount", "Tax", "Discount", "Net Amount", "Payment Method", "Status"];
  const rows = data.transactions.map((t: any) => [
    t.date,
    t.orderId,
    t.type,
    t.category,
    t.amount,
    t.tax,
    t.discount,
    t.netAmount,
    t.paymentMethod,
    t.status,
  ]);
  
  return [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
}
