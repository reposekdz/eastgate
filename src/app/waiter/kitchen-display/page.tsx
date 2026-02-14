"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  Clock,
  ChefHat,
  CheckCircle,
  AlertCircle,
  Timer,
  User,
  MapPin,
  Package,
  ArrowRight,
  Bell,
  Flame,
  UtensilsCrossed,
  Store,
  Truck,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KitchenOrder {
  id: string;
  customerName: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  items: Array<{
    item: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    status: "pending" | "preparing" | "ready";
  }>;
  total: number;
  status: "pending" | "confirmed" | "preparing" | "ready";
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  specialInstructions?: string;
}

const statusConfig: Record<
  "pending" | "confirmed" | "preparing" | "ready",
  {
    label: string;
    color: string;
    bg: string;
    icon: typeof Bell;
    next?: "pending" | "confirmed" | "preparing" | "ready";
    nextLabel?: string;
  }
> = {
  pending: {
    label: "New Order",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-300",
    icon: Bell,
    next: "confirmed",
    nextLabel: "Accept Order",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-300",
    icon: CheckCircle,
    next: "preparing",
    nextLabel: "Start Cooking",
  },
  preparing: {
    label: "Cooking",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-300",
    icon: ChefHat,
    next: "ready",
    nextLabel: "Mark Ready",
  },
  ready: {
    label: "Ready",
    color: "text-green-600",
    bg: "bg-green-50 border-green-300",
    icon: Package,
  },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-400" },
  normal: { label: "Normal", color: "bg-blue-500" },
  high: { label: "High", color: "bg-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-600 animate-pulse" },
};

