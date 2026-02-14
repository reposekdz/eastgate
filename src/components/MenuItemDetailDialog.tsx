"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/format";
import { getMenuItemImage } from "@/lib/menu-images";
import type { MenuItemDetail } from "@/lib/menu-data";
import {
  Plus,
  Minus,
  ShoppingCart,
  Star,
  Leaf,
  Flame,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItemDetailDialogProps {
  item: MenuItemDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuItemDetailDialog({
  item,
  open,
  onOpenChange,
}: MenuItemDetailDialogProps) {
  const { addItem, getItemQuantity, updateQuantity, toggleFavorite, isFavorite } =
    useCartStore();

  if (!item) return null;

  const quantity = getItemQuantity(item.id);
  const imageUrl = getMenuItemImage(item.id, item.category);
  const isFav = isFavorite(item.id);

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      name: item.name,
      nameEn: item.name,
      nameFr: item.nameFr,
      price: item.price,
      image: imageUrl,
      category: item.category,
      description: item.description,
      descriptionEn: item.description,
      popular: item.popular,
      vegetarian: item.vegetarian,
      spicy: item.spicy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Image */}
        <div className="relative h-52 sm:h-60 overflow-hidden">
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Favorite */}
          <button
            onClick={() => toggleFavorite(item.id)}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isFav ? "fill-red-500 text-red-500" : "text-charcoal/60"
              )}
            />
          </button>

          {/* Price badge overlay */}
          <div className="absolute bottom-3 left-4">
            <Badge className="bg-emerald text-white text-base px-3 py-1 font-heading font-bold shadow-lg">
              {formatCurrency(item.price)}
            </Badge>
          </div>

          {item.popular && (
            <div className="absolute top-3 left-4">
              <Badge className="bg-gold text-charcoal text-xs font-semibold shadow-lg gap-1">
                <Star className="h-3 w-3 fill-current" />
                Popular
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-3">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="font-heading text-xl text-charcoal leading-tight">
              {item.name}
            </DialogTitle>
            {item.nameFr && (
              <DialogDescription className="text-sm text-text-muted-custom italic">
                {item.nameFr}
              </DialogDescription>
            )}
          </DialogHeader>

          {item.description && (
            <p className="text-sm text-text-muted-custom leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.vegetarian && (
              <Badge
                variant="outline"
                className="text-xs border-green-500 text-green-600 gap-1"
              >
                <Leaf className="h-3 w-3" />
                Vegetarian
              </Badge>
            )}
            {item.spicy && (
              <Badge
                variant="outline"
                className="text-xs border-red-400 text-red-500 gap-1"
              >
                <Flame className="h-3 w-3" />
                Spicy
              </Badge>
            )}
          </div>

          <Separator />

          {/* Add to Cart / Quantity Controls */}
          <div className="flex items-center justify-between gap-4">
            {quantity === 0 ? (
              <Button
                className="flex-1 bg-emerald hover:bg-emerald-dark text-white h-12 text-base gap-2"
                onClick={handleAddToCart}
                disabled={!item.available}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-pearl rounded-xl px-3 py-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    className="h-8 w-8 p-0 rounded-full border-emerald"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-lg font-bold text-charcoal">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                    className="h-8 w-8 p-0 rounded-full border-emerald"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted-custom">Subtotal</p>
                  <p className="font-heading font-bold text-emerald text-lg">
                    {formatCurrency(item.price * quantity)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
