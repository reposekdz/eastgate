"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency, formatTime, getOrderStatusLabel } from "@/lib/format";
import {
  UtensilsCrossed, Search, Clock, ChefHat, AlertCircle, CheckCircle2, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function ManagerOrdersPage() {
  const { user } = useAuthStore();
  const { getOrders, updateOrderStatus } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "branch_manager";
  const orders = getOrders(branchId, userRole);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.guestName && o.guestName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} updated to ${newStatus}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700";
      case "preparing": return "bg-blue-100 text-blue-700";
      case "ready": return "bg-emerald-100 text-emerald-700";
      case "served": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Orders Management</h1>
        <p className="body-sm text-text-muted-custom mt-1">Monitor and manage all restaurant orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-900">Pending</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">{pendingCount}</p>
              </div>
              <div className="h-11 w-11 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Preparing</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{preparingCount}</p>
              </div>
              <div className="h-11 w-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900">Ready</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{readyCount}</p>
              </div>
              <div className="h-11 w-11 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">Total Orders</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{orders.length}</p>
              </div>
              <div className="h-11 w-11 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal">Revenue</p>
                <p className="text-xl font-bold text-gold-dark mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="h-11 w-11 bg-gold rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-charcoal" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">All Orders</CardTitle>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-60 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-medium">{order.id}</TableCell>
                    <TableCell><Badge variant="outline">Table {order.tableNumber}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm max-w-48">
                        {order.items.map((item, idx) => (
                          <span key={idx}>{item.quantity}x {item.name}{idx < order.items.length - 1 ? ", " : ""}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.guestName || "Walk-in"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-text-muted-custom">
                        <Clock className="h-3 w-3" />
                        {formatTime(new Date(order.createdAt).toTimeString().slice(0, 5))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="served">Served</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-text-muted-custom">
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
