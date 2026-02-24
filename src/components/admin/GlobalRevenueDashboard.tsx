"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Building2, CreditCard, BarChart3 } from "lucide-react";

export default function GlobalRevenueDashboard() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalRevenue();
  }, [period]);

  const fetchGlobalRevenue = async () => {
    try {
      const response = await fetch(`/api/revenue/analytics?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (type: string) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();

    const response = await fetch("/api/revenue/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: "json",
      }),
    });

    const result = await response.json();
    const blob = new Blob([JSON.stringify(result.report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${Date.now()}.json`;
    a.click();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Global Revenue Analytics</h2>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button onClick={() => downloadReport("global_summary")}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Total Revenue</p>
              <p className="text-4xl font-bold mt-2">
                {(data.totalRevenue / 1000000).toFixed(2)}M RWF
              </p>
            </div>
            <TrendingUp className="w-16 h-16 opacity-30" />
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-emerald-100">
              +{data.revenueGrowth.toFixed(1)}% vs last period
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Transactions</p>
              <p className="text-4xl font-bold mt-2">{data.totalTransactions.toLocaleString()}</p>
            </div>
            <CreditCard className="w-16 h-16 opacity-30" />
          </div>
          <div className="mt-4">
            <span className="text-blue-100">
              +{data.transactionGrowth.toFixed(1)}% growth
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Avg Transaction</p>
              <p className="text-4xl font-bold mt-2">
                {data.averageTransaction.toLocaleString()} RWF
              </p>
            </div>
            <BarChart3 className="w-16 h-16 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Active Branches</p>
              <p className="text-4xl font-bold mt-2">{data.topBranches.length}</p>
            </div>
            <Building2 className="w-16 h-16 opacity-30" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Top Branches by Revenue</h3>
          <div className="space-y-4">
            {data.topBranches.map((branch: any, index: number) => (
              <div key={branch.branchId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">
                    {index + 1}
                  </div>
                  <span className="font-semibold capitalize">{branch.branchId}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{branch.revenue.toLocaleString()} RWF</p>
                  <p className="text-sm text-gray-600">{branch.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Revenue by Category</h3>
          <div className="space-y-4">
            {data.topCategories.map((cat: any) => (
              <div key={cat.category}>
                <div className="flex justify-between mb-2">
                  <span className="capitalize font-semibold">{cat.category}</span>
                  <span>{cat.revenue.toLocaleString()} RWF</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Payment Methods Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.topPaymentMethods.map((method: any) => (
            <div key={method.method} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 capitalize">{method.method}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {(method.revenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">{method.count} txns</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Monthly Revenue Trend</h3>
          <Button variant="outline" onClick={() => downloadReport("comparison")}>
            <Download className="w-4 h-4 mr-2" />
            Export Comparison
          </Button>
        </div>
        <div className="h-80 flex items-end space-x-2">
          {data.monthlyTrend.map((month: any, index: number) => {
            const maxRevenue = Math.max(...data.monthlyTrend.map((m: any) => m.revenue));
            const height = (month.revenue / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${month.month}: ${month.revenue.toLocaleString()} RWF`}
                />
                <span className="text-xs mt-2 text-gray-600">{month.month.split("-")[1]}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
