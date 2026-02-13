"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  enhancedMenu,
  menuCategories,
  type MenuItem,
} from "@/lib/menu-data-enhanced";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/format";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  Flame,
  Leaf,
  Star,
  X,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ModernMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModernMenuDialog({
  open,
  onOpenChange,
}: ModernMenuDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState<string>("all");

  const {
    addItem,
    getItemQuantity,
    updateQuantity,
    favorites,
    toggleFavorite,
    isFavorite,
    totalItems,
    totalAmount,
  } = useCartStore();

  // Filter menu items
  const filteredMenu = useMemo(() => {
    let items = enhancedMenu;

    // Category filter
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Favorites filter
    if (showOnlyFavorites) {
      items = items.filter((item) => favorites.includes(item.id));
    }

    // Dietary filter
    if (dietaryFilter === "vegetarian") {
      items = items.filter((item) => item.vegetarian);
    } else if (dietaryFilter === "halal") {
      items = items.filter((item) => item.halal);
    } else if (dietaryFilter === "gluten-free") {
      items = items.filter((item) => item.glutenFree);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.nameEn.toLowerCase().includes(query) ||
          item.descriptionEn?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [selectedCategory, searchQuery, showOnlyFavorites, dietaryFilter, favorites]);

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald/5 to-gold/5">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="heading-sm flex items-center gap-3">
                <span className="text-3xl">🍽️</span>
                <div>
                  <div className="text-2xl font-heading font-bold text-charcoal">
                    Menu ya East Gate Hotel
                  </div>
                  <div className="text-sm font-normal text-text-muted-custom mt-1">
                    Hitamo ibyo ushaka kurya
                  </div>
                </div>
              </DialogTitle>
            </div>
            
            {totalItems() > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-text-muted-custom">Amafaranga Yose</div>
                  <div className="text-lg font-heading font-bold text-emerald">
                    {formatCurrency(totalAmount())}
                  </div>
                </div>
                <Badge className="bg-emerald text-white h-10 px-4 text-base">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {totalItems()}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-140px)]">
          {/* Filters */}
          <div className="px-6 py-4 space-y-4 border-b bg-white sticky top-0 z-10">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted-custom" />
              <Input
                placeholder="Shakisha ibiryo... (Search menu)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Category Tabs */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "shrink-0",
                    selectedCategory === "all" &&
                      "bg-emerald hover:bg-emerald-dark text-white"
                  )}
                >
                  🍽️ Byose
                </Button>
                {menuCategories.map((cat) => (
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
                    <span className="mr-1.5">{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="sm:hidden">{cat.labelEn}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Dietary Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={showOnlyFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={cn(
                  showOnlyFavorites && "bg-red-500 hover:bg-red-600"
                )}
              >
                <Heart
                  className={cn("h-3 w-3 mr-1", showOnlyFavorites && "fill-white")}
                />
                Byakunze
              </Button>
              <Button
                variant={dietaryFilter === "vegetarian" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setDietaryFilter(dietaryFilter === "vegetarian" ? "all" : "vegetarian")
                }
                className={cn(
                  dietaryFilter === "vegetarian" && "bg-green-600 hover:bg-green-700"
                )}
              >
                <Leaf className="h-3 w-3 mr-1" />
                Vegetarian
              </Button>
              <Button
                variant={dietaryFilter === "halal" ? "default" : "outline"}
                size="sm"
                onClick={() => setDietaryFilter(dietaryFilter === "halal" ? "all" : "halal")}
                className={cn(
                  dietaryFilter === "halal" && "bg-emerald hover:bg-emerald-dark"
                )}
              >
                <ChefHat className="h-3 w-3 mr-1" />
                Halal
              </Button>
            </div>
          </div>

          {/* Menu Grid */}
          <ScrollArea className="flex-1 px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredMenu.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  const favorite = isFavorite(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border-2",
                        quantity > 0 ? "border-emerald" : "border-transparent hover:border-emerald/30"
                      )}
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-pearl overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.nameEn}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          {item.popular && (
                            <Badge className="bg-gold text-charcoal border-0 shadow-lg">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Popular
                            </Badge>
                          )}
                          {item.spicy && (
                            <Badge className="bg-red-500 text-white border-0 shadow-lg">
                              <Flame className="h-3 w-3 mr-1" />
                              Spicy
                            </Badge>
                          )}
                          {item.vegetarian && (
                            <Badge className="bg-green-600 text-white border-0 shadow-lg">
                              <Leaf className="h-3 w-3 mr-1" />
                              Veg
                            </Badge>
                          )}
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4 transition-all",
                              favorite
                                ? "fill-red-500 text-red-500"
                                : "text-text-muted-custom"
                            )}
                          />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Name */}
                        <h3 className="font-heading font-bold text-lg text-charcoal mb-1 leading-tight">
                          {item.name}
                        </h3>
                        <p className="text-xs text-text-muted-custom italic mb-2">
                          {item.nameEn}
                        </p>

                        {/* Description */}
                        {item.descriptionEn && (
                          <p className="text-sm text-text-muted-custom line-clamp-2 mb-3">
                            {item.descriptionEn}
                          </p>
                        )}

                        {/* Price & Actions */}
                        <div className="flex items-center justify-between gap-3 mt-auto">
                          <div className="font-heading text-xl font-bold text-emerald">
                            {formatCurrency(item.price)}
                          </div>

                          {quantity === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              className="bg-emerald hover:bg-emerald-dark text-white shadow-lg"
                              disabled={!item.available}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ongeraho
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateQuantity(item.id, quantity - 1)
                                }
                                className="h-8 w-8 p-0 border-emerald"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold text-emerald">
                                {quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateQuantity(item.id, quantity + 1)
                                }
                                className="h-8 w-8 p-0 border-emerald"
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
              </AnimatePresence>
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg text-text-muted-custom mb-2">
                  Nta biryo byabonetse
                </p>
                <p className="text-sm text-text-muted-custom">
                  No menu items found matching your criteria
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {totalItems() > 0 && (
            <div className="border-t bg-white px-6 py-4">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12 bg-gradient-to-r from-emerald to-emerald-dark hover:from-emerald-dark hover:to-emerald text-white text-lg shadow-lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Komeza ({totalItems()} ibintu - {formatCurrency(totalAmount())})
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
