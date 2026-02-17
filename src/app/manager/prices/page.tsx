"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePriceStore, type PriceCategory } from "@/stores/price-store";
import { fullMenu } from "@/lib/menu-data";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import {
  DollarSign,
  Search,
  Edit3,
  History,
  TrendingUp,
  TrendingDown,
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Calendar,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  BarChart3,
  Save,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Room types with base prices
const roomPrices = [
  { id: "rt-standard", name: "Standard Room", nameRw: "Icyumba Gisanzwe", category: "room" as PriceCategory, price: 234000 },
  { id: "rt-deluxe", name: "Deluxe Room", nameRw: "Icyumba Cyiza", category: "room" as PriceCategory, price: 325000 },
  { id: "rt-family", name: "Family Room", nameRw: "Icyumba cy'Umuryango", category: "room" as PriceCategory, price: 416000 },
  { id: "rt-executive", name: "Executive Suite", nameRw: "Suite y'Umuyobozi", category: "room" as PriceCategory, price: 585000 },
  { id: "rt-presidential", name: "Presidential Suite", nameRw: "Suite ya Perezida", category: "room" as PriceCategory, price: 1105000 },
];

const spaPrices = [
  { id: "spa-massage", name: "African Stone Massage", nameRw: "Gukanda ku Mabuye", category: "spa" as PriceCategory, price: 120000 },
  { id: "spa-coffee", name: "Coffee Body Scrub", nameRw: "Gusiga Ikawa", category: "spa" as PriceCategory, price: 85000 },
  { id: "spa-volcanic", name: "Volcanic Clay Detox", nameRw: "Guhumeka kwa Volkano", category: "spa" as PriceCategory, price: 95000 },
  { id: "spa-yoga", name: "Yoga & Meditation", nameRw: "Yoga no Gutekereza", category: "spa" as PriceCategory, price: 45000 },
];

export default function PriceManagementPage() {
  const { user } = useAuthStore();
  const { isRw } = useI18n();
  const branchId = user?.branchId || "br-001";
  const userName = user?.name || "Manager";

  const { setPrice, removeOverride, toggleOverride, getOverridesByBranch, getEffectivePrice } = usePriceStore();

  const [activeTab, setActiveTab] = useState("rooms");
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<{ id: string; name: string; category: PriceCategory; price: number } | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");
  const [bulkPercent, setBulkPercent] = useState("");
  const [bulkCategory, setBulkCategory] = useState<PriceCategory>("room");

  const overrides = getOverridesByBranch(branchId);

  // Get menu items for price list
  const menuPrices = useMemo(() => {
    return fullMenu.slice(0, 40).map((item) => ({
      id: item.id,
      name: item.name,
      nameRw: item.nameFr || item.name,
      category: "menu" as PriceCategory,
      price: item.price,
    }));
  }, []);

  const getCurrentItems = () => {
    switch (activeTab) {
      case "rooms": return roomPrices;
      case "menu": return menuPrices;
      case "spa": return spaPrices;
      default: return [];
    }
  };

  const filteredItems = getCurrentItems().filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nameRw.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditPrice = (item: { id: string; name: string; category: PriceCategory; price: number }) => {
    setEditItem(item);
    const effective = getEffectivePrice(item.id, branchId, item.price);
    setNewPrice(effective.toString());
    setReason("");
    setEditDialog(true);
  };

  const handleSavePrice = () => {
    if (!editItem || !newPrice) return;
    const priceNum = parseInt(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setPrice({
      category: editItem.category,
      itemId: editItem.id,
      itemName: editItem.name,
      originalPrice: editItem.price,
      newPrice: priceNum,
      branchId,
      updatedBy: userName,
      reason: reason || undefined,
      active: true,
    });

    toast.success(`${isRw ? "Igiciro cyahinduwe neza" : "Price updated successfully"}: ${editItem.name}`);
    setEditDialog(false);
    setEditItem(null);
  };

  const handleBulkUpdate = () => {
    const percent = parseFloat(bulkPercent);
    if (isNaN(percent) || percent === 0) {
      toast.error("Enter a valid percentage");
      return;
    }

    const items = bulkCategory === "room" ? roomPrices
      : bulkCategory === "spa" ? spaPrices
      : menuPrices;

    items.forEach((item) => {
      const current = getEffectivePrice(item.id, branchId, item.price);
      const updated = Math.round(current * (1 + percent / 100));
      setPrice({
        category: item.category,
        itemId: item.id,
        itemName: item.name,
        originalPrice: item.price,
        newPrice: updated,
        branchId,
        updatedBy: userName,
        reason: `Bulk ${percent > 0 ? "increase" : "decrease"}: ${percent}%`,
        active: true,
      });
    });

    toast.success(`${isRw ? "Ibiciro byahinduwe" : "Prices updated"}: ${items.length} items`);
    setBulkPercent("");
  };

  const handleResetPrice = (itemId: string) => {
    const override = overrides.find((o) => o.itemId === itemId);
    if (override) {
      removeOverride(override.id);
      toast.info(isRw ? "Igiciro cyasubijwe" : "Price reset to original");
    }
  };

  const totalOverrides = overrides.filter((o) => o.active).length;
  const avgChange = overrides.length > 0
    ? overrides.reduce((sum, o) => sum + ((o.newPrice - o.originalPrice) / o.originalPrice) * 100, 0) / overrides.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{totalOverrides}</p>
                <p className="text-xs text-emerald-900">{isRw ? "Ibiciro byahinduwe" : "Active Price Overrides"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                {avgChange >= 0 ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%</p>
                <p className="text-xs text-blue-900">{isRw ? "Ihinduka ry'igiciro" : "Average Price Change"}</p>
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
                  <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(v as PriceCategory)}>
                    <SelectTrigger className="h-8 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Rooms</SelectItem>
                      <SelectItem value="menu">Menu</SelectItem>
                      <SelectItem value="spa">Spa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="%"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(e.target.value)}
                    className="h-8 w-16 text-xs"
                  />
                  <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2" onClick={handleBulkUpdate}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Tabs */}
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
                <BedDouble className="h-3.5 w-3.5" /> {isRw ? "Ibyumba" : "Rooms"}
              </TabsTrigger>
              <TabsTrigger value="menu" className="gap-1.5 text-xs">
                <UtensilsCrossed className="h-3.5 w-3.5" /> Menu
              </TabsTrigger>
              <TabsTrigger value="spa" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Spa
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-pearl/50">
                      <TableHead className="text-xs">{isRw ? "Izina" : "Item"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Igiciro Gisanzwe" : "Original Price"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Igiciro Gishya" : "Current Price"}</TableHead>
                      <TableHead className="text-xs text-center">{isRw ? "Ihinduka" : "Change"}</TableHead>
                      <TableHead className="text-xs text-center">{isRw ? "Imimerere" : "Status"}</TableHead>
                      <TableHead className="text-xs text-right">{isRw ? "Ibikorwa" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const effective = getEffectivePrice(item.id, branchId, item.price);
                      const override = overrides.find((o) => o.itemId === item.id);
                      const change = effective !== item.price ? ((effective - item.price) / item.price * 100) : 0;
                      
                      return (
                        <TableRow key={item.id} className="hover:bg-pearl/30">
                          <TableCell className="font-medium text-sm">
                            <div>
                              <p className="text-charcoal">{isRw ? item.nameRw : item.name}</p>
                              {isRw && <p className="text-xs text-text-muted-custom">{item.name}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-text-muted-custom">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-charcoal">
                            {formatCurrency(effective)}
                          </TableCell>
                          <TableCell className="text-center">
                            {change !== 0 ? (
                              <Badge className={`text-[10px] gap-0.5 ${change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(change).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-xs text-text-muted-custom">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {override ? (
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={override.active}
                                  onCheckedChange={() => toggleOverride(override.id)}
                                  className="scale-75"
                                />
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">{isRw ? "Gisanzwe" : "Default"}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-emerald hover:text-emerald-dark"
                                onClick={() => handleEditPrice(item)}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              {override && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-text-muted-custom hover:text-red-500"
                                  onClick={() => handleResetPrice(item.id)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Overrides Summary */}
      {overrides.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-gold" />
              {isRw ? "Ibiciro Byahinduwe" : "Price Change Log"} ({overrides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {overrides.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg bg-pearl/50 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{o.category}</Badge>
                    <span className="font-medium text-charcoal">{o.itemName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted-custom line-through text-xs">{formatCurrency(o.originalPrice)}</span>
                    <span className="font-semibold text-emerald">{formatCurrency(o.newPrice)}</span>
                    {!o.active && <Badge className="bg-gray-100 text-gray-600 text-[10px]">Paused</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Price Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-emerald" />
              {isRw ? "Hindura Igiciro" : "Edit Price"}
            </DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 pt-2">
              <div className="bg-pearl/60 rounded-lg p-3">
                <p className="text-sm font-semibold text-charcoal">{editItem.name}</p>
                <p className="text-xs text-text-muted-custom mt-0.5">
                  {isRw ? "Igiciro gisanzwe" : "Original price"}: {formatCurrency(editItem.price)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">{isRw ? "Igiciro Gishya (RWF)" : "New Price (RWF)"}</Label>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="mt-1"
                  placeholder="Enter new price"
                />
                {newPrice && editItem && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {parseInt(newPrice) !== editItem.price && (
                      <Badge className={`text-[10px] ${parseInt(newPrice) > editItem.price ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {parseInt(newPrice) > editItem.price ? "+" : ""}
                        {(((parseInt(newPrice) - editItem.price) / editItem.price) * 100).toFixed(1)}%
                      </Badge>
                    )}
                    <span className="text-xs text-text-muted-custom">
                      → {formatCurrency(parseInt(newPrice) || 0)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">{isRw ? "Impamvu (ntibikenewe)" : "Reason (optional)"}</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={isRw ? "Impamvu y'ihinduka ry'igiciro..." : "Reason for price change..."}
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialog(false)}>
                  {isRw ? "Hagarika" : "Cancel"}
                </Button>
                <Button
                  onClick={handleSavePrice}
                  className="bg-emerald hover:bg-emerald-dark text-white gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {isRw ? "Bika Igiciro" : "Save Price"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
