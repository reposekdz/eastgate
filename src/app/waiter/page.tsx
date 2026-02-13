"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { restaurantOrders, menuItems } from "@/lib/mock-data";
import { formatCurrency, formatTime, getOrderStatusLabel } from "@/lib/format";
import {
  UtensilsCrossed,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

export default function WaiterDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const activeOrders = restaurantOrders.filter((o) => o.status !== "served");
  
  const filteredOrders = activeOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.guestName && o.guestName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.tableNumber.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    toast.success(`Order ${orderId} updated to ${newStatus}`);
  };

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const cartTotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find((m) => m.id === itemId);
    return sum + (item?.price || 0) * qty;
  }, 0);

  const handlePlaceOrder = () => {
    if (Object.keys(cart).length === 0) {
      toast.error("Cart is empty");
      return;
    }
    toast.success("Order placed successfully!");
    setCart({});
  };

  return (
    <div className="min-h-screen bg-pearl/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-md text-charcoal">Restaurant Service</h1>
            <p className="body-sm text-text-muted-custom mt-1">
              Manage orders and view menu
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-emerald hover:bg-emerald-dark text-white relative">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  New Order
                  {Object.keys(cart).length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-gold">
                      {Object.keys(cart).length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="food" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="food">Main Course</TabsTrigger>
                    <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                    <TabsTrigger value="drinks">Beverages</TabsTrigger>
                    <TabsTrigger value="desserts">Desserts</TabsTrigger>
                  </TabsList>

                  {["Main Course", "Breakfast", "Beverages", "Desserts"].map((category, idx) => (
                    <TabsContent key={idx} value={category.toLowerCase().replace(" ", "")} className="space-y-3">
                      {menuItems
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:border-emerald/50 transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold text-charcoal">{item.name}</h4>
                              <p className="text-sm text-text-muted-custom">{item.description}</p>
                              <p className="font-bold text-emerald mt-1">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {cart[item.id] ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">
                                    {cart[item.id]}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item.id)}
                                    className="h-8 w-8 p-0 bg-emerald hover:bg-emerald-dark"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item.id)}
                                  className="bg-emerald hover:bg-emerald-dark"
                                >
                                  <Plus className="mr-1 h-4 w-4" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
                </Tabs>

                {Object.keys(cart).length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-heading text-lg font-semibold">Total:</span>
                      <span className="font-heading text-2xl font-bold text-emerald">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                    <Button
                      onClick={handlePlaceOrder}
                      className="w-full bg-emerald hover:bg-emerald-dark text-white"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Place Order
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted-custom">Pending</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {restaurantOrders.filter((o) => o.status === "pending").length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted-custom">Preparing</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {restaurantOrders.filter((o) => o.status === "preparing").length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted-custom">Ready</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {restaurantOrders.filter((o) => o.status === "ready").length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted-custom">Total Orders</p>
                  <p className="text-2xl font-bold text-charcoal mt-1">
                    {restaurantOrders.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Orders</CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
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
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Table {order.tableNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.guestName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatTime(new Date(order.createdAt).toTimeString().slice(0, 5))}
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
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
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
                        No active orders
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
