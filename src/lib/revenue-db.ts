export interface Revenue {
  id: string;
  branchId: string;
  date: Date;
  type: "booking" | "order" | "menu" | "event" | "spa" | "service";
  category: "rooms" | "food" | "beverage" | "events" | "spa" | "other";
  amount: number;
  currency: string;
  paymentMethod: string;
  orderId: string;
  transactionId: string;
  customerId: string;
  status: "pending" | "completed" | "refunded" | "cancelled";
  tax: number;
  discount: number;
  netAmount: number;
  commission: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchRevenue {
  branchId: string;
  branchName: string;
  period: string;
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  revenueByType: Record<string, number>;
  revenueByMethod: Record<string, number>;
  revenueByCategory: Record<string, number>;
  growth: number;
  topProducts: Array<{ name: string; revenue: number; count: number }>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  revenueGrowth: number;
  transactionGrowth: number;
  topBranches: Array<{ branchId: string; revenue: number; percentage: number }>;
  topCategories: Array<{ category: string; revenue: number; percentage: number }>;
  topPaymentMethods: Array<{ method: string; revenue: number; count: number }>;
  hourlyDistribution: Array<{ hour: number; revenue: number; transactions: number }>;
  weeklyTrend: Array<{ week: string; revenue: number }>;
  monthlyTrend: Array<{ month: string; revenue: number }>;
}

const revenues: Map<string, Revenue> = new Map();

export async function createRevenue(data: Omit<Revenue, "id" | "createdAt" | "updatedAt">): Promise<Revenue> {
  const revenue: Revenue = {
    ...data,
    id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  revenues.set(revenue.id, revenue);
  return revenue;
}

export async function getRevenueByBranch(branchId: string, startDate: Date, endDate: Date): Promise<Revenue[]> {
  return Array.from(revenues.values()).filter(
    r => r.branchId === branchId && r.date >= startDate && r.date <= endDate && r.status === "completed"
  );
}

export async function getAllRevenue(startDate: Date, endDate: Date): Promise<Revenue[]> {
  return Array.from(revenues.values()).filter(
    r => r.date >= startDate && r.date <= endDate && r.status === "completed"
  );
}

export async function getBranchRevenueAnalytics(branchId: string, period: string): Promise<BranchRevenue> {
  const { startDate, endDate } = getPeriodDates(period);
  const branchRevenues = await getRevenueByBranch(branchId, startDate, endDate);
  
  const totalRevenue = branchRevenues.reduce((sum, r) => sum + r.netAmount, 0);
  const totalTransactions = branchRevenues.length;
  
  const revenueByType: Record<string, number> = {};
  const revenueByMethod: Record<string, number> = {};
  const revenueByCategory: Record<string, number> = {};
  const productRevenue: Map<string, { revenue: number; count: number }> = new Map();
  
  branchRevenues.forEach(r => {
    revenueByType[r.type] = (revenueByType[r.type] || 0) + r.netAmount;
    revenueByMethod[r.paymentMethod] = (revenueByMethod[r.paymentMethod] || 0) + r.netAmount;
    revenueByCategory[r.category] = (revenueByCategory[r.category] || 0) + r.netAmount;
  });
  
  const previousPeriod = getPreviousPeriod(period);
  const previousRevenues = await getRevenueByBranch(branchId, previousPeriod.startDate, previousPeriod.endDate);
  const previousTotal = previousRevenues.reduce((sum, r) => sum + r.netAmount, 0);
  const growth = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0;
  
  return {
    branchId,
    branchName: getBranchName(branchId),
    period,
    totalRevenue,
    totalTransactions,
    averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    revenueByType,
    revenueByMethod,
    revenueByCategory,
    growth,
    topProducts: [],
    dailyRevenue: getDailyRevenue(branchRevenues, startDate, endDate),
  };
}

export async function getGlobalRevenueAnalytics(period: string): Promise<RevenueAnalytics> {
  const { startDate, endDate } = getPeriodDates(period);
  const allRevenues = await getAllRevenue(startDate, endDate);
  
  const totalRevenue = allRevenues.reduce((sum, r) => sum + r.netAmount, 0);
  const totalTransactions = allRevenues.length;
  
  const branchRevenue: Map<string, number> = new Map();
  const categoryRevenue: Map<string, number> = new Map();
  const methodStats: Map<string, { revenue: number; count: number }> = new Map();
  
  allRevenues.forEach(r => {
    branchRevenue.set(r.branchId, (branchRevenue.get(r.branchId) || 0) + r.netAmount);
    categoryRevenue.set(r.category, (categoryRevenue.get(r.category) || 0) + r.netAmount);
    
    const methodStat = methodStats.get(r.paymentMethod) || { revenue: 0, count: 0 };
    methodStat.revenue += r.netAmount;
    methodStat.count += 1;
    methodStats.set(r.paymentMethod, methodStat);
  });
  
  const previousPeriod = getPreviousPeriod(period);
  const previousRevenues = await getAllRevenue(previousPeriod.startDate, previousPeriod.endDate);
  const previousTotal = previousRevenues.reduce((sum, r) => sum + r.netAmount, 0);
  const revenueGrowth = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0;
  const transactionGrowth = previousRevenues.length > 0 ? ((totalTransactions - previousRevenues.length) / previousRevenues.length) * 100 : 0;
  
  return {
    totalRevenue,
    totalTransactions,
    averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
    revenueGrowth,
    transactionGrowth,
    topBranches: Array.from(branchRevenue.entries())
      .map(([branchId, revenue]) => ({ branchId, revenue, percentage: (revenue / totalRevenue) * 100 }))
      .sort((a, b) => b.revenue - a.revenue),
    topCategories: Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({ category, revenue, percentage: (revenue / totalRevenue) * 100 }))
      .sort((a, b) => b.revenue - a.revenue),
    topPaymentMethods: Array.from(methodStats.entries())
      .map(([method, stats]) => ({ method, revenue: stats.revenue, count: stats.count }))
      .sort((a, b) => b.revenue - a.revenue),
    hourlyDistribution: getHourlyDistribution(allRevenues),
    weeklyTrend: getWeeklyTrend(allRevenues),
    monthlyTrend: getMonthlyTrend(allRevenues),
  };
}

function getPeriodDates(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  
  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { startDate, endDate };
}

function getPreviousPeriod(period: string): { startDate: Date; endDate: Date } {
  const { startDate, endDate } = getPeriodDates(period);
  const duration = endDate.getTime() - startDate.getTime();
  
  return {
    startDate: new Date(startDate.getTime() - duration),
    endDate: new Date(startDate.getTime()),
  };
}

function getDailyRevenue(revenues: Revenue[], startDate: Date, endDate: Date): Array<{ date: string; amount: number }> {
  const daily: Map<string, number> = new Map();
  
  revenues.forEach(r => {
    const date = r.date.toISOString().split("T")[0];
    daily.set(date, (daily.get(date) || 0) + r.netAmount);
  });
  
  return Array.from(daily.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getHourlyDistribution(revenues: Revenue[]): Array<{ hour: number; revenue: number; transactions: number }> {
  const hourly: Map<number, { revenue: number; transactions: number }> = new Map();
  
  revenues.forEach(r => {
    const hour = r.date.getHours();
    const stats = hourly.get(hour) || { revenue: 0, transactions: 0 };
    stats.revenue += r.netAmount;
    stats.transactions += 1;
    hourly.set(hour, stats);
  });
  
  return Array.from(hourly.entries())
    .map(([hour, stats]) => ({ hour, ...stats }))
    .sort((a, b) => a.hour - b.hour);
}

function getWeeklyTrend(revenues: Revenue[]): Array<{ week: string; revenue: number }> {
  const weekly: Map<string, number> = new Map();
  
  revenues.forEach(r => {
    const week = getWeekNumber(r.date);
    weekly.set(week, (weekly.get(week) || 0) + r.netAmount);
  });
  
  return Array.from(weekly.entries())
    .map(([week, revenue]) => ({ week, revenue }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

function getMonthlyTrend(revenues: Revenue[]): Array<{ month: string; revenue: number }> {
  const monthly: Map<string, number> = new Map();
  
  revenues.forEach(r => {
    const month = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(month, (monthly.get(month) || 0) + r.netAmount);
  });
  
  return Array.from(monthly.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getBranchName(branchId: string): string {
  const branches: Record<string, string> = {
    kigali: "Kigali Main",
    ngoma: "Ngoma Branch",
    kirehe: "Kirehe Branch",
    gatsibo: "Gatsibo Branch",
  };
  return branches[branchId] || branchId;
}