const orderTypeIcons = {
  dine_in: UtensilsCrossed,
  takeaway: Store,
  delivery: Truck,
};

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filter, setFilter] = useState<"all" | KitchenOrder["status"]>("all");
  const [sortBy, setSortBy] = useState<"time" | "priority">("priority");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadOrders();
    
    // Add sample orders if none exist
    const savedOrders = localStorage.getItem("eastgate-food-orders");
    if (!savedOrders || JSON.parse(savedOrders).length === 0) {
      const sampleOrders: KitchenOrder[] = [
        {
          id: "ORD-" + Date.now(),
          customerName: "John Doe",
          orderType: "dine_in",
          tableNumber: "5",
          items: [
            { item: { id: "1", name: "Grilled Tilapia", price: 23400 }, quantity: 2, status: "pending" },
            { item: { id: "2", name: "Rwandan Coffee", price: 6500 }, quantity: 2, status: "pending" },
          ],
          total: 59800,
          status: "pending",
          priority: "normal",
          createdAt: new Date().toISOString(),
        },
        {
          id: "ORD-" + (Date.now() + 1),
          customerName: "Jane Smith",
          orderType: "takeaway",
          items: [
            { item: { id: "3", name: "Brochette Platter", price: 28600 }, quantity: 1, status: "pending" },
          ],
          total: 28600,
          status: "confirmed",
          priority: "normal",
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "ORD-" + (Date.now() + 2),
          customerName: "Mike Johnson",
          orderType: "delivery",
          items: [
            { item: { id: "4", name: "Nyama Choma", price: 32500 }, quantity: 1, status: "preparing" },
            { item: { id: "5", name: "Fresh Juice", price: 7800 }, quantity: 2, status: "preparing" },
          ],
          total: 48100,
          status: "preparing",
          priority: "high",
          createdAt: new Date(Date.now() - 600000).toISOString(),
          specialInstructions: "Extra spicy, no onions",
        },
      ];
      localStorage.setItem("eastgate-food-orders", JSON.stringify(sampleOrders));
    }
    
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem("eastgate-food-orders");
    if (savedOrders) {
      const parsedOrders: KitchenOrder[] = JSON.parse(savedOrders).map((order: KitchenOrder) => {
        const minutesAgo = (Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60;
        
        // Assign priority based on time and order type
        let priority: KitchenOrder["priority"] = "normal";
        if (minutesAgo > 30) priority = "urgent";
        else if (minutesAgo > 20) priority = "high";
        else if (order.orderType === "delivery") priority = "high";
        
        return {
          ...order,
          priority,
          items: order.items.map((item: KitchenOrder['items'][0]) => ({
            ...item,
            status: order.status === "preparing" ? "preparing" : order.status === "ready" ? "ready" : "pending",
          })),
        };
      });
      setOrders(parsedOrders);
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: KitchenOrder["status"]) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    
    // Update localStorage
    const savedOrders = JSON.parse(localStorage.getItem("eastgate-food-orders") || "[]");
    const updated = savedOrders.map((order: KitchenOrder) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    localStorage.setItem("eastgate-food-orders", JSON.stringify(updated));
    
    toast.success(`Order ${orderId} marked as ${statusConfig[newStatus].label}`);
    
    // Play sound for new orders (in production, use actual sound file)
    if (newStatus === "confirmed") {
      console.log("🔔 Order accepted!");
    }
  };

  const getWaitTime = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60);
    if (minutes < 1) return "Just now";
    return `${minutes} min ago`;
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return order.status !== "ready";
    return order.status === filter;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const totalActive = pendingCount + confirmedCount + preparingCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald/20 flex items-center justify-center">
                <ChefHat className="h-7 w-7 text-emerald" />
              </div>
              Kitchen Display
            </h1>
            <p className="text-gray-400 mt-1">Real-time order management</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                autoRefresh && "bg-emerald hover:bg-emerald-dark"
              )}
            >
              <RefreshCcw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
              Auto Refresh
            </Button>
            
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Sort: Priority</SelectItem>
                <SelectItem value="time">Sort: Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <Bell className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-3xl font-bold">{pendingCount}</p>
              <p className="text-xs text-gray-400">New Orders</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="text-3xl font-bold">{confirmedCount}</p>
              <p className="text-xs text-gray-400">Confirmed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-400" />
              <p className="text-3xl font-bold">{preparingCount}</p>
              <p className="text-xs text-gray-400">Cooking</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="text-3xl font-bold">{readyCount}</p>
              <p className="text-xs text-gray-400">Ready</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-400" />
              <p className="text-3xl font-bold">{totalActive}</p>
              <p className="text-xs text-gray-400">Active</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all">All Active ({totalActive})</TabsTrigger>
          <TabsTrigger value="pending">New ({pendingCount})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
          <TabsTrigger value="preparing">Cooking ({preparingCount})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({readyCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders Grid */}
      {sortedOrders.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No orders in this category</h3>
            <p className="text-gray-500">New orders will appear here automatically</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {sortedOrders.map((order) => {
              const config = statusConfig[order.status];
              const OrderTypeIcon = orderTypeIcons[order.orderType];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className={cn("border-2 transition-all hover:shadow-xl bg-gray-800", config.bg)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("font-mono text-xs", priorityConfig[order.priority].color)}>
                              {priorityConfig[order.priority].label}
                            </Badge>
                            <Badge variant="outline" className="text-xs gap-1">
                              <OrderTypeIcon className="h-3 w-3" />
                              {order.orderType.replace("_", " ")}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <StatusIcon className={cn("h-5 w-5", config.color)} />
                            {order.id}
                          </CardTitle>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <Timer className="h-3 w-3" />
                            {getWaitTime(order.createdAt)}
                          </div>
                          <Badge className={cn("text-xs", config.bg, config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{order.customerName}</span>
                        {order.tableNumber && (
                          <>
                            <Separator orientation="vertical" className="h-4 bg-gray-700" />
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>Table {order.tableNumber}</span>
                          </>
                        )}
                      </div>

                      <Separator className="bg-gray-700" />

                      {/* Items */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {order.items.map((orderItem, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-2 p-2 bg-gray-700/50 rounded"
                          >
                            <div className="flex-1">
                              <span className="font-semibold text-emerald">{orderItem.quantity}×</span>{" "}
                              <span className="text-sm">{orderItem.item.name}</span>
                            </div>
                            <CheckCircle
                              className={cn(
                                "h-4 w-4 shrink-0",
                                orderItem.status === "ready" ? "text-green-500" : "text-gray-600"
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                          <p className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Special Instructions:
                          </p>
                          <p className="text-xs text-yellow-300">{order.specialInstructions}</p>
                        </div>
                      )}

                      <Separator className="bg-gray-700" />

                      {/* Total */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Total</span>
                        <span className="text-lg font-bold text-emerald">{formatCurrency(order.total)}</span>
                      </div>

                      {/* Action Button */}
                      {('next' in config) && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, config.next!)}
                          className="w-full bg-emerald hover:bg-emerald-dark gap-2 h-11"
                        >
                          {config.nextLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
