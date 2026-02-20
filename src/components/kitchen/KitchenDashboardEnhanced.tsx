"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Timer,
  RefreshCw,
} from "lucide-react";

export default function KitchenDashboardEnhanced() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const branchId = "br-001";

  const loadData = async () => {
    try {
      const res = await fetch(`/api/kitchen/dashboard?branchId=${branchId}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Failed to load kitchen data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateItemStatus = async (orderId: string, status: string) => {
    try {
      await fetch("/api/manager/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
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
  const itemsByCategory = data?.itemsByCategory || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-emerald" />
            Kitchen Dashboard
          </h1>
          <p className="text-sm text-text-muted-custom">Live order queue</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-3xl font-bold">{metrics.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Preparing</span>
            </div>
            <p className="text-3xl font-bold">{metrics.preparing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald" />
              <span className="text-sm font-medium">Ready</span>
            </div>
            <p className="text-3xl font-bold">{metrics.ready}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Urgent</span>
            </div>
            <p className="text-3xl font-bold">{metrics.urgent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Avg Time</span>
            </div>
            <p className="text-3xl font-bold">{metrics.avgPrepTime}m</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          {Object.keys(itemsByCategory).map((category) => (
            <TabsTrigger key={category} value={category}>
              {category} ({itemsByCategory[category].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order: any) => (
              <Card
                key={order.id}
                className={`${
                  order.priority === "URGENT"
                    ? "border-red-500 border-2"
                    : order.priority === "HIGH"
                    ? "border-orange-500"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {order.type === "ROOM_SERVICE" ? `Room ${order.roomNumber}` : `Table ${order.tableNumber}`}
                    </CardTitle>
                    <Badge
                      className={
                        order.status === "PENDING"
                          ? "bg-orange-100 text-orange-700"
                          : order.status === "PREPARING"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted-custom">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>
                        <Badge variant="outline" className="mr-2">
                          {item.quantity}x
                        </Badge>
                        {item.menuItem.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          item.status === "READY"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "PREPARING"
                            ? "bg-blue-50 text-blue-700"
                            : ""
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-xs text-text-muted-custom italic">Note: {order.notes}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    {order.status === "PENDING" && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => updateItemStatus(order.id, "PREPARING")}
                      >
                        Start Cooking
                      </Button>
                    )}
                    {order.status === "PREPARING" && (
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald"
                        onClick={() => updateItemStatus(order.id, "READY")}
                      >
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {Object.entries(itemsByCategory).map(([category, items]: [string, any]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{item.menuItem.name}</p>
                        <p className="text-sm text-text-muted-custom">Qty: {item.quantity}</p>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
