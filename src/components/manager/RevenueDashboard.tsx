"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, ArrowUpRight } from "lucide-react";

interface RevenueData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  growth: number;
  revenueByType: Record<string, number>;
  revenueByMethod: Record<string, number>;
  revenueByCategory: Record<string, number>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

export default function RevenueDashboard({ branchId }: { branchId: string }) {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, [branchId, period]);

  const fetchRevenue = async () => {
    try {
      const response = await fetch(`/api/revenue/branch?branchId=${branchId}&period=${period}`);
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

  if (loading) {
    return <div className="p-8">Loading revenue data...</div>;
  }

  if (!data) {
    return <div className="p-8">No revenue data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Revenue Analytics</h2>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-600">
                {data.totalRevenue.toLocaleString()} RWF
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-emerald-600 opacity-20" />
          </div>
          <div className="mt-4 flex items-center">
            {data.growth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className={data.growth >= 0 ? "text-green-600" : "text-red-600"}>
              {Math.abs(data.growth).toFixed(1)}%
            </span>
            <span className="text-gray-600 ml-2 text-sm">vs last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-3xl font-bold">{data.totalTransactions}</p>
            </div>
            <CreditCard className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="text-3xl font-bold">
                {data.averageTransaction.toLocaleString()} RWF
              </p>
            </div>
            <ArrowUpRight className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Category</p>
              <p className="text-2xl font-bold">
                {Object.keys(data.revenueByCategory)[0] || "N/A"}
              </p>
            </div>
            <Users className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Revenue by Type</h3>
          <div className="space-y-3">
            {Object.entries(data.revenueByType).map(([type, amount]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="capitalize">{type}</span>
                <span className="font-semibold">{amount.toLocaleString()} RWF</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(data.revenueByMethod).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="capitalize">{method}</span>
                <span className="font-semibold">{amount.toLocaleString()} RWF</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Daily Revenue Trend</h3>
        <div className="h-64 flex items-end space-x-2">
          {data.dailyRevenue.map((day, index) => {
            const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.amount));
            const height = (day.amount / maxRevenue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-emerald-600 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.amount.toLocaleString()} RWF`}
                />
                <span className="text-xs mt-2 text-gray-600">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
