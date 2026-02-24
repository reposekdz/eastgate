"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import type { OrderStatus } from "@/lib/types/enums";
import {
  UtensilsCrossed,
  Clock,
  ChefHat,
  CheckCircle,
  DollarSign,
  Plus,
  User,
  BedDouble,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

const orderStatusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-order-pending", bg: "bg-order-pending/10 border-order-pending/20", icon: Clock },
  preparing: { label: "Preparing", color: "text-order-preparing", bg: "bg-order-preparing/10 border-order-preparing/20", icon: ChefHat },
  ready: { label: "Ready", color: "text-order-ready", bg: "bg-order-ready/10 border-order-ready/20", icon: CheckCircle },
  served: { label: "Served", color: "text-order-served", bg: "bg-order-served/10 border-order-served/20", icon: UtensilsCrossed },
  cancelled: { label: "Cancelled", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: Clock },
};

export default function RestaurantPage() {
  const { user } = useAuthStore();
  const getOrders = useBranchStore((s) => s.getOrders);
  const getMenuItems = useBranchStore((s) => s.getMenuItems);
  const [activeTab, setActiveTab] = useState("orders");

  // Menu item management
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    name: "",
    category: "main",
    price: "",
    description: "",
    available: true,
  });
  const [savingMenu, setSavingMenu] = useState(false);

  // Check if user can manage menu (manager or super admin)
  const canManageMenu = user?.role === "super_admin" || 
                        user?.role === "super_manager" ||
                        user?.role === "branch_manager" ||
                        user?.role === "branch_admin";

  const branchId = user?.role === "super_admin" || user?.role === "super_manager" ? "all" : (user?.branchId ?? "br-001");
  const role = user?.role ?? "guest";
  const restaurantOrders = getOrders(branchId, role);
  const menuItems = getMenuItems();
  const menuCategories = [...new Set(menuItems.map((item) => item.category))];
  const activeOrders = restaurantOrders.filter((o) => o.status !== "served" && o.status !== "cancelled");
  const todayRevenue = restaurantOrders.reduce((sum, o) => sum + o.total, 0);

  // Handler for creating menu item
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMenu(true);

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menuFormData.name,
          category: menuFormData.category,
          price: parseFloat(menuFormData.price),
          description: menuFormData.description,
          available: menuFormData.available,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowMenuDialog(false);
        setMenuFormData({ name: "", category: "main", price: "", description: "", available: true });
        // Refresh menu items
        window.location.reload();
      } else {
        alert(data.error || "Failed to create menu item");
      }
    } catch (error) {
      console.error("Failed to create menu item:", error);
    } finally {
      setSavingMenu(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Restaurant & POS</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Manage orders, menu, and kitchen operations
          </p>
        </div>
        <Button className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-order-pending/10 shrink-0">
              <Clock className="h-4 w-4 text-order-pending" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{activeOrders.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Active Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald/10 shrink-0">
              <DollarSign className="h-4 w-4 text-emerald" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{formatCurrency(todayRevenue)}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Today&apos;s Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-status-occupied/10 shrink-0">
              <UtensilsCrossed className="h-4 w-4 text-status-occupied" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{restaurantOrders.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3 shadow-xs border-transparent">
          <CardContent className="px-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-gold/10 shrink-0">
              <ChefHat className="h-4 w-4 text-gold-dark" />
            </div>
            <div>
              <p className="text-lg font-bold text-charcoal">{menuItems.length}</p>
              <p className="text-[10px] text-text-muted-custom uppercase tracking-wider">Menu Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-pearl/50">
          <TabsTrigger value="orders" className="text-sm data-[state=active]:bg-white">Active Orders</TabsTrigger>
          <TabsTrigger value="menu" className="text-sm data-[state=active]:bg-white">Menu</TabsTrigger>
          <TabsTrigger value="kitchen" className="text-sm data-[state=active]:bg-white">Kitchen Board</TabsTrigger>
        </TabsList>

        {/* Active Orders */}
        <TabsContent value="orders" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurantOrders.filter((o) => o.status !== "served").map((order) => {
              const config = orderStatusConfig[order.status];
              return (
                <Card key={order.id} className={`py-0 shadow-xs border ${config.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-charcoal">{order.id}</span>
                        <Badge variant="outline" className={`text-[10px] rounded-[4px] ${config.bg} ${config.color} font-semibold`}>
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-text-muted-custom">Table {order.tableNumber}</span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-custom">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-charcoal font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dashed">
                      <div className="flex items-center gap-2">
                        {order.guestName && (
                          <div className="flex items-center gap-1 text-xs text-text-muted-custom">
                            <User className="h-3 w-3" /> {order.guestName}
                          </div>
                        )}
                        {order.roomCharge && (
                          <Badge variant="outline" className="text-[9px] rounded-[3px] bg-status-occupied/5 text-status-occupied border-status-occupied/20">
                            <BedDouble className="h-2.5 w-2.5 mr-0.5" /> Room
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-bold text-charcoal">{formatCurrency(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Menu */}
        <TabsContent value="menu" className="mt-4">
          {/* Add Menu Item Button */}
          {canManageMenu && (
            <div className="mb-4">
              <Button 
                className="bg-emerald hover:bg-emerald-dark text-white rounded-[6px] gap-2 text-sm"
                onClick={() => setShowMenuDialog(true)}
              >
                <Plus className="h-4 w-4" /> Add Menu Item
              </Button>
            </div>
          )}
          <div className="space-y-6">
            {menuCategories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-3">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <Card key={item.id} className="py-0 shadow-xs border-transparent hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-charcoal">{item.name}</p>
                              <p className="text-xs text-text-muted-custom mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald ml-3">{formatCurrency(item.price)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge
                              variant="outline"
                              className={`text-[9px] rounded-[3px] ${
                                item.available
                                  ? "bg-status-available/10 text-status-available border-status-available/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}
                            >
                              {item.available ? "Available" : "Unavailable"}
                            </Badge>
                            <Button variant="ghost" size="xs" className="text-xs text-emerald">Edit</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Kitchen Board */}
        <TabsContent value="kitchen" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["pending", "preparing", "ready"] as OrderStatus[]).map((status) => {
              const config = orderStatusConfig[status];
              const orders = restaurantOrders.filter((o) => o.status === status);
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <config.icon className={`h-4 w-4 ${config.color}`} />
                    <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">{config.label}</h3>
                    <Badge variant="outline" className="text-[10px] rounded-full h-5 w-5 p-0 flex items-center justify-center">
                      {orders.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <Card key={order.id} className="py-0 shadow-xs border-transparent">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-charcoal">{order.id}</span>
                            <span className="text-[10px] text-text-muted-custom">T{order.tableNumber}</span>
                          </div>
                          {order.items.map((item, i) => (
                            <p key={i} className="text-xs text-slate-custom">{item.quantity}x {item.name}</p>
                          ))}
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              size="sm"
                              className={`w-full text-xs h-7 rounded-[4px] ${
                                status === "pending" ? "bg-order-preparing text-white hover:bg-order-preparing/90" :
                                status === "preparing" ? "bg-order-ready text-white hover:bg-order-ready/90" :
                                "bg-order-served text-white hover:bg-order-served/90"
                              }`}
                            >
                              {status === "pending" ? "Start Preparing" : status === "preparing" ? "Mark Ready" : "Mark Served"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-xs text-text-muted-custom text-center py-6">No orders</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Menu Item Dialog */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMenuItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={menuFormData.name}
                  onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                  placeholder="e.g., Grilled Salmon"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={menuFormData.category}
                  onValueChange={(value) => setMenuFormData({ ...menuFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appetizer">Appetizer</SelectItem>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (RWF)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={menuFormData.price}
                  onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
                  placeholder="e.g., 15000"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={menuFormData.description}
                  onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                  placeholder="Describe the dish..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMenuDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald hover:bg-emerald-dark" disabled={savingMenu}>
                {savingMenu ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
