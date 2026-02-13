"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fullMenu,
  menuCategories,
  type MenuItemDetail,
  type MenuCategory,
} from "@/lib/menu-data";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Flame,
  Leaf,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CartItem {
  item: MenuItemDetail;
  quantity: number;
}

interface MenuOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
}

export function MenuOrderDialog({
  open,
  onOpenChange,
  cart,
  onUpdateCart,
}: MenuOrderDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "all">(
    "all"
  );
  const [showCartSummary, setShowCartSummary] = useState(false);

  // Filter menu items
  const filteredMenu = useMemo(() => {
    let items = fullMenu;

    // Filter by category
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.nameFr?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [selectedCategory, searchQuery]);

  // Group items by category for display
  const groupedMenu = useMemo(() => {
    const groups: Record<MenuCategory, MenuItemDetail[]> = {} as any;
    filteredMenu.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMenu]);

  // Cart operations
  const addToCart = (item: MenuItemDetail) => {
    const existingIndex = cart.findIndex((c) => c.item.id === item.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      onUpdateCart(newCart);
    } else {
      onUpdateCart([...cart, { item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    onUpdateCart(cart.filter((c) => c.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newCart = cart.map((c) =>
      c.item.id === itemId ? { ...c, quantity } : c
    );
    onUpdateCart(newCart);
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find((c) => c.item.id === itemId)?.quantity || 0;
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  // Get main category groups
  const mainCategories = [
    { id: "all" as const, label: "All Items", icon: "🍽️" },
    ...menuCategories.slice(0, 8),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="heading-sm flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            East Gate Hotel Menu
          </DialogTitle>
          <DialogDescription>
            Browse our full menu and add items to your order
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-140px)]">
          {/* Left Panel - Menu */}
          <div className="flex-1 flex flex-col">
            {/* Search and Filters */}
            <div className="px-6 py-4 space-y-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Pills */}
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2">
                  {mainCategories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "shrink-0",
                        selectedCategory === cat.id &&
                          "bg-emerald hover:bg-emerald-dark text-white"
                      )}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                {Object.entries(groupedMenu).map(([category, items]) => {
                  const categoryInfo = menuCategories.find(
                    (c) => c.id === category
                  );
                  if (!categoryInfo || items.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{categoryInfo.icon}</span>
                        <h3 className="font-heading font-semibold text-lg text-charcoal">
                          {categoryInfo.label}
                        </h3>
                        <div className="flex-1 h-px bg-border ml-2" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((item) => {
                          const quantity = getItemQuantity(item.id);
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "border rounded-lg p-3 transition-all hover:shadow-md",
                                quantity > 0 && "border-emerald bg-emerald/5"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2 mb-1">
                                    <h4 className="font-semibold text-sm text-charcoal leading-tight">
                                      {item.name}
                                    </h4>
                                    {item.popular && (
                                      <Star className="h-3 w-3 text-gold fill-gold shrink-0" />
                                    )}
                                  </div>

                                  {item.nameFr && (
                                    <p className="text-xs text-text-muted-custom italic mb-1">
                                      {item.nameFr}
                                    </p>
                                  )}

                                  {item.description && (
                                    <p className="text-xs text-text-muted-custom line-clamp-2 mb-2">
                                      {item.description}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-emerald text-sm">
                                      {formatCurrency(item.price)}
                                    </span>
                                    {item.vegetarian && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1"
                                      >
                                        <Leaf className="h-2 w-2 mr-0.5" />
                                        Veg
                                      </Badge>
                                    )}
                                    {item.spicy && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1 border-red-500 text-red-600"
                                      >
                                        <Flame className="h-2 w-2 mr-0.5" />
                                        Spicy
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Add to Cart Button */}
                                {quantity === 0 ? (
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                    className="shrink-0 h-8 bg-emerald hover:bg-emerald-dark"
                                    disabled={!item.available}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateQuantity(item.id, quantity - 1)
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm font-semibold">
                                      {quantity}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateQuantity(item.id, quantity + 1)
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredMenu.length === 0 && (
                  <div className="text-center py-12 text-text-muted-custom">
                    <p>No menu items found matching your search.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Cart */}
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l flex flex-col bg-pearl/30">
            <div className="px-4 py-3 border-b bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Your Order
                </h3>
                {totalItems > 0 && (
                  <Badge className="bg-emerald">{totalItems} items</Badge>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-text-muted-custom">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Your cart is empty</p>
                  <p className="text-xs mt-1">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 border"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-charcoal leading-tight mb-1">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-text-muted-custom">
                            <span>{formatCurrency(item.price)}</span>
                            <span>×</span>
                            <span>{quantity}</span>
                          </div>
                          <div className="font-semibold text-emerald text-sm mt-1">
                            {formatCurrency(item.price * quantity)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="border-t bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-charcoal">
                    Total Amount
                  </span>
                  <span className="font-heading text-xl font-bold text-emerald">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <Button
                  className="w-full bg-emerald hover:bg-emerald-dark"
                  onClick={() => onOpenChange(false)}
                >
                  Add to Booking
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
