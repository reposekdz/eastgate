"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Bell,
  RefreshCw,
} from "lucide-react";

export default function WaiterDashboardEnhanced() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/waiter/dashboard?branchId=${user?.branchId}&waiterId=${user?.id}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.branchId) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.branchId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch("/api/manager/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status, userId: user?.id }),
      });
      toast.success(`Order ${status.toLowerCase()}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const orders = data?.orders || [];
  const myOrders = data?.myOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
          <p className="text-sm text-text-muted-custom">Real-time order management</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-8 w-8 text-emerald" />
              <Badge>{metrics.myOrders}</Badge>
            </div>
            <p className="text-sm text-text-muted-custom">My Orders</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.myRevenue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <Badge className="bg-orange-100 text-orange-700">{metrics.pending}</Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Pending Orders</p>
            <p className="text-2xl font-bold">{metrics.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-8 w-8 text-blue-500" />
              <Badge className="bg-blue-100 text-blue-700">{metrics.preparing}</Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Preparing</p>
            <p className="text-2xl font-bold">{metrics.preparing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-emerald" />
              <Badge className="bg-emerald-100 text-emerald-700">{metrics.ready}</Badge>
            </div>
            <p className="text-sm text-text-muted-custom">Ready to Serve</p>
            <p className="text-2xl font-bold">{metrics.ready}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {["PENDING", "PREPARING", "READY"].map((status) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {status}
                <Badge>{orders.filter((o: any) => o.status === status).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders
                .filter((o: any) => o.status === status)
                .map((order: any) => (
                  <div key={order.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Table {order.tableNumber || order.roomNumber}</span>
                      <Badge variant="outline">{order.priority}</Badge>
                    </div>
                    <div className="text-sm text-text-muted-custom">
                      {order.items.map((item: any) => (
                        <div key={item.id}>
                          {item.quantity}x {item.menuItem.name}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatCurrency(order.total)}</span>
                      <div className="flex gap-2">
                        {status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "PREPARING")}
                          >
                            Start
                          </Button>
                        )}
                        {status === "PREPARING" && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "READY")}
                          >
                            Ready
                          </Button>
                        )}
                        {status === "READY" && (
                          <Button
                            size="sm"
                            className="bg-emerald"
                            onClick={() => updateOrderStatus(order.id, "SERVED")}
                          >
                            Serve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
