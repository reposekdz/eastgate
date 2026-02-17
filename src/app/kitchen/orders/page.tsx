"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, getOrderStatusLabel } from "@/lib/format";
import {
  ChefHat,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatOrderTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function KitchenOrdersPage() {
  const { user } = useAuthStore();
  const { getOrders, updateOrderStatus } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "kitchen_staff";
  const orders = getOrders(branchId, userRole);

  const [activeTab, setActiveTab] = useState("pending");

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  const handleStatusChange = (orderId: string, newStatus: "preparing" | "ready") => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} → ${newStatus}`);
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
    preparing: { label: "Preparing", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ChefHat },
    ready: { label: "Ready", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  };

  const renderOrderCard = (order: (typeof orders)[0], showActions: boolean) => (
    <Card key={order.id} className={cn("overflow-hidden", order.status === "pending" && "border-orange-300")}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-charcoal">{order.id}</span>
              <Badge className={cn("border", statusConfig[order.status as keyof typeof statusConfig]?.color || "bg-gray-100")}>
                {getOrderStatusLabel(order.status)}
              </Badge>
              <span className="text-sm text-text-muted-custom">{formatOrderTime(order.createdAt)}</span>
            </div>
            <p className="text-sm font-medium text-charcoal">
              Table {order.tableNumber} · {order.guestName || "Guest"}
              {order.roomCharge && " · Room charge"}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {order.items.map((item, i) => (
                <span key={i} className="text-xs bg-pearl px-2 py-0.5 rounded">
                  {item.name} ×{item.quantity}
                </span>
              ))}
            </div>
            <p className="text-sm font-semibold text-charcoal mt-2">{formatCurrency(order.total)}</p>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2 shrink-0">
              {order.status === "pending" && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 gap-1"
                  onClick={() => handleStatusChange(order.id, "preparing")}
                >
                  <ChefHat className="h-3 w-3" />
                  Start preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button
                  size="sm"
                  className="bg-emerald hover:bg-emerald-dark gap-1"
                  onClick={() => handleStatusChange(order.id, "ready")}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark ready
                </Button>
              )}
              {order.status === "ready" && (
                <Badge className="bg-emerald-100 text-emerald-700 w-fit">Ready for pickup</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Order Queue</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          View and update order status · {user?.branchName}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending" className="gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="gap-1.5">
            <ChefHat className="h-4 w-4" />
            Preparing ({preparing.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Ready ({ready.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6 space-y-4">
          {pending.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-text-muted-custom">No pending orders</CardContent></Card>
          ) : (
            pending.map((o) => renderOrderCard(o, true))
          )}
        </TabsContent>
        <TabsContent value="preparing" className="mt-6 space-y-4">
          {preparing.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-text-muted-custom">No orders in preparation</CardContent></Card>
          ) : (
            preparing.map((o) => renderOrderCard(o, true))
          )}
        </TabsContent>
        <TabsContent value="ready" className="mt-6 space-y-4">
          {ready.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-text-muted-custom">No orders ready for pickup</CardContent></Card>
          ) : (
            ready.map((o) => renderOrderCard(o, false))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
