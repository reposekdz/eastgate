"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/format";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  X,
} from "lucide-react";
import { CheckoutDialog } from "./CheckoutDialog";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalAmount } =
    useCartStore();

  const subtotal = totalAmount();
  const serviceCharge = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + serviceCharge;
  const itemCount = totalItems();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald/5 to-gold/5">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-heading text-xl text-charcoal flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald" />
                Your Order
              </SheetTitle>
              {itemCount > 0 && (
                <Badge className="bg-emerald text-white">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </Badge>
              )}
            </div>
            <SheetDescription className="text-text-muted-custom">
              Review your order before checkout
            </SheetDescription>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="h-20 w-20 rounded-full bg-pearl flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10 text-text-muted-custom/30" />
              </div>
              <p className="font-heading text-lg text-charcoal mb-1">
                Your cart is empty
              </p>
              <p className="text-sm text-text-muted-custom mb-6">
                Add items from the menu to get started
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-emerald text-emerald hover:bg-emerald/5"
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {items.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 bg-white rounded-xl p-3 border shadow-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-charcoal leading-tight mb-0.5">
                          {item.nameEn || item.name}
                        </h4>
                        <p className="text-xs text-text-muted-custom">
                          {formatCurrency(item.price)} each
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, quantity - 1)}
                            className="h-7 w-7 p-0 rounded-full"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold text-charcoal">
                            {quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, quantity + 1)}
                            className="h-7 w-7 p-0 rounded-full"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-emerald text-sm">
                          {formatCurrency(item.price * quantity)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 p-0 mt-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t bg-white px-6 py-4 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-text-muted-custom">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted-custom">
                    <span>Service Charge (5%)</span>
                    <span>{formatCurrency(serviceCharge)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-heading font-bold text-charcoal text-lg pt-1">
                    <span>Total</span>
                    <span className="text-emerald">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCart()}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                  <Button
                    className="flex-1 bg-emerald hover:bg-emerald-dark text-white h-11"
                    onClick={() => {
                      onOpenChange(false);
                      setShowCheckout(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Checkout — {formatCurrency(grandTotal)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        subtotal={subtotal}
        serviceCharge={serviceCharge}
        grandTotal={grandTotal}
      />
    </>
  );
}
