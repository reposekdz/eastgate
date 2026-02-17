"use client";

export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import { ChefHat, ClipboardList, Clock, Flame } from "lucide-react";
import Link from "next/link";

function formatOrderTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function KitchenPrepPage() {
  const { user } = useAuthStore();
  const { getOrders } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "kitchen_staff";
  const orders = getOrders(branchId, userRole);
  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Prep Board</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Active orders for preparation · {user?.branchName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeOrders.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-text-muted-custom">
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No orders on the prep board.</p>
              <Link href="/kitchen/orders"><span className="text-emerald font-medium hover:underline">Go to Order Queue</span></Link>
            </CardContent>
          </Card>
        ) : (
          activeOrders.map((order) => (
            <Card key={order.id} className={order.status === "pending" ? "border-orange-300" : "border-blue-200"}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono">{order.id}</CardTitle>
                  <Badge variant={order.status === "pending" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted-custom">
                  T{order.tableNumber} · {order.guestName || "Guest"} · {formatOrderTime(order.createdAt)}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{item.name} ×{item.quantity}</span>
                      <span className="text-text-muted-custom">{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-semibold text-charcoal mt-2 pt-2 border-t">{formatCurrency(order.total)}</p>
                <Link href="/kitchen/orders" className="inline-block mt-2">
                  <span className="text-sm text-orange-600 font-medium hover:underline">Update status in Queue →</span>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
