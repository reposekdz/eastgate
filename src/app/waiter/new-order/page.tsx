"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  CoffeeIcon,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

export default function WaiterNewOrderPage() {
  const { user } = useAuthStore();
  const { getMenuItems, getTables } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "waiter";

  const menuItems = getMenuItems();
  const tables = getTables(branchId, userRole);
  const availableTables = tables.filter(
    (t) => t.status === "available" || t.status === "occupied"
  );

  const [cart, setCart] = useState<Record<string, number>>({});
  const [tableNumber, setTableNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const categories = [...new Set(menuItems.map((m) => m.category))];

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[itemId] > 1) {
        updated[itemId]--;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const clearCart = () => setCart({});

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return { ...item!, quantity: qty };
  });

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handlePlaceOrder = () => {
    if (cartCount === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!tableNumber) {
      toast.error("Please select a table");
      return;
    }
    toast.success(
      `Order placed for Table ${tableNumber}! ${cartCount} items — ${formatCurrency(cartTotal)}`
    );
    setCart({});
    setTableNumber("");
    setGuestName("");
    setSpecialInstructions("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-md text-charcoal">Create New Order</h1>
        <p className="body-sm text-text-muted-custom mt-1">
          Browse menu &bull; Add to cart &bull; Place order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categories */}
          <Tabs defaultValue={categories[0]?.toLowerCase().replace(" ", "") || "all"}>
            <TabsList className="flex-wrap h-auto gap-1">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat.toLowerCase().replace(" ", "")}
                  className="text-xs"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent
                key={category}
                value={category.toLowerCase().replace(" ", "")}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menuItems
                    .filter(
                      (item) =>
                        item.category === category &&
                        (searchTerm === "" ||
                          item.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()))
                    )
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="hover:border-amber-300 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-charcoal">
                                {item.name}
                              </h4>
                              <p className="text-xs text-text-muted-custom mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                              <p className="text-sm font-bold text-amber-700 mt-2">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {cart[item.id] ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-bold">
                                    {cart[item.id]}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item.id)}
                                    className="h-7 w-7 p-0 bg-amber-600 hover:bg-amber-700"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item.id)}
                                  className="bg-amber-600 hover:bg-amber-700 text-xs h-8"
                                >
                                  <Plus className="mr-1 h-3 w-3" /> Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Cart Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-4 border-2 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-amber-600" />
                Cart
                {cartCount > 0 && (
                  <Badge className="bg-amber-600 text-white text-[10px] ml-auto">
                    {cartCount} items
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-text-muted-custom">
                  <CoffeeIcon className="h-8 w-8 mx-auto mb-2 text-amber-300" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs">
                    Browse the menu and add items
                  </p>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-60">
                    <div className="space-y-3 pr-3">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm font-medium text-charcoal truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-text-muted-custom">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-bold w-5 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addToCart(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-bold text-charcoal ml-2 w-20 text-right">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="border-t pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-charcoal mb-1 block">
                          Table
                        </label>
                        <Select
                          value={tableNumber}
                          onValueChange={setTableNumber}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Table #" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTables.map((t) => (
                              <SelectItem
                                key={t.id}
                                value={t.number.toString()}
                              >
                                Table {t.number} ({t.seats}s)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-charcoal mb-1 block">
                          Guest Name
                        </label>
                        <Input
                          placeholder="Optional"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-charcoal mb-1 block">
                        Special Instructions
                      </label>
                      <Input
                        placeholder="e.g. No onions, extra spicy..."
                        value={specialInstructions}
                        onChange={(e) =>
                          setSpecialInstructions(e.target.value)
                        }
                        className="h-9"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-semibold text-charcoal">
                        Total:
                      </span>
                      <span className="text-xl font-bold text-amber-700">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        className="flex-1"
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Clear
                      </Button>
                      <Button
                        onClick={handlePlaceOrder}
                        className="flex-[2] bg-amber-600 hover:bg-amber-700 text-white"
                        size="sm"
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Place Order
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
