"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartStore } from "@/stores/cart-store";
import { useBranchStore } from "@/lib/store/branch-store";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  UtensilsCrossed,
  Coffee,
  Cake,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const categoryIcons = {
  Breakfast: Coffee,
  "Main Course": ChefHat,
  Beverages: Coffee,
  Desserts: Cake,
};

const menuImages: Record<string, string> = {
  "Continental Breakfast": "https://images.pexels.com/photos/103124/pexels-photo-103124.jpeg",
  "Rwandan Breakfast": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
  "Grilled Tilapia": "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg",
  "Brochette Platter": "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg",
  "Isombe & Plantain": "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg",
  "Nyama Choma": "https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg",
  "Rwandan Coffee": "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg",
  "Fresh Juice": "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg",
  "Banana Wine": "https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg",
  "Chocolate Lava Cake": "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg",
};

export default function OrderFoodPage() {
  const getMenuItems = useBranchStore((s) => s.getMenuItems);
  const menuItems = getMenuItems();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const { items, addItem, removeItem, updateQuantity, totalAmount, clearCart } = useCartStore();

  const categories = ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))];

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory && item.available;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const handleAddToCart = (item: typeof menuItems[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      nameEn: item.name,
      price: item.price,
      image: menuImages[item.name] || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
      category: item.category,
      description: item.description,
    });
    toast.success(`${item.name} added to cart`);
  };

  const cartTotal = totalAmount();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[40vh] overflow-hidden bg-gradient-to-br from-emerald via-emerald-dark to-charcoal">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4"
          >
            <UtensilsCrossed className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl text-white font-heading font-bold mb-2"
          >
            Order <span className="text-gold">Delicious Food</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-white/80 max-w-md"
          >
            Browse our menu and order your favorite dishes for dine-in, takeaway, or room service
          </motion.p>
        </div>
      </section>

      {/* Search & Cart */}
      <section className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button
              onClick={() => setCartOpen(true)}
              className="relative bg-emerald hover:bg-emerald-dark text-white h-11 px-4 gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gold text-charcoal p-0 flex items-center justify-center text-xs font-bold">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((cat) => {
              const Icon = cat !== "all" ? categoryIcons[cat as keyof typeof categoryIcons] : UtensilsCrossed;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-2">
                  {Icon && <Icon className="h-4 w-4" />}
                  {cat === "all" ? "All Items" : cat}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </section>

      {/* Menu Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-28">
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-text-muted-custom/30" />
              <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">
                No items found
              </h3>
              <p className="text-text-muted-custom">
                Try adjusting your search or category filter
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredItems.map((item, idx) => {
                const cartItem = items.find((i) => i.item.id === item.id);
                const Icon = categoryIcons[item.category as keyof typeof categoryIcons];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <Image
                          src={menuImages[item.name] || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white/90 text-charcoal backdrop-blur-sm gap-1">
                            {Icon && <Icon className="h-3 w-3" />}
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <h3 className="font-heading font-semibold text-lg text-charcoal mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-text-muted-custom mb-3 flex-1">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xl font-bold text-emerald">
                            {formatCurrency(item.price)}
                          </span>
                          {cartItem ? (
                            <div className="flex items-center gap-2 bg-emerald/10 rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, Math.max(0, cartItem.quantity - 1))}
                                className="h-8 w-8 p-0 hover:bg-emerald/20"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-semibold text-charcoal w-6 text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                className="h-8 w-8 p-0 hover:bg-emerald/20"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              className="bg-emerald hover:bg-emerald-dark text-white gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="p-4 border-b flex items-center justify-between bg-emerald text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="font-heading font-bold text-lg">Your Cart</h2>
                  <Badge className="bg-white text-emerald">{cartItemCount}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCartOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-3 text-text-muted-custom/30" />
                    <p className="text-text-muted-custom">Your cart is empty</p>
                  </div>
                ) : (
                  items.map((cartItem) => (
                    <Card key={cartItem.item.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={cartItem.item.image}
                              alt={cartItem.item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-charcoal truncate">
                              {cartItem.item.name}
                            </h4>
                            <p className="text-sm text-emerald font-bold">
                              {formatCurrency(cartItem.item.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(cartItem.item.id, Math.max(0, cartItem.quantity - 1))}
                                className="h-7 w-7 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {cartItem.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                                className="h-7 w-7 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(cartItem.item.id)}
                                className="h-7 w-7 p-0 ml-auto text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {items.length > 0 && (
                <div className="p-4 border-t bg-gray-50 space-y-3 sticky bottom-0 z-10">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-charcoal">Total</span>
                    <span className="text-emerald">{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-emerald hover:bg-emerald-dark text-white h-12 text-base font-semibold"
                  >
                    <Link href="/menu">Proceed to Checkout</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearCart();
                      toast.success("Cart cleared");
                    }}
                    className="w-full"
                  >
                    Clear Cart
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Checkout Button for Mobile */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 p-4 md:hidden">
          <Button
            asChild
            className="w-full bg-emerald hover:bg-emerald-dark text-white h-14 text-lg font-bold shadow-lg"
          >
            <Link href="/checkout-food">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Checkout ({cartItemCount}) - {formatCurrency(cartTotal)}
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
