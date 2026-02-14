"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fullMenu,
  menuCategories,
  type MenuCategory,
  type MenuItemDetail,
} from "@/lib/menu-data";
import { categoryImages, menuHeroImage, getMenuItemImage } from "@/lib/menu-images";
import { useCartStore, useCartHydration } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/format";
import { CartSheet } from "@/components/CartSheet";
import { MenuItemDetailDialog } from "@/components/MenuItemDetailDialog";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Flame,
  Leaf,
  Star,
  X,
  Heart,
  SlidersHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DietaryFilter = "all" | "vegetarian" | "spicy" | "popular";

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "all">("all");
  const [showCart, setShowCart] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>("all");
  const [selectedItem, setSelectedItem] = useState<MenuItemDetail | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const hydrated = useCartHydration();
  const { addItem, getItemQuantity, updateQuantity, totalItems, totalAmount, toggleFavorite, isFavorite } =
    useCartStore();

  // Filter menu items
  const filteredMenu = useMemo(() => {
    let items = fullMenu;

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (dietaryFilter === "popular") {
      items = items.filter((item) => item.popular);
    } else if (dietaryFilter === "vegetarian") {
      items = items.filter((item) => item.vegetarian);
    } else if (dietaryFilter === "spicy") {
      items = items.filter((item) => item.spicy);
    }

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
  }, [selectedCategory, searchQuery, dietaryFilter]);

  // Group items by category
  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItemDetail[]> = {};
    filteredMenu.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMenu]);

  const handleAddToCart = (item: MenuItemDetail, e?: React.MouseEvent) => {
    e?.stopPropagation();
    addItem({
      id: item.id,
      name: item.name,
      nameEn: item.name,
      nameFr: item.nameFr,
      price: item.price,
      image: getMenuItemImage(item.id, item.category),
      category: item.category,
      description: item.description,
      descriptionEn: item.description,
      popular: item.popular,
      vegetarian: item.vegetarian,
      spicy: item.spicy,
    });
  };

  const handleItemClick = (item: MenuItemDetail) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const cartCount = totalItems();
  const cartTotal = totalAmount();

  // Food vs Beverage section counts
  const foodCategories = ["hot_starters", "cold_starters", "beef", "chicken", "fish", "specials", "pasta", "sandwiches", "barbeque", "accompaniment", "light_meals", "desserts", "sides", "sizzling", "pizza", "breakfast", "buffet", "snacks", "sweets"];
  const beverageCategories = ["hot_beverages", "soft_drinks", "beers", "wines", "spirits"];

  return (
    <>
      {/* Hero */}
      <section className="relative h-[35vh] sm:h-[40vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${menuHeroImage})` }}
        >
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="body-sm uppercase tracking-[0.25em] text-gold-light mb-3 font-medium"
          >
            East Gate Hotel 2025
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-3"
          >
            Food &amp;{" "}
            <span className="italic text-gold-light">Beverages</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="body-sm text-white/70 max-w-md"
          >
            Browse our complete menu with {fullMenu.length}+ dishes &amp; drinks.
            Order directly from your phone.
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="h-[2px] w-16 bg-gold mt-4"
          />
        </div>
      </section>

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
          {/* Search + Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                placeholder="Search menu... (e.g., steak, chicken, pizza)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-custom hover:text-charcoal"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Dietary Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted-custom shrink-0" />
            {[
              { id: "all" as DietaryFilter, label: "All Items", icon: "all" },
              { id: "popular" as DietaryFilter, label: "Popular", icon: null, lucide: Star },
              { id: "vegetarian" as DietaryFilter, label: "Vegetarian", icon: null, lucide: Leaf },
              { id: "spicy" as DietaryFilter, label: "Spicy", icon: null, lucide: Flame },
            ].map((filter) => (
              <Button
                key={filter.id}
                variant={dietaryFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setDietaryFilter(filter.id)}
                className={cn(
                  "shrink-0 h-8 text-xs gap-1",
                  dietaryFilter === filter.id && filter.id === "popular" &&
                    "bg-gold hover:bg-gold-dark text-charcoal",
                  dietaryFilter === filter.id && filter.id === "vegetarian" &&
                    "bg-green-600 hover:bg-green-700 text-white",
                  dietaryFilter === filter.id && filter.id === "spicy" &&
                    "bg-red-500 hover:bg-red-600 text-white",
                  dietaryFilter === filter.id && filter.id === "all" &&
                    "bg-emerald hover:bg-emerald-dark text-white"
                )}
              >
                {filter.icon && <CategoryIcon categoryId={filter.icon} size={14} />}
                {filter.lucide && <filter.lucide className={cn("h-3 w-3", dietaryFilter === filter.id && "fill-current")} />}
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Category Tabs */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1.5 pb-1">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "shrink-0 h-8 text-xs gap-1",
                  selectedCategory === "all" &&
                    "bg-emerald hover:bg-emerald-dark text-white"
                )}
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                All ({fullMenu.length})
              </Button>
              {menuCategories.map((cat) => {
                const count = fullMenu.filter((i) => i.category === cat.id).length;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "shrink-0 h-8 text-xs gap-1",
                      selectedCategory === cat.id &&
                        "bg-emerald hover:bg-emerald-dark text-white"
                    )}
                  >
                    <CategoryIcon categoryId={cat.id} size={14} />
                    {cat.label}
                    <span className="ml-1 opacity-60">({count})</span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Menu Content */}
      <section className="bg-pearl/30 min-h-screen pb-28">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-text-muted-custom">
              {filteredMenu.length} items found
              {selectedCategory !== "all" && (
                <span>
                  {" "}in{" "}
                  <Badge variant="outline" className="text-xs">
                    {menuCategories.find((c) => c.id === selectedCategory)?.label}
                  </Badge>
                </span>
              )}
            </p>
            <p className="text-xs text-text-muted-custom">
              All prices in <span className="font-semibold text-emerald">RWF</span>
            </p>
          </div>

          {/* Grouped Menu Items */}
          <div className="space-y-10">
            {Object.entries(groupedMenu).map(([category, items]) => {
              const catInfo = menuCategories.find((c) => c.id === category);
              if (!catInfo || items.length === 0) return null;

              return (
                <div
                  key={category}
                  ref={(el) => { categoryRefs.current[category] = el; }}
                >
                  {/* Category Header with Image */}
                  <div className="relative rounded-2xl overflow-hidden mb-5 h-28 sm:h-32">
                    <img
                      src={categoryImages[category] || ""}
                      alt={catInfo.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/50 to-transparent" />
                    <div className="relative z-10 flex items-center h-full px-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <CategoryIcon categoryId={catInfo.id} className="text-white" size={22} />
                          </div>
                          <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
                            {catInfo.label}
                          </h2>
                        </div>
                        <p className="text-xs text-white/60">
                          {items.length} {items.length === 1 ? "item" : "items"} available
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items Grid - IMAGE CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, idx) => {
                      const quantity = getItemQuantity(item.id);
                      const itemImage = getMenuItemImage(item.id, item.category);
                      const isFav = isFavorite(item.id);

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.3 }}
                          onClick={() => handleItemClick(item)}
                          className={cn(
                            "group bg-white rounded-2xl border shadow-xs overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5",
                            quantity > 0 && "border-emerald ring-1 ring-emerald/20"
                          )}
                        >
                          {/* Item Image */}
                          <div className="relative h-36 sm:h-40 overflow-hidden">
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                            {/* Favorite */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow transition-transform hover:scale-110"
                            >
                              <Heart
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isFav ? "fill-red-500 text-red-500" : "text-charcoal/50"
                                )}
                              />
                            </button>

                            {/* Popular badge */}
                            {item.popular && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-gold/90 text-charcoal text-[10px] font-semibold shadow gap-0.5 px-1.5">
                                  <Star className="h-2.5 w-2.5 fill-current" />
                                  Popular
                                </Badge>
                              </div>
                            )}

                            {/* Price overlay */}
                            <div className="absolute bottom-2 left-3">
                              <span className="font-heading font-bold text-white text-lg drop-shadow-lg">
                                {formatCurrency(item.price)}
                              </span>
                            </div>

                            {/* Quantity badge */}
                            {quantity > 0 && (
                              <div className="absolute bottom-2 right-2">
                                <Badge className="bg-emerald text-white text-xs font-bold px-2 shadow-lg">
                                  ×{quantity}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-charcoal leading-tight line-clamp-1">
                                  {item.name}
                                </h3>
                                {item.nameFr && (
                                  <p className="text-[10px] text-text-muted-custom italic mt-0.5 line-clamp-1">
                                    {item.nameFr}
                                  </p>
                                )}
                              </div>
                            </div>

                            {item.description && (
                              <p className="text-[11px] text-text-muted-custom line-clamp-2 mb-2">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-2">
                              {/* Tags */}
                              <div className="flex items-center gap-1">
                                {item.vegetarian && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] h-4 px-1 border-green-500 text-green-600"
                                  >
                                    <Leaf className="h-2 w-2 mr-0.5" />
                                    Veg
                                  </Badge>
                                )}
                                {item.spicy && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] h-4 px-1 border-red-400 text-red-500"
                                  >
                                    <Flame className="h-2 w-2 mr-0.5" />
                                    Spicy
                                  </Badge>
                                )}
                              </div>

                              {/* Add to Cart Button */}
                              {quantity === 0 ? (
                                <Button
                                  size="sm"
                                  onClick={(e) => handleAddToCart(item, e)}
                                  className="h-8 bg-emerald hover:bg-emerald-dark text-white shadow-sm text-xs gap-1 px-3"
                                  disabled={!item.available}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add
                                </Button>
                              ) : (
                                <div
                                  className="flex items-center gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, quantity - 1)}
                                    className="h-7 w-7 p-0 rounded-full border-emerald"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-bold text-emerald w-5 text-center">
                                    {quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, quantity + 1)}
                                    className="h-7 w-7 p-0 rounded-full border-emerald"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredMenu.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="font-heading text-lg text-charcoal mb-2">
                  No items found
                </p>
                <p className="text-sm text-text-muted-custom mb-4">
                  Try adjusting your search or filter
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setDietaryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-auto"
          >
            <Button
              onClick={() => setShowCart(true)}
              className="w-full md:w-auto h-14 bg-emerald hover:bg-emerald-dark text-white shadow-2xl rounded-2xl px-6 text-base"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="font-semibold">View Cart</span>
              <Badge className="ml-3 bg-white text-emerald font-bold px-2">
                {cartCount}
              </Badge>
              <span className="ml-2 font-heading font-bold">
                {formatCurrency(cartTotal)}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <CartSheet open={showCart} onOpenChange={setShowCart} />

      {/* Item Detail Dialog */}
      <MenuItemDetailDialog
        item={selectedItem}
        open={showItemDetail}
        onOpenChange={setShowItemDetail}
      />
    </>
  );
}
