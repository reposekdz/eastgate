"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  TrendingUp,
  ClipboardList,
  Bell,
  Timer,
  ArrowRight,
  Zap,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

function formatOrderTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function KitchenDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "kitchen_staff";

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/kitchen/dashboard?branchId=${branchId}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Failed to load kitchen dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    if (branchId) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [branchId]);

  const orders = data?.orders || [];
  const metrics = data?.metrics || {};
  const notifications: any[] = [];

  const pendingOrders = orders.filter((o: any) => o.status === "PENDING");
  const preparingOrders = orders.filter((o: any) => o.status === "PREPARING");
  const readyOrders = orders.filter((o: any) => o.status === "READY");
  const unreadNotifs = notifications.filter((n: any) => !n.read);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="heading-md text-charcoal">Kitchen Dashboard</h1>
              <p className="body-sm text-text-muted-custom">
                Shared kitchen dashboard · {user?.branchName} · Managed by branch manager
              </p>
            </div>
          </div>
        </div>
        <Link href="/kitchen/orders">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <ClipboardList className="h-4 w-4" />
            View Order Queue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center shadow">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{pendingOrders.length}</p>
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center shadow">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{preparingOrders.length}</p>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Preparing</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald flex items-center justify-center shadow">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{readyOrders.length}</p>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Ready</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-charcoal/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-charcoal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{unreadNotifs.length}</p>
              <p className="text-xs font-medium text-text-muted-custom uppercase tracking-wider">Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live queue preview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Live queue
            </CardTitle>
            <Link href="/kitchen/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                See all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {orders.filter((o: any) => o.status !== "served").length === 0 ? (
            <div className="py-8 text-center text-text-muted-custom">
              <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No active orders</p>
              <p className="text-sm">New orders will appear here and in Order Queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders
                .filter((o: any) => o.status !== "SERVED" && o.status !== "COMPLETED")
                .slice(0, 5)
                .map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-pearl/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-semibold text-charcoal">{order.orderNumber}</div>
                      <Badge
                        variant="secondary"
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
                      <span className="text-sm text-text-muted-custom">
                        T{order.tableNumber} · {order.guestName || "Guest"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted-custom">{formatOrderTime(order.createdAt)}</span>
                      <span className="font-semibold text-charcoal">{formatCurrency(order.total)}</span>
                      <Link href="/kitchen/orders">
                        <Button size="sm" variant="outline" className="h-8">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications preview */}
      {unreadNotifs.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              Recent alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {unreadNotifs.slice(0, 3).map((n) => (
                <li key={n.id} className="text-sm flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span><strong>{n.title}</strong> — {n.message}</span>
                </li>
              ))}
            </ul>
            <Link href="/kitchen/notifications" className="inline-block mt-2">
              <Button variant="ghost" size="sm">View all notifications</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
