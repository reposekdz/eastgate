"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { formatWithCurrency } from "@/lib/currencies";
import { useCurrency } from "@/components/shared/CurrencySelector";
import {
  Clock,
  ChefHat,
  CheckCircle,
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  UtensilsCrossed,
  Store,
  Home,
  Search,
  Calendar,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string;
  roomNumber?: string;
  deliveryAddress?: string;
  items: Array<{
    item: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "completed";
  createdAt: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    description: "Waiting for confirmation",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    description: "Order confirmed",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparing",
    description: "Kitchen is preparing your order",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    icon: ChefHat,
  },
  ready: {
    label: "Ready",
    description: "Your order is ready",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    icon: Package,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    description: "On the way to you",
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    description: "Successfully delivered",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  completed: {
    label: "Completed",
    description: "Order completed",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle,
  },
};

const orderTypeIcons = {
  dine_in: UtensilsCrossed,
  takeaway: Store,
  delivery: Truck,
};

export default function OrderTrackingPage() {
  const { currency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

  useEffect(() => {
    // Load orders from localStorage
    const savedOrders = localStorage.getItem("eastgate-food-orders");
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders);
      // Simulate status progression for demo purposes
      const updatedOrders = parsedOrders.map((order: Order) => {
        const minutesAgo = (Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60;
        let newStatus = order.status;
        
        if (minutesAgo > 30) {
          newStatus = order.orderType === "delivery" ? "delivered" : "completed";
        } else if (minutesAgo > 20) {
          newStatus = order.orderType === "delivery" ? "out_for_delivery" : "ready";
        } else if (minutesAgo > 10) {
          newStatus = "preparing";
        } else if (minutesAgo > 2) {
          newStatus = "confirmed";
        }
        
        return { ...order, status: newStatus };
      });
      setOrders(updatedOrders);
    }
  }, []);

  const filteredOrders = orders.filter((order) => {
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (
        !order.id.toLowerCase().includes(query) &&
        !order.customerName.toLowerCase().includes(query) &&
        !order.customerPhone.includes(query)
      ) {
        return false;
      }
    }

    // Filter by status
    if (filter === "active") {
      return !["delivered", "completed"].includes(order.status);
    } else if (filter === "completed") {
      return ["delivered", "completed"].includes(order.status);
    }

    return true;
  });

  const activeOrders = orders.filter((o) => !["delivered", "completed"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "completed"].includes(o.status));

  const getOrderProgress = (status: Order["status"]) => {
    const statuses: Order["status"][] = 
      status === "out_for_delivery" || status === "delivered"
        ? ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"]
        : ["pending", "confirmed", "preparing", "ready", "completed"];
    const currentIndex = statuses.indexOf(status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  const getEstimatedTime = (order: Order) => {
    const minutesAgo = (Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60;
    const totalTime = order.orderType === "delivery" ? 60 : 30;
    const remaining = Math.max(0, Math.ceil(totalTime - minutesAgo));
    
    if (["delivered", "completed"].includes(order.status)) {
      return "Completed";
    }
    
    return remaining > 0 ? `${remaining} min` : "Soon";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-pearl/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-charcoal via-surface-dark to-charcoal border-b border-gold/20 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/order-food" className="flex items-center gap-3">
              <Image
                src="/eastgatelogo.png"
                alt="EastGate Hotel"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </Link>
            
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Link href="/order-food">
                <Home className="h-4 w-4 mr-2" />
                Back to Menu
              </Link>
            </Button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
              Track Your <span className="text-gold">Orders</span>
            </h1>
            <p className="text-white/70">Monitor your food orders in real-time</p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 -mt-16 relative z-10">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-charcoal mb-1">{activeOrders.length}</p>
              <p className="text-sm text-text-muted-custom">Active Orders</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-charcoal mb-1">{completedOrders.length}</p>
              <p className="text-sm text-text-muted-custom">Completed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-gold-100 mx-auto mb-3 flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-gold" />
              </div>
              <p className="text-3xl font-bold text-charcoal mb-1">{orders.length}</p>
              <p className="text-sm text-text-muted-custom">Total Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search by order ID, name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className={cn(filter === "all" && "bg-emerald hover:bg-emerald-dark")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "active" ? "default" : "outline"}
                  onClick={() => setFilter("active")}
                  className={cn(filter === "active" && "bg-emerald hover:bg-emerald-dark")}
                >
                  Active
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  onClick={() => setFilter("completed")}
                  className={cn(filter === "completed" && "bg-emerald hover:bg-emerald-dark")}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-text-muted-custom opacity-20" />
              <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">
                No orders found
              </h3>
              <p className="text-text-muted-custom mb-6">
                {searchQuery ? "Try a different search term" : "Start ordering to track your meals"}
              </p>
              <Button asChild className="bg-emerald hover:bg-emerald-dark">
                <Link href="/order-food">Browse Menu</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon;
                const OrderTypeIcon = orderTypeIcons[order.orderType];
                const progress = getOrderProgress(order.status);

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className={cn("border-2 transition-all hover:shadow-lg", statusConfig[order.status].bg)}>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left: Order Info */}
                          <div className="lg:col-span-2 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between flex-wrap gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="font-mono text-sm">{order.id}</Badge>
                                  <Badge variant="outline" className="gap-1">
                                    <OrderTypeIcon className="h-3 w-3" />
                                    {order.orderType.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-text-muted-custom">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {order.customerName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {order.customerPhone}
                                  </span>
                                  {order.tableNumber && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      Table {order.tableNumber}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-heading font-bold text-emerald">
                                  {formatWithCurrency(order.total, currency.code)}
                                </div>
                                <div className="text-xs text-text-muted-custom">
                                  {new Date(order.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {/* Items */}
                            <div>
                              <p className="text-sm font-semibold mb-2">Items:</p>
                              <div className="space-y-1">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>
                                      <span className="font-semibold">{item.quantity}×</span> {item.item.name}
                                    </span>
                                    <span className="text-text-muted-custom">
                                      {formatWithCurrency(item.item.price * item.quantity, currency.code)}
                                    </span>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <p className="text-xs text-text-muted-custom">
                                    +{order.items.length - 3} more items
                                  </p>
                                )}
                              </div>
                            </div>

                            {order.deliveryAddress && (
                              <div className="bg-white/50 rounded-lg p-3 text-sm">
                                <p className="font-semibold mb-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  Delivery Address:
                                </p>
                                <p className="text-text-muted-custom">{order.deliveryAddress}</p>
                              </div>
                            )}
                          </div>

                          {/* Right: Status */}
                          <div className="flex flex-col">
                            <div className={cn("rounded-lg p-4 border-2 flex-1", statusConfig[order.status].bg)}>
                              <div className="flex items-center gap-2 mb-3">
                                <StatusIcon className={cn("h-6 w-6", statusConfig[order.status].color)} />
                                <div>
                                  <p className={cn("font-semibold", statusConfig[order.status].color)}>
                                    {statusConfig[order.status].label}
                                  </p>
                                  <p className="text-xs text-text-muted-custom">
                                    {statusConfig[order.status].description}
                                  </p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-emerald"
                                  />
                                </div>
                              </div>

                              {/* ETA */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-muted-custom">Estimated Time:</span>
                                <Badge className="bg-white/80 text-charcoal border">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {getEstimatedTime(order)}
                                </Badge>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 space-y-2">
                              <Button variant="outline" className="w-full" size="sm">
                                View Details
                              </Button>
                              {!["delivered", "completed"].includes(order.status) && (
                                <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" size="sm">
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/order-food">
              <Home className="h-4 w-4" />
              Back to Menu
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
