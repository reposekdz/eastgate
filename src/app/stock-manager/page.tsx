"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface DashboardData {
  stockItems: any[];
  suppliers: any[];
  purchaseOrders: any[];
  lowStockItems: any[];
  inventory: any[];
  expenses: any[];
  stats: {
    totalStockItems: number;
    lowStockCount: number;
    totalSuppliers: number;
    pendingOrders: number;
    totalStockValue: number;
    monthlyExpenses: number;
  };
}

export default function StockManagerDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("eastgate-token") || "" : "";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    unit: "pieces",
    unitPrice: 0,
    reorderLevel: 10,
    supplierId: "",
  });
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    category: "food",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/stock-manager/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/stock-manager/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "stock_item", data: formData }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Stock item added successfully");
        setDialogOpen(false);
        setFormData({ name: "", sku: "", category: "", quantity: 0, unit: "pieces", unitPrice: 0, reorderLevel: 10, supplierId: "" });
        fetchDashboardData();
      } else {
        toast.error(result.error || "Failed to add stock item");
      }
    } catch (error) {
      toast.error("Failed to add stock item");
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/stock-manager/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "supplier", data: supplierForm }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Supplier added successfully");
        setSupplierDialogOpen(false);
        setSupplierForm({ name: "", contactPerson: "", email: "", phone: "", category: "food" });
        fetchDashboardData();
      } else {
        toast.error(result.error || "Failed to add supplier");
      }
    } catch (error) {
      toast.error("Failed to add supplier");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Stock Items",
      value: data.stats.totalStockItems,
      icon: Package,
      color: "bg-blue-500",
      change: "+12%",
      trend: "up",
    },
    {
      name: "Low Stock Alerts",
      value: data.stats.lowStockCount,
      icon: AlertTriangle,
      color: "bg-red-500",
      change: "-5%",
      trend: "down",
    },
    {
      name: "Total Suppliers",
      value: data.stats.totalSuppliers,
      icon: Users,
      color: "bg-green-500",
      change: "+3",
      trend: "up",
    },
    {
      name: "Pending Orders",
      value: data.stats.pendingOrders,
      icon: ShoppingCart,
      color: "bg-yellow-500",
      change: "8 new",
      trend: "up",
    },
    {
      name: "Stock Value",
      value: `${(data.stats.totalStockValue / 1000).toFixed(1)}K RWF`,
      icon: DollarSign,
      color: "bg-purple-500",
      change: "+8%",
      trend: "up",
    },
    {
      name: "Monthly Expenses",
      value: `${(data.stats.monthlyExpenses / 1000).toFixed(1)}K RWF`,
      icon: TrendingUp,
      color: "bg-orange-500",
      change: "-2%",
      trend: "down",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name} - {user?.branchId}
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <Label>Supplier Name *</Label>
                  <Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={supplierForm.category} onValueChange={(v) => setSupplierForm({ ...supplierForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Add Supplier</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Stock Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStockItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Item Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required placeholder="e.g., food, beverages" />
                  </div>
                  <div>
                    <Label>Supplier *</Label>
                    <Select value={formData.supplierId} onValueChange={(v) => setFormData({ ...formData, supplierId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>
                        {data?.suppliers.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} required />
                  </div>
                  <div>
                    <Label>Unit *</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unit Price (RWF) *</Label>
                    <Input type="number" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })} required />
                  </div>
                  <div>
                    <Label>Reorder Level *</Label>
                    <Input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add Stock Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  {stat.trend === "up" ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Low Stock Alerts</h2>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              {data.lowStockItems.length} items
            </span>
          </div>
          <div className="space-y-3">
            {data.lowStockItems.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Current: {item.quantity} {item.unit} | Reorder Level: {item.reorderLevel}
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Purchase Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Purchase Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Order #
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Supplier
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {data.purchaseOrders.slice(0, 5).map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{order.supplier.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "approved"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {order.totalAmount.toLocaleString()} RWF
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Items Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Stock Items</h2>
          <div className="space-y-3">
            {data.stockItems.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} {item.unit} available
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {(item.quantity * item.unitPrice).toLocaleString()} RWF
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Suppliers</h2>
          <div className="space-y-3">
            {data.suppliers.slice(0, 5).map((supplier: any) => (
              <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-sm text-gray-600">{supplier.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs ${
                        i < (supplier.rating || 0) ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
