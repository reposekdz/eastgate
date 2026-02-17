"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { useAppDataStore } from "@/lib/store/app-data-store";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Receipt,
  PiggyBank,
} from "lucide-react";

const EXPENSE_COLORS = ["#0B6E4F", "#C8A951", "#3B82F6", "#EF4444", "#8B5CF6", "#F59E0B", "#10B981", "#94A3B8"];

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-[8px] border bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-charcoal mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-text-muted-custom">{entry.name}</span>
          </div>
          <span className="font-medium text-charcoal">{formatCompactCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancePage() {
  const { user } = useAuthStore();
  const getBranches = useBranchStore((s) => s.getBranches);
  const getBookings = useBranchStore((s) => s.getBookings);
  const getOrders = useBranchStore((s) => s.getOrders);
  const getEvents = useBranchStore((s) => s.getEvents);
  const { branches, rooms: allRooms, restaurantOrders, events } = useAppDataStore();

  const role = user?.role ?? "guest";
  const branchList = getBranches(role, "all");

  const revenueData = useMemo(() => {
    const byMonth: Record<number, { month: string; rooms: number; restaurant: number; events: number; spa: number; services: number }> = {};
    MONTHS.forEach((m, i) => {
      byMonth[i] = { month: m, rooms: 0, restaurant: 0, events: 0, spa: 0, services: 0 };
    });
    getBookings("all", role).forEach((b) => {
      const i = new Date(b.checkIn).getMonth();
      if (byMonth[i]) byMonth[i].rooms += b.totalAmount;
    });
    restaurantOrders.forEach((o) => {
      const i = new Date(o.createdAt).getMonth();
      if (byMonth[i]) byMonth[i].restaurant += o.total;
    });
    getEvents("all", role).forEach((e) => {
      const i = new Date(e.date).getMonth();
      if (byMonth[i]) byMonth[i].events += e.totalAmount;
    });
    return Object.values(byMonth);
  }, [getBookings, getEvents, restaurantOrders, role]);

  const expenseData = useMemo(() => {
    const totalRev = revenueData.reduce((s, d) => s + d.rooms + d.restaurant + d.events + d.spa + d.services, 0);
    const salaries = Math.round(totalRev * 0.38);
    const utilities = Math.round(totalRev * 0.09);
    const maintenance = Math.round(totalRev * 0.06);
    const supplies = Math.round(totalRev * 0.05);
    const other = Math.round(totalRev * 0.04);
    const total = salaries + utilities + maintenance + supplies + other;
    return [
      { category: "Staff Salaries", amount: salaries, percentage: total ? Math.round((salaries / total) * 100) : 0 },
      { category: "Utilities", amount: utilities, percentage: total ? Math.round((utilities / total) * 100) : 0 },
      { category: "Maintenance", amount: maintenance, percentage: total ? Math.round((maintenance / total) * 100) : 0 },
      { category: "Supplies", amount: supplies, percentage: total ? Math.round((supplies / total) * 100) : 0 },
      { category: "Other", amount: other, percentage: total ? Math.round((other / total) * 100) : 0 },
    ];
  }, [revenueData]);

  const branchComparison = useMemo(() => {
    return branchList.map((b) => {
      const brBookings = getBookings(b.id, role);
      const revenue = brBookings
        .filter((x) => ["checked_in", "checked_out", "confirmed"].includes(x.status))
        .reduce((s, x) => s + x.totalAmount, 0);
      const brRooms = allRooms.filter((r) => r.branchId === b.id);
      const occupied = brRooms.filter((r) => r.status === "occupied" || r.status === "reserved").length;
      const occupancy = brRooms.length ? Math.round((occupied / brRooms.length) * 100) : 0;
      const adr = brBookings.filter((x) => x.status === "checked_in" || x.status === "checked_out").length
        ? Math.round(
            brBookings
              .filter((x) => x.status === "checked_in" || x.status === "checked_out")
              .reduce((s, x) => s + x.totalAmount, 0) /
              brBookings.filter((x) => x.status === "checked_in" || x.status === "checked_out").length
          )
        : 0;
      return { branch: b.name, revenue, occupancy, adr };
    });
  }, [branchList, getBookings, allRooms, role]);

  const totalRevenue = revenueData.reduce(
    (sum, d) => sum + d.rooms + d.restaurant + d.events + d.spa + d.services,
    0
  );
  const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-md text-charcoal">Financial Reports</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Revenue breakdown, expenses, and profitability analysis
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4 shadow-xs border-transparent">
          <CardContent className="px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted-custom">Total Revenue</p>
                <p className="text-2xl font-bold text-charcoal mt-1">{formatCompactCurrency(totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald" />
                  <span className="text-xs font-semibold text-emerald">12.5%</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald/10">
                <DollarSign className="h-5 w-5 text-emerald" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 shadow-xs border-transparent">
          <CardContent className="px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted-custom">Total Expenses</p>
                <p className="text-2xl font-bold text-charcoal mt-1">{formatCompactCurrency(totalExpenses)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">3.2%</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 shadow-xs border-transparent">
          <CardContent className="px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted-custom">Net Profit</p>
                <p className="text-2xl font-bold text-emerald mt-1">{formatCompactCurrency(netProfit)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald" />
                  <span className="text-xs font-semibold text-emerald">18.7%</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gold/10">
                <PiggyBank className="h-5 w-5 text-gold-dark" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue">
        <TabsList className="bg-pearl/50">
          <TabsTrigger value="revenue" className="text-sm data-[state=active]:bg-white">Revenue</TabsTrigger>
          <TabsTrigger value="expenses" className="text-sm data-[state=active]:bg-white">Expenses</TabsTrigger>
          <TabsTrigger value="branches" className="text-sm data-[state=active]:bg-white">Branch Comparison</TabsTrigger>
        </TabsList>

        {/* Revenue Breakdown */}
        <TabsContent value="revenue" className="mt-4">
          <Card className="py-4 shadow-xs border-transparent">
            <CardHeader className="px-5 pb-0">
              <CardTitle className="text-sm font-semibold text-charcoal">Revenue by Stream</CardTitle>
              <CardDescription className="text-xs text-text-muted-custom">Stacked monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pt-4">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B6B7B" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B6B7B" }} tickFormatter={(v) => `$${v / 1000}K`} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend verticalAlign="top" align="right" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }} />
                    <Bar dataKey="rooms" name="Rooms" stackId="a" fill="#0B6E4F" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="restaurant" name="Restaurant" stackId="a" fill="#C8A951" />
                    <Bar dataKey="events" name="Events" stackId="a" fill="#8B5CF6" />
                    <Bar dataKey="spa" name="Spa" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="services" name="Services" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="py-4 shadow-xs border-transparent">
              <CardHeader className="px-5 pb-0">
                <CardTitle className="text-sm font-semibold text-charcoal">Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseData} cx="50%" cy="50%" outerRadius={100} dataKey="amount" nameKey="category" strokeWidth={2} stroke="#fff">
                        {expenseData.map((_, i) => (
                          <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value as number), ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="py-4 shadow-xs border-transparent">
              <CardHeader className="px-5 pb-0">
                <CardTitle className="text-sm font-semibold text-charcoal">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pt-4 space-y-4">
                {expenseData.map((expense, i) => (
                  <div key={expense.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i] }} />
                        <span className="text-sm text-charcoal">{expense.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-charcoal">{formatCurrency(expense.amount)}</span>
                        <span className="text-xs text-text-muted-custom">{expense.percentage}%</span>
                      </div>
                    </div>
                    <Progress value={expense.percentage} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branch Comparison */}
        <TabsContent value="branches" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branchComparison.map((branch, i) => (
              <Card key={branch.branch} className="py-4 shadow-xs border-transparent">
                <CardContent className="px-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: EXPENSE_COLORS[i] }} />
                    <h3 className="text-sm font-semibold text-charcoal">{branch.branch}</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Revenue</p>
                      <p className="text-xl font-bold text-charcoal">{formatCompactCurrency(branch.revenue)}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted-custom">Occupancy</p>
                        <p className="text-sm font-semibold text-charcoal">{branch.occupancy}%</p>
                      </div>
                      <Progress value={branch.occupancy} className="h-2" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted-custom mb-1">Avg. Daily Rate</p>
                      <p className="text-lg font-bold text-emerald">{formatCurrency(branch.adr)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
