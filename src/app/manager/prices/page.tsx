"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import {
  DollarSign,
  Search,
  Edit3,
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Check,
  Percent,
  BarChart3,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PriceItem {
  id: string;
  name: string;
  nameRw: string;
  category: string;
  price: number;
  status?: string | null;
  available?: boolean;
}

const spaPrices = [
  { id: "spa-massage", name: "African Stone Massage", nameRw: "Gukanda ku Mabuye", category: "spa", price: 120000 },
  { id: "spa-coffee", name: "Coffee Body Scrub", nameRw: "Gusiga Ikawa", category: "spa", price: 85000 },
  { id: "spa-volcanic", name: "Volcanic Clay Detox", nameRw: "Guhumeka kwa Volkano", category: "spa", price: 95000 },
  { id: "spa-yoga", name: "Yoga & Meditation", nameRw: "Yoga no Gutekereza", category: "spa", price: 45000 },
];

export default function PriceManagementPage() {
  const { user } = useAuthStore();
  const { isRw } = useI18n();
  const branchId = user?.branchId || "";

  const [rooms, setRooms] = useState<PriceItem[]>([]);
  const [menuItems, setMenuItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("rooms");
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<PriceItem | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkPercent, setBulkPercent] = useState("");
  const [bulkCategory, setBulkCategory] = useState("room");

  useEffect(() => {
    async function fetchPrices() {
      if (!branchId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/manager/prices?branchId=${branchId}`);
        const data = await res.json();

        if (data.rooms) setRooms(data.rooms);
        if (data.menu) setMenuItems(data.menu);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
        toast.error("Failed to load prices");
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [branchId]);

  const getCurrentItems = () => {
    switch (activeTab) {
      case "rooms": return rooms;
      case "menu": return menuItems;
      case "spa": return spaPrices;
      default: return [];
    }
  };

  const filteredItems = getCurrentItems().filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nameRw.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditPrice = (item: PriceItem) => {
    setEditItem(item);
    setNewPrice(item.price.toString());
    setEditDialog(true);
  };

  const handleSavePrice = async () => {
    if (!editItem || !newPrice) return;
    
    const priceNum = parseInt(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/manager/prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: editItem.id,
          category: editItem.category,
          newPrice: priceNum,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update price");
      }

      if (editItem.category === "room") {
        setRooms(rooms.map(r => r.id === editItem.id ? { ...r, price: priceNum } : r));
      } else if (editItem.category === "menu") {
        setMenuItems(menuItems.map(m => m.id === editItem.id ? { ...m, price: priceNum } : m));
      }

      toast.success(`${isRw ? "Igiciro cyahinduwe" : "Price updated"}: ${editItem.name}`);
      setEditDialog(false);
      setEditItem(null);
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpdate = async () => {
    const percent = parseFloat(bulkPercent);
    if (isNaN(percent) || percent === 0) {
      toast.error("Enter a valid percentage");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/manager/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: bulkCategory,
          percentage: percent,
          branchId: branchId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update prices");
      }

      const data = await res.json();
      
      const refreshRes = await fetch(`/api/manager/prices?branchId=${branchId}`);
      const refreshData = await refreshRes.json();
      if (refreshData.rooms) setRooms(refreshData.rooms);
      if (refreshData.menu) setMenuItems(refreshData.menu);

      toast.success(`${isRw ? "Ibiciro byahinduwe" : "Prices updated"}: ${data.updatedCount} items`);
      setBulkPercent("");
    } catch (error) {
      console.error("Error bulk updating prices:", error);
      toast.error("Failed to update prices");
    } finally {
      setSaving(false);
    }
  };

  const totalItems = rooms.length + menuItems.length + spaPrices.length;
  const avgRoomPrice = rooms.length > 0 ? rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gold rounded-xl flex items-center justify-center shadow-lg">
          <DollarSign className="h-5 w-5 text-charcoal" />
        </div>
        <div>
          <h1 className="heading-md text-charcoal">
            {isRw ? "Gucunga Ibiciro" : "Price Management"}
          </h1>
          <p className="text-xs text-text-muted-custom">
            {isRw ? "Hindura ibiciro by'ishami ryawe" : "Adjust prices for your branch"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{totalItems}</p>
                <p className="text-xs text-emerald-900">{isRw ? "Ibirimo" : "Total Items"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(avgRoomPrice)}</p>
                <p className="text-xs text-blue-900">{isRw ? "Igiciro ry'icyumba" : "Avg Room Price"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-900 mb-1.5">{isRw ? "Ihindura ryose" : "Bulk Adjust"}</p>
                <div className="flex gap-1.5">
                  <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(v)}>
                    <SelectTrigger className="h-8 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Rooms</SelectItem>
                      <SelectItem value="menu">Menu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="%"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(e.target.value)}
                    className="h-8 w-16 text-xs"
                  />
                  <Button 
                    size="sm" 
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2" 
                    onClick={handleBulkUpdate}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">{isRw ? "Ibiciro by'Ibintu" : "Item Prices"}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                placeholder={isRw ? "Shakisha..." : "Search items..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="rooms" className="gap-1.5 text-xs">
                <BedDouble className="h-3.5 w-3.5" /> {isRw ? "Ibyumba" : "Rooms"} ({rooms.length})
              </TabsTrigger>
              <TabsTrigger value="menu" className="gap-1.5 text-xs">
                <UtensilsCrossed className="h-3.5 w-3.5" /> Menu ({menuItems.length})
              </TabsTrigger>
              <TabsTrigger value="spa" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Spa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rooms">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pearl/50">
                      <TableHead className="text-xs">{isRw ? "Izina" : "Item"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Igiciro" : "Price"}</TableHead>
                      <TableHead className="text-xs text-center">{isRw ? "Imimerere" : "Status"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Ibikorwa" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-text-muted-custom">
                          {isRw ? "Nta birimo" : "No items found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-pearl/30">
                          <TableCell className="font-medium text-sm">
                            <div>
                              <p className="text-charcoal">{isRw ? item.nameRw : item.name}</p>
                              {isRw && <p className="text-xs text-text-muted-custom">{item.name}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-charcoal">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                              {isRw ? "Ibanze" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald hover:text-emerald-dark"
                              onClick={() => handleEditPrice(item)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="menu">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pearl/50">
                      <TableHead className="text-xs">{isRw ? "Izina" : "Item"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Igiciro" : "Price"}</TableHead>
                      <TableHead className="text-xs text-center">{isRw ? "Imimerere" : "Status"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Ibikorwa" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-text-muted-custom">
                          {isRw ? "Nta birimo" : "No items found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-pearl/30">
                          <TableCell className="font-medium text-sm">
                            <div>
                              <p className="text-charcoal">{isRw ? item.nameRw : item.name}</p>
                              {isRw && <p className="text-xs text-text-muted-custom">{item.name}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-charcoal">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                              {isRw ? "Ibanze" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald hover:text-emerald-dark"
                              onClick={() => handleEditPrice(item)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="spa">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pearl/50">
                      <TableHead className="text-xs">{isRw ? "Izina" : "Item"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Igiciro" : "Price"}</TableHead>
                      <TableHead className="text-xs text-center">{isRw ? "Imimerere" : "Status"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Ibikorwa" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-pearl/30">
                        <TableCell className="font-medium text-sm">
                          <div>
                            <p className="text-charcoal">{isRw ? item.nameRw : item.name}</p>
                            {isRw && <p className="text-xs text-text-muted-custom">{item.name}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-charcoal">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {isRw ? "Gisanzwe" : "Default"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-emerald hover:text-emerald-dark"
                            onClick={() => handleEditPrice(item)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRw ? "Guhindura Igiciro" : "Edit Price"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm">{isRw ? "Ibirimo" : "Item"}</Label>
              <p className="text-lg font-semibold">{editItem?.name}</p>
            </div>
            <div>
              <Label className="text-sm">{isRw ? "Igiciro gishya (RWF)" : "New Price (RWF)"}</Label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter new price"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                {isRw ? "Gancel" : "Cancel"}
              </Button>
              <Button onClick={handleSavePrice} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isRw ? "Bika" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
