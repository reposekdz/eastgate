"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Check, Download, FileUp, BarChart3, Globe, Copy, Eye, EyeOff, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  nameFr?: string;
  nameSw?: string;
  category: string;
  price: number;
  costPrice?: number;
  description?: string;
  descriptionFr?: string;
  descriptionSw?: string;
  imageUrl?: string;
  available: boolean;
  popular: boolean;
  featured: boolean;
  vegetarian: boolean;
  vegan: boolean;
  spicy: boolean;
  spicyLevel: number;
  glutenFree: boolean;
  halal: boolean;
  organic: boolean;
  prepTime?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens?: string[];
  ingredients?: string[];
  tags?: string[];
  rating?: number;
  totalOrders?: number;
}

const CATEGORIES = ["Appetizers", "Main Course", "Desserts", "Beverages", "Breakfast", "Lunch", "Dinner"];

export default function MenuManagementPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", nameFr: "", nameSw: "",
    category: "Main Course", subcategory: "",
    price: "", costPrice: "",
    description: "", descriptionFr: "", descriptionSw: "",
    imageUrl: "",
    available: true, popular: false, featured: false,
    vegetarian: false, vegan: false, spicy: false, spicyLevel: 0,
    glutenFree: false, halal: false, organic: false,
    prepTime: "15", servingSize: "",
    calories: "", protein: "", carbs: "", fat: "",
    allergens: "", ingredients: "", tags: "",
  });

  useEffect(() => {
    fetchMenuItems();
  }, [user?.branchId]);

  useEffect(() => {
    let filtered = items;
    if (search) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }
    setFilteredItems(filtered);
  }, [search, categoryFilter, items]);

  const fetchMenuItems = async () => {
    if (!user?.branchId) return;
    try {
      const res = await fetch(`/api/manager/menu?branchId=${user.branchId}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      toast.error("Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!user?.branchId) return;
    try {
      const res = await fetch(`/api/manager/menu/analytics?branchId=${user.branchId}`);
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (error) {
      toast.error("Failed to fetch analytics");
    }
  };

  const handleExport = async (format: string) => {
    if (!user?.branchId) return;
    try {
      const res = await fetch(`/api/manager/menu/bulk?branchId=${user.branchId}&format=${format}`);
      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `menu-export-${Date.now()}.csv`;
        a.click();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.items, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `menu-export-${Date.now()}.json`;
        a.click();
      }
      toast.success("Menu exported successfully");
    } catch (error) {
      toast.error("Failed to export menu");
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const items = JSON.parse(text);
      
      const res = await fetch("/api/manager/menu/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, branchId: user?.branchId, createdBy: user?.id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchMenuItems();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to import menu");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("branchId", user?.branchId || "");

    try {
      const res = await fetch("/api/manager/menu/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
      prepTime: parseInt(formData.prepTime),
      calories: formData.calories ? parseInt(formData.calories) : null,
      protein: formData.protein ? parseFloat(formData.protein) : null,
      carbs: formData.carbs ? parseFloat(formData.carbs) : null,
      fat: formData.fat ? parseFloat(formData.fat) : null,
      allergens: formData.allergens ? formData.allergens.split(",").map(s => s.trim()) : [],
      ingredients: formData.ingredients ? formData.ingredients.split(",").map(s => s.trim()) : [],
      tags: formData.tags ? formData.tags.split(",").map(s => s.trim()) : [],
      branchId: user?.branchId,
      createdBy: user?.id,
      lastModifiedBy: user?.id,
    };

    try {
      const url = "/api/manager/menu";
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem ? { ...payload, id: editingItem.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchMenuItems();
        resetForm();
        setIsDialogOpen(false);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to save menu item");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nameFr: item.nameFr || "",
      nameSw: item.nameSw || "",
      category: item.category,
      subcategory: "",
      price: item.price.toString(),
      costPrice: item.costPrice?.toString() || "",
      description: item.description || "",
      descriptionFr: item.descriptionFr || "",
      descriptionSw: item.descriptionSw || "",
      imageUrl: item.imageUrl || "",
      available: item.available,
      popular: item.popular,
      featured: item.featured,
      vegetarian: item.vegetarian,
      vegan: item.vegan,
      spicy: item.spicy,
      spicyLevel: item.spicyLevel,
      glutenFree: item.glutenFree,
      halal: item.halal,
      organic: item.organic || false,
      prepTime: item.prepTime?.toString() || "15",
      servingSize: "",
      calories: item.calories?.toString() || "",
      protein: item.protein?.toString() || "",
      carbs: item.carbs?.toString() || "",
      fat: item.fat?.toString() || "",
      allergens: item.allergens?.join(", ") || "",
      ingredients: item.ingredients?.join(", ") || "",
      tags: item.tags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/manager/menu?id=${id}&userId=${user?.id}&branchId=${user?.branchId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchMenuItems();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch("/api/manager/menu/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, branchId: user?.branchId, createdBy: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Item duplicated successfully");
        fetchMenuItems();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to duplicate item");
    }
  };

  const handleQuickToggle = async (id: string, field: string, value: boolean) => {
    try {
      const res = await fetch("/api/manager/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
        toast.success(`${field} updated`);
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: "", nameFr: "", nameSw: "",
      category: "Main Course", subcategory: "",
      price: "", costPrice: "",
      description: "", descriptionFr: "", descriptionSw: "",
      imageUrl: "",
      available: true, popular: false, featured: false,
      vegetarian: false, vegan: false, spicy: false, spicyLevel: 0,
      glutenFree: false, halal: false, organic: false,
      prepTime: "15", servingSize: "",
      calories: "", protein: "", carbs: "", fat: "",
      allergens: "", ingredients: "", tags: "",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your restaurant menu items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchAnalytics(); setIsAnalyticsOpen(true); }}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <FileUp className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
            <input type="file" accept=".json" onChange={handleBulkImport} className="hidden" />
          </label>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden bg-card">
              {item.imageUrl && (
                <div className="relative h-48 bg-muted">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    {item.nameFr && <p className="text-xs text-muted-foreground italic">FR: {item.nameFr}</p>}
                  </div>
                  <span className="text-lg font-bold">{item.price.toLocaleString()} RWF</span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {item.featured && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Featured</span>}
                  {item.popular && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Popular</span>}
                  {item.vegetarian && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Vegetarian</span>}
                  {!item.available && <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Unavailable</span>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="translations">Translations</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Item Name (English) *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subcategory</Label>
                    <Input value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} />
                  </div>
                  <div>
                    <Label>Price (RWF) *</Label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Cost Price (RWF)</Label>
                    <Input type="number" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Description (English)</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                  </div>
                  <div className="col-span-2">
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    {formData.imageUrl && (
                      <div className="mt-2 relative w-32 h-32">
                        <Image src={formData.imageUrl} alt="Preview" fill className="object-cover rounded" />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="translations" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label>Name (French)</Label>
                    <Input value={formData.nameFr} onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })} placeholder="Nom en français" />
                  </div>
                  <div>
                    <Label>Name (Kinyarwanda)</Label>
                    <Input value={formData.nameSw} onChange={(e) => setFormData({ ...formData, nameSw: e.target.value })} placeholder="Izina mu Kinyarwanda" />
                  </div>
                  <div>
                    <Label>Description (French)</Label>
                    <Textarea value={formData.descriptionFr} onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })} rows={3} />
                  </div>
                  <div>
                    <Label>Description (Kinyarwanda)</Label>
                    <Textarea value={formData.descriptionSw} onChange={(e) => setFormData({ ...formData, descriptionSw: e.target.value })} rows={3} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Calories</Label>
                    <Input type="number" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} />
                  </div>
                  <div>
                    <Label>Protein (g)</Label>
                    <Input type="number" step="0.1" value={formData.protein} onChange={(e) => setFormData({ ...formData, protein: e.target.value })} />
                  </div>
                  <div>
                    <Label>Carbs (g)</Label>
                    <Input type="number" step="0.1" value={formData.carbs} onChange={(e) => setFormData({ ...formData, carbs: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fat (g)</Label>
                    <Input type="number" step="0.1" value={formData.fat} onChange={(e) => setFormData({ ...formData, fat: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Allergens (comma-separated)</Label>
                    <Input value={formData.allergens} onChange={(e) => setFormData({ ...formData, allergens: e.target.value })} placeholder="nuts, dairy, gluten" />
                  </div>
                  <div className="col-span-2">
                    <Label>Ingredients (comma-separated)</Label>
                    <Textarea value={formData.ingredients} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} rows={2} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Available</Label>
                    <Switch checked={formData.available} onCheckedChange={(v) => setFormData({ ...formData, available: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Popular</Label>
                    <Switch checked={formData.popular} onCheckedChange={(v) => setFormData({ ...formData, popular: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Featured</Label>
                    <Switch checked={formData.featured} onCheckedChange={(v) => setFormData({ ...formData, featured: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Vegetarian</Label>
                    <Switch checked={formData.vegetarian} onCheckedChange={(v) => setFormData({ ...formData, vegetarian: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Vegan</Label>
                    <Switch checked={formData.vegan} onCheckedChange={(v) => setFormData({ ...formData, vegan: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Spicy</Label>
                    <Switch checked={formData.spicy} onCheckedChange={(v) => setFormData({ ...formData, spicy: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Gluten Free</Label>
                    <Switch checked={formData.glutenFree} onCheckedChange={(v) => setFormData({ ...formData, glutenFree: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Halal</Label>
                    <Switch checked={formData.halal} onCheckedChange={(v) => setFormData({ ...formData, halal: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Organic</Label>
                    <Switch checked={formData.organic} onCheckedChange={(v) => setFormData({ ...formData, organic: v })} />
                  </div>
                  <div>
                    <Label>Spicy Level (0-5)</Label>
                    <Input type="number" min="0" max="5" value={formData.spicyLevel} onChange={(e) => setFormData({ ...formData, spicyLevel: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Prep Time (min)</Label>
                    <Input type="number" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="breakfast, healthy, quick" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Menu Analytics</DialogTitle>
          </DialogHeader>
          {analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{analytics.overview.totalItems}</p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-muted-foreground">Avg Price</p>
                  <p className="text-2xl font-bold">{analytics.overview.avgPrice?.toFixed(0)} RWF</p>
                </div>
                <div className="p-4 border rounded">
                  <p className="text-sm text-muted-foreground">Avg Profit</p>
                  <p className="text-2xl font-bold">{analytics.overview.avgProfit?.toFixed(0)} RWF</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Top Performers</h3>
                <div className="space-y-2">
                  {analytics.topPerformers?.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex justify-between p-2 border rounded">
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.totalOrders} orders</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
