"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";

export default function PaymentDashboard({ branchId }: { branchId?: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStats();
    const interval = setInterval(fetchPaymentStats, 30000);
    return () => clearInterval(interval);
  }, [branchId]);

  const fetchPaymentStats = async () => {
    try {
      const endpoint = branchId 
        ? `/api/revenue/branch?branchId=${branchId}&period=today`
        : `/api/revenue/analytics?period=today`;
      
      const response = await fetch(endpoint);
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!stats) return <div className="p-8">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Payment Dashboard</h2>
        <Button onClick={fetchPaymentStats} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Today's Revenue</p>
              <p className="text-3xl font-bold mt-2">
                {stats.totalRevenue?.toLocaleString() || 0} RWF
              </p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-30" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-sm">Live tracking</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-2">
                {stats.totalTransactions || 0}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-30" />
          </div>
          <p className="text-sm text-blue-100 mt-4">Successful payments</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
            <Clock className="w-12 h-12 opacity-30" />
          </div>
          <p className="text-sm text-yellow-100 mt-4">Awaiting confirmation</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Failed</p>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
            <XCircle className="w-12 h-12 opacity-30" />
          </div>
          <p className="text-sm text-red-100 mt-4">Declined payments</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {stats.topPaymentMethods?.map((method: any) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold text-sm">
                      {method.method.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{method.method}</p>
                    <p className="text-sm text-gray-600">{method.count} transactions</p>
                  </div>
                </div>
                <p className="font-bold text-emerald-600">
                  {method.revenue.toLocaleString()} RWF
                </p>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Revenue by Category</h3>
          <div className="space-y-4">
            {stats.topCategories?.map((cat: any) => (
              <div key={cat.category}>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold capitalize">{cat.category}</span>
                  <span className="text-gray-600">{cat.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {cat.revenue.toLocaleString()} RWF
                </p>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Recent Transactions</h3>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Real-time transactions will appear here
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
