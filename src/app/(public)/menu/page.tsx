"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/format";
import {
  Search, ShoppingCart, Plus, Minus, Flame, Leaf, Star, X, Heart,
  SlidersHorizontal, MapPin, TrendingUp, Clock, ChefHat, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  nameFr?: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  available: boolean;
  popular: boolean;
  featured: boolean;
  vegetarian: boolean;
  vegan: boolean;
  spicy: boolean;
  glutenFree: boolean;
  prepTime?: number;
  calories?: number;
  branchId: string;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

export default function MenuPage() {
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        const data = await res.json();
        if (data.success) {
          setBranches(data.branches);
          if (user?.branchId) {
            setSelectedBranch(user.branchId);
          } else if (data.branches.length > 0) {
            setSelectedBranch(data.branches[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        toast.error("Failed to load branches");
      }
    };
    fetchBranches();
  }, [user]);

  useEffect(() => {
    if (!selectedBranch) return;

    const fetchMenu = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          branchId: selectedBranch,
          available: "true",
          limit: "100",
          sortBy,
          sortOrder: "asc",
        });

        const res = await fetch(`/api/menu?${params}`);
        const data = await res.json();

        if (data.success) {
          setMenuItems(data.menuItems);
          setCategories(data.categories);
        } else {
          toast.error("Failed to load menu");
        }
      } catch (error) {
        console.error("Failed to fetch menu:", error);
        toast.error("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [selectedBranch, sortBy]);

  const filteredMenu = useMemo(() => {
    let items = menuItems;

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (dietaryFilter === "popular") {
      items = items.filter((item) => item.popular);
    } else if (dietaryFilter === "vegetarian") {
      items = items.filter((item) => item.vegetarian);
    } else if (dietaryFilter === "vegan") {
      items = items.filter((item) => item.vegan);
    } else if (dietaryFilter === "spicy") {
      items = items.filter((item) => item.spicy);
    } else if (dietaryFilter === "glutenFree") {
      items = items.filter((item) => item.glutenFree);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.nameFr?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return items;
  }, [menuItems, selectedCategory, searchQuery, dietaryFilter]);

  const addToCart = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast.success("Added to cart");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart((prev) => ({ ...prev, [itemId]: quantity }));
    }
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
        toast.success("Removed from favorites");
      } else {
        newFavorites.add(itemId);
        toast.success("Added to favorites");
      }
      return newFavorites;
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find((i) => i.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  }, [cart, menuItems]);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const selectedBranchData = branches.find((b) => b.id === selectedBranch);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl font-bold mb-2">Our Menu</h1>
            <p className="text-emerald-100">Discover delicious dishes from our kitchen</p>
          </motion.div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} - {branch.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBranchData && (
              <Badge variant="outline" className="text-xs">
                {menuItems.length} items available
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search menu items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="prepTime">Prep Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            {[
              { id: "all", label: "All Items", icon: null },
              { id: "popular", label: "Popular", icon: Star },
              { id: "vegetarian", label: "Vegetarian", icon: Leaf },
              { id: "spicy", label: "Spicy", icon: Flame },
              { id: "glutenFree", label: "Gluten Free", icon: ChefHat },
            ].map((filter) => (
              <Button
                key={filter.id}
                variant={dietaryFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setDietaryFilter(filter.id)}
                className={cn("h-8 text-xs gap-1", dietaryFilter === filter.id && "bg-emerald-600 hover:bg-emerald-700")}
              >
                {filter.icon && <filter.icon className="h-3 w-3" />}
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("all")} className={cn("shrink-0", selectedCategory === "all" && "bg-emerald-600 hover:bg-emerald-700")}>
              All ({menuItems.length})
            </Button>
            {categories.map((cat) => (
              <Button key={cat.name} variant={selectedCategory === cat.name ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.name)} className={cn("shrink-0", selectedCategory === cat.name && "bg-emerald-600 hover:bg-emerald-700")}>
                {cat.name} ({cat.count})
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-600 mb-4">No items found</p>
            <Button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setDietaryFilter("all"); }}>Clear Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((item, idx) => {
              const quantity = cart[item.id] || 0;
              const isFav = favorites.has(item.id);

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={cn("bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all", quantity > 0 && "border-emerald-500 ring-2 ring-emerald-100")}>
                  <div className="relative h-48 bg-slate-200">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="h-16 w-16 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 flex gap-1">
                      {item.popular && (
                        <Badge className="bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Popular
                        </Badge>
                      )}
                      {item.featured && (
                        <Badge className="bg-purple-500 text-white">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    <button onClick={() => toggleFavorite(item.id)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:scale-110 transition">
                      <Heart className={cn("h-4 w-4", isFav && "fill-red-500 text-red-500")} />
                    </button>

                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-emerald-600 text-white text-lg font-bold px-3 py-1">
                        {formatCurrency(item.price)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    {item.nameFr && <p className="text-sm text-slate-500 italic mb-2">{item.nameFr}</p>}
                    {item.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.vegetarian && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                          <Leaf className="h-3 w-3 mr-1" />
                          Vegetarian
                        </Badge>
                      )}
                      {item.vegan && <Badge variant="outline" className="text-xs border-green-600 text-green-700">Vegan</Badge>}
                      {item.spicy && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                          <Flame className="h-3 w-3 mr-1" />
                          Spicy
                        </Badge>
                      )}
                      {item.glutenFree && <Badge variant="outline" className="text-xs">Gluten Free</Badge>}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      {item.prepTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.prepTime} min
                        </span>
                      )}
                      {item.calories && <span>{item.calories} cal</span>}
                    </div>

                    {quantity === 0 ? (
                      <Button onClick={() => addToCart(item.id)} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={!item.available}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-lg">{quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 right-6 z-50">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-2xl rounded-full px-6 h-14">
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="font-bold">{cartCount} Items</span>
              <Badge className="ml-3 bg-white text-emerald-600 font-bold">{formatCurrency(cartTotal)}</Badge>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
