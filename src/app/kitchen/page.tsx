"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRealTimeNotifications } from "@/hooks/useRealTimeNotifications";
import { ChefHat, Clock, CheckCircle, AlertCircle, RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export default function KitchenDashboard() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("eastgate-token") : "";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { unreadCount } = useRealTimeNotifications(5000);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/kitchen/orders?branchId=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [branchId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch("/api/orders/status", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${status === "preparing" ? "started" : status === "ready" ? "ready for serving" : "completed"}!`);
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to update order");
      }
    } catch (error) {
      toast.error("Failed to update order");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-emerald rounded-xl flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">Kitchen Dashboard</h1>
              <p className="text-sm text-text-muted-custom">Manage orders and preparation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <div className="relative">
                <Bell className="h-5 w-5 text-emerald" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              </div>
            )}
            <Button onClick={fetchOrders} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-xs text-text-muted-custom">Pending Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preparingOrders.length}</p>
                <p className="text-xs text-text-muted-custom">Preparing</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyOrders.length}</p>
                <p className="text-xs text-text-muted-custom">Ready</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ChefHat className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders</h3>
              <p className="text-slate-500">Orders will appear here when placed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Pending ({pendingOrders.length})
              </h2>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-yellow-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Order #{order.id.slice(-6)}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-xs text-text-muted-custom">
                        {order.guestName || "Guest"} • Room {order.roomNumber || order.tableNumber || "N/A"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                          <span className="text-text-muted-custom">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      {order.specialInstructions && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          Note: {order.specialInstructions}
                        </p>
                      )}
                      <Button
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        disabled={updating === order.id}
                        className="w-full bg-blue-500 hover:bg-blue-600 mt-2"
                      >
                        {updating === order.id ? "Updating..." : "Start Preparing"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preparing */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Preparing ({preparingOrders.length})
              </h2>
              <div className="space-y-3">
                {preparingOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Order #{order.id.slice(-6)}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-xs text-text-muted-custom">
                        {order.guestName || "Guest"} • Room {order.roomNumber || order.tableNumber || "N/A"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                          <span className="text-text-muted-custom">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      <Button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        disabled={updating === order.id}
                        className="w-full bg-green-500 hover:bg-green-600 mt-2"
                      >
                        {updating === order.id ? "Updating..." : "Mark as Ready"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Ready */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ready ({readyOrders.length})
              </h2>
              <div className="space-y-3">
                {readyOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Order #{order.id.slice(-6)}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-xs text-text-muted-custom">
                        {order.guestName || "Guest"} • Room {order.roomNumber || order.tableNumber || "N/A"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem?.name || item.name}</span>
                          <span className="text-text-muted-custom">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                      <Button
                        onClick={() => updateOrderStatus(order.id, "served")}
                        disabled={updating === order.id}
                        variant="outline"
                        className="w-full mt-2"
                      >
                        {updating === order.id ? "Updating..." : "Mark as Served"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
