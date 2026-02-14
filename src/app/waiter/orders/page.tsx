"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatTime, getOrderStatusLabel } from "@/lib/format";
import {
  UtensilsCrossed,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function WaiterOrdersPage() {
  const { user } = useAuthStore();
  const { getOrders, updateOrderStatus } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "waiter";
  const orders = getOrders(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const activeOrders = orders.filter((o) => o.status !== "served");
  const servedOrders = orders.filter((o) => o.status === "served");

  const displayedOrders =
    activeTab === "active" ? activeOrders : servedOrders;

  const filteredOrders = displayedOrders.filter((o) => {
    return (
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.guestName &&
        o.guestName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.tableNumber.toString().includes(searchTerm)
    );
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} → ${newStatus}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "preparing":
        return "bg-blue-100 text-blue-700";
      case "ready":
        return "bg-emerald-100 text-emerald-700";
      case "served":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Orders</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            All branch orders &bull; Shared view for all waiters
          </p>
        </div>
        <Link href="/waiter/new-order">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" size="sm">
            <Zap className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>
      </div>

      {/* Priority Alerts */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className={`border-2 ${
            pendingCount > 0
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center shadow">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">
                {pendingCount}
              </p>
              <p className="text-xs text-orange-900 font-medium">
                Pending Orders
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-2 ${
            preparingCount > 0
              ? "border-blue-300 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {preparingCount}
              </p>
              <p className="text-xs text-blue-900 font-medium">In Kitchen</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-2 ${
            readyCount > 0
              ? "border-emerald-300 bg-emerald-50"
              : "border-gray-200"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {readyCount}
              </p>
              <p className="text-xs text-emerald-900 font-medium">
                Ready to Serve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">
                  Active ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="served">
                  Served ({servedOrders.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                placeholder="Search by order, table, or guest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-72 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={
                      order.status === "ready"
                        ? "bg-emerald-50/50"
                        : order.status === "pending"
                        ? "bg-orange-50/30"
                        : ""
                    }
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Table {order.tableNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-48">
                        {order.items.map((item, idx) => (
                          <span key={idx}>
                            {item.quantity}x {item.name}
                            {idx < order.items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.guestName || "Walk-in"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-text-muted-custom">
                        <Clock className="h-3 w-3" />
                        {formatTime(
                          new Date(order.createdAt)
                            .toTimeString()
                            .slice(0, 5)
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status !== "served" ? (
                        <Select
                          value={order.status}
                          onValueChange={(v) =>
                            handleStatusChange(order.id, v)
                          }
                        >
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">
                              Preparing
                            </SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="served">Served</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-text-muted-custom">
                          Completed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-text-muted-custom"
                    >
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
