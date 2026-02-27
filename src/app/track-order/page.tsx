"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle2, ChefHat, Truck, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const trackOrder = async () => {
    if (!orderNumber && !guestEmail) {
      toast.error("Please enter order number or email");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderNumber) params.append("orderNumber", orderNumber);
      if (guestEmail) params.append("guestEmail", guestEmail);

      const response = await fetch(`/api/orders/status?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        if (data.orders.length === 0) {
          toast.info("No orders found");
        } else {
          toast.success(`Found ${data.orders.length} order(s)`);
          setAutoRefresh(true);
        }
      } else {
        toast.error("Failed to track order");
      }
    } catch (error) {
      toast.error("Failed to track order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh || orders.length === 0) return;

    const interval = setInterval(() => {
      trackOrder();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, orders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "preparing":
        return <ChefHat className="h-5 w-5 text-blue-600" />;
      case "ready":
        return <Package className="h-5 w-5 text-green-600" />;
      case "served":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "served":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your order has been received and is waiting to be prepared";
      case "preparing":
        return "Our kitchen is preparing your order";
      case "ready":
        return "Your order is ready! It will be served shortly";
      case "served":
        return "Your order has been served. Enjoy your meal!";
      default:
        return "Order status unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-charcoal mb-2">Track Your Order</h1>
          <p className="text-slate-600">Enter your order number or email to track your order status</p>
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 text-sm mt-2 inline-block">
            ← Back to Home
          </Link>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-600" />
              Search Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Order Number</label>
              <Input
                placeholder="e.g., ORD-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && trackOrder()}
              />
            </div>
            <div className="text-center text-sm text-slate-500">OR</div>
            <div>
              <label className="text-sm font-medium mb-2 block">Guest Email</label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && trackOrder()}
              />
            </div>
            <Button
              onClick={trackOrder}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Placed on {new Date(order.createdAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Timeline */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      {["pending", "preparing", "ready", "served"].map((status, index) => (
                        <div key={status} className="flex flex-col items-center flex-1">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              ["pending", "preparing", "ready", "served"].indexOf(order.status) >= index
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {getStatusIcon(status)}
                          </div>
                          <p className="text-xs mt-2 text-center capitalize">{status}</p>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${
                            (["pending", "preparing", "ready", "served"].indexOf(order.status) / 3) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-emerald-800 font-medium">
                      {getStatusMessage(order.status)}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">
                            {(item.price * item.quantity).toLocaleString()} RWF
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{order.total.toLocaleString()} RWF</span>
                    </div>
                  </div>

                  {/* Auto Refresh Indicator */}
                  {autoRefresh && order.status !== "served" && (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Auto-refreshing every 10 seconds
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
