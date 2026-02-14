"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useOrderStore,
  type OrderStatusType,
  type PlacedOrder,
} from "@/stores/order-store";
import { formatCurrency } from "@/lib/format";
import {
  Clock,
  ChefHat,
  CheckCircle,
  UtensilsCrossed,
  XCircle,
  BedDouble,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Timer,
  Smartphone,
  Landmark,
  Globe,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<
  OrderStatusType,
  { label: string; color: string; bg: string; icon: typeof Clock; next?: OrderStatusType; nextLabel?: string }
> = {
  pending: {
    label: "Pending",
    color: "text-order-pending",
    bg: "bg-order-pending/10 border-order-pending/30",
    icon: Clock,
    next: "preparing",
    nextLabel: "Start Preparing",
  },
  preparing: {
    label: "Preparing",
    color: "text-order-preparing",
    bg: "bg-order-preparing/10 border-order-preparing/30",
    icon: ChefHat,
    next: "ready",
    nextLabel: "Mark Ready",
  },
  ready: {
    label: "Ready",
    color: "text-order-ready",
    bg: "bg-order-ready/10 border-order-ready/30",
    icon: CheckCircle,
    next: "served",
    nextLabel: "Mark Served",
  },
  served: {
    label: "Served",
    color: "text-order-served",
    bg: "bg-order-served/10 border-order-served/30",
    icon: UtensilsCrossed,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    icon: XCircle,
  },
};

const orderTypeIcons = {
  dine_in: UtensilsCrossed,
  room_service: BedDouble,
  takeaway: ShoppingBag,
};

const orderTypeLabels = {
  dine_in: "Dine-In",
  room_service: "Room Service",
  takeaway: "Takeaway",
};

const paymentIcons: Record<string, typeof CreditCard> = {
  mtn_mobile: Smartphone,
  airtel_money: Phone,
  bank_transfer: Landmark,
  paypal: Globe,
  cash: CreditCard,
};

const paymentLabels: Record<string, string> = {
  mtn_mobile: "MTN MoMo",
  airtel_money: "Airtel Money",
  bank_transfer: "Bank Transfer",
  paypal: "PayPal",
  cash: "Cash",
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function OrderCard({ order }: { order: PlacedOrder }) {
  const { updateOrderStatus } = useOrderStore();
  const config = statusConfig[order.status];
  const OrderTypeIcon = orderTypeIcons[order.orderType];
  const PaymentIcon = paymentIcons[order.paymentMethod] || CreditCard;

  const handleAdvanceStatus = () => {
    if (config.next) {
      updateOrderStatus(order.id, config.next);
      toast.success(`Order ${order.id} marked as ${statusConfig[config.next].label}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={cn("border-2 transition-all hover:shadow-md", config.bg)}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={cn("font-mono text-xs", config.color, "bg-transparent border")}>
                {order.id}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1">
                <OrderTypeIcon className="h-3 w-3" />
                {orderTypeLabels[order.orderType]}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted-custom">
              <Timer className="h-3 w-3" />
              {getTimeAgo(order.createdAt)}
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-charcoal">
              <User className="h-3.5 w-3.5 text-text-muted-custom" />
              <span className="font-medium">{order.customerName}</span>
            </div>
            {order.tableNumber && (
              <div className="flex items-center gap-1 text-text-muted-custom">
                <MapPin className="h-3 w-3" />
                {order.tableNumber}
              </div>
            )}
            {order.roomNumber && (
              <div className="flex items-center gap-1 text-text-muted-custom">
                <BedDouble className="h-3 w-3" />
                Room {order.roomNumber}
              </div>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-charcoal">
                  <span className="font-medium">{item.quantity}×</span> {item.name}
                </span>
                <span className="text-text-muted-custom font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-text-muted-custom">
                <PaymentIcon className="h-3 w-3" />
                {paymentLabels[order.paymentMethod]}
              </div>
              <span className="font-heading font-bold text-emerald">
                {formatCurrency(order.grandTotal)}
              </span>
            </div>
            {config.next && (
              <Button
                size="sm"
                onClick={handleAdvanceStatus}
                className="bg-emerald hover:bg-emerald-dark text-white text-xs h-8 gap-1"
              >
                {config.nextLabel}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function WaiterDashboard() {
  const { orders, getActiveOrders, getTodayRevenue } = useOrderStore();
  const [activeTab, setActiveTab] = useState("active");

  const activeOrders = getActiveOrders();
  const todayRevenue = getTodayRevenue();

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const servedOrders = orders.filter((o) => o.status === "served");

  return (
    <>
      {/* Hero */}
      <section className="relative h-[25vh] sm:h-[30vh] overflow-hidden bg-gradient-to-br from-charcoal to-surface-dark">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,rgba(200,169,81,0.3),transparent_50%)]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl text-white font-heading font-bold mb-2"
          >
            Waiter <span className="text-gold">Dashboard</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-white/60"
          >
            Manage kitchen orders and serve guests
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-order-pending/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-order-pending" />
              </div>
              <div>
                <p className="text-xl font-bold text-charcoal">{pendingOrders.length}</p>
                <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">
                  Pending
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-order-preparing/10 flex items-center justify-center shrink-0">
                <ChefHat className="h-5 w-5 text-order-preparing" />
              </div>
              <div>
                <p className="text-xl font-bold text-charcoal">{preparingOrders.length}</p>
                <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">
                  Preparing
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-order-ready/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-order-ready" />
              </div>
              <div>
                <p className="text-xl font-bold text-charcoal">{readyOrders.length}</p>
                <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">
                  Ready
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-emerald" />
              </div>
              <div>
                <p className="text-xl font-bold text-charcoal">
                  {formatCurrency(todayRevenue)}
                </p>
                <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">
                  Today&apos;s Revenue
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Orders */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-28">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="active" className="flex-1 sm:flex-initial">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 sm:flex-initial">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="preparing" className="flex-1 sm:flex-initial">
              Preparing ({preparingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex-1 sm:flex-initial">
              Ready ({readyOrders.length})
            </TabsTrigger>
            <TabsTrigger value="served" className="flex-1 sm:flex-initial">
              Served ({servedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {activeOrders.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald/30" />
                    <p className="font-heading text-lg text-charcoal">All caught up!</p>
                    <p className="text-sm text-text-muted-custom">No active orders right now</p>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
              {pendingOrders.length === 0 && (
                <div className="col-span-full text-center py-16 text-text-muted-custom">
                  <p>No pending orders</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preparing">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {preparingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
              {preparingOrders.length === 0 && (
                <div className="col-span-full text-center py-16 text-text-muted-custom">
                  <p>No orders being prepared</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ready">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {readyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
              {readyOrders.length === 0 && (
                <div className="col-span-full text-center py-16 text-text-muted-custom">
                  <p>No orders ready for serving</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="served">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {servedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </AnimatePresence>
              {servedOrders.length === 0 && (
                <div className="col-span-full text-center py-16 text-text-muted-custom">
                  <p>No served orders today</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
