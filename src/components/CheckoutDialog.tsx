"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/stores/cart-store";
import { useOrderStore, type OrderType, type PaymentMethodType } from "@/stores/order-store";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useAppDataStore } from "@/lib/store/app-data-store";
import { useBranchStore } from "@/lib/store/branch-store";
import {
  CreditCard,
  Phone,
  Building2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  UtensilsCrossed,
  BedDouble,
  ShoppingBag,
  Smartphone,
  Landmark,
  Globe,
  User,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  serviceCharge: number;
  grandTotal: number;
}

const orderTypeOptions = [
  {
    value: "dine_in" as OrderType,
    label: "Dine-In",
    sublabel: "Eat at restaurant",
    icon: UtensilsCrossed,
  },
  {
    value: "room_service" as OrderType,
    label: "Room Service",
    sublabel: "Deliver to room",
    icon: BedDouble,
  },
  {
    value: "takeaway" as OrderType,
    label: "Takeaway",
    sublabel: "Pack to go",
    icon: ShoppingBag,
  },
];

const paymentMethods = [
  {
    value: "mtn_mobile" as PaymentMethodType,
    label: "MTN Mobile Money",
    sublabel: "Pay with MTN MoMo",
    icon: Smartphone,
    color: "bg-[#FFCC00]",
    textColor: "text-black",
  },
  {
    value: "airtel_money" as PaymentMethodType,
    label: "Airtel Money",
    sublabel: "Pay with Airtel Money",
    icon: Phone,
    color: "bg-[#ED1C24]",
    textColor: "text-white",
  },
  {
    value: "bank_transfer" as PaymentMethodType,
    label: "Bank Transfer",
    sublabel: "Direct bank payment",
    icon: Landmark,
    color: "bg-emerald",
    textColor: "text-white",
  },
  {
    value: "paypal" as PaymentMethodType,
    label: "PayPal",
    sublabel: "International payment",
    icon: Globe,
    color: "bg-[#003087]",
    textColor: "text-white",
  },
  {
    value: "cash" as PaymentMethodType,
    label: "Cash",
    sublabel: "Pay at counter",
    icon: CreditCard,
    color: "bg-charcoal",
    textColor: "text-white",
  },
];

export function CheckoutDialog({
  open,
  onOpenChange,
  subtotal,
  serviceCharge,
  grandTotal,
}: CheckoutDialogProps) {
  const branches = useAppDataStore((s) => s.branches);
  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("br-001");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("mtn_mobile");
  const [orderId, setOrderId] = useState("");

  const { items, clearCart } = useCartStore();
  const { placeOrder } = useOrderStore();
  const addOrder = useBranchStore((s) => s.addOrder);

  const handlePlaceOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }
    if (orderType === "dine_in" && !tableNumber) {
      toast.error("Please select a table number");
      return;
    }
    if (orderType === "room_service" && !roomNumber.trim()) {
      toast.error("Please enter your room number");
      return;
    }

    const branchInfo = branches.find((b) => b.id === selectedBranch);
    const id = placeOrder({
      items: items.map((ci) => ({
        itemId: ci.item.id,
        name: ci.item.nameEn || ci.item.name,
        price: ci.item.price,
        quantity: ci.quantity,
      })),
      orderType,
      tableNumber: orderType === "dine_in" ? tableNumber : undefined,
      roomNumber: orderType === "room_service" ? roomNumber : undefined,
      branchId: selectedBranch,
      branchName: branchInfo?.name || "Kigali Main",
      customerName,
      customerPhone,
      paymentMethod,
      status: "pending",
      subtotal,
      serviceCharge,
      grandTotal,
    });

    addOrder({
      tableNumber: orderType === "dine_in" ? parseInt(tableNumber || "0", 10) : 0,
      items: items.map((ci) => ({ name: ci.item.nameEn || ci.item.name, quantity: ci.quantity, price: ci.item.price })),
      status: "pending",
      total: grandTotal,
      guestName: customerName,
      roomCharge: orderType === "room_service",
      createdAt: new Date().toISOString(),
      branchId: selectedBranch,
      performedBy: customerName,
    });

    setOrderId(id);
    clearCart();
    setStep(3);
    toast.success("Order placed successfully!");
  };

  const resetAndClose = () => {
    setStep(1);
    setOrderType("dine_in");
    setTableNumber("");
    setRoomNumber("");
    setSelectedBranch("br-001");
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    setPaymentMethod("mtn_mobile");
    setOrderId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={step === 3 ? resetAndClose : onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Steps indicator */}
        {step < 3 && (
          <div className="flex items-center gap-0 px-6 pt-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    s <= step
                      ? "bg-emerald text-white"
                      : "bg-pearl text-text-muted-custom"
                  )}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2",
                      s < step ? "bg-emerald" : "bg-pearl"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Order Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6 py-5 space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="font-heading text-xl text-charcoal">
                  Order Details
                </DialogTitle>
              </DialogHeader>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-charcoal">
                  <Building2 className="h-3.5 w-3.5 inline mr-1" />
                  Select Branch
                </Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{b.name}</span>
                          <span className="text-xs text-text-muted-custom">{b.location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-charcoal">
                  Order Type
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {orderTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setOrderType(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                        orderType === opt.value
                          ? "border-emerald bg-emerald/5"
                          : "border-border hover:border-emerald/30"
                      )}
                    >
                      <opt.icon
                        className={cn(
                          "h-5 w-5",
                          orderType === opt.value
                            ? "text-emerald"
                            : "text-text-muted-custom"
                        )}
                      />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table/Room */}
              {orderType === "dine_in" && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-charcoal">
                    <MapPin className="h-3.5 w-3.5 inline mr-1" />
                    Table Number
                  </Label>
                  <Select value={tableNumber} onValueChange={setTableNumber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => (
                        <SelectItem key={i} value={`T-${String(i + 1).padStart(2, "0")}`}>
                          Table {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {orderType === "room_service" && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-charcoal">
                    <BedDouble className="h-3.5 w-3.5 inline mr-1" />
                    Room Number
                  </Label>
                  <Input
                    placeholder="e.g. 201"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                  />
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-charcoal">
                    <User className="h-3.5 w-3.5 inline mr-1" />
                    Your Name
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-charcoal">
                    <Phone className="h-3.5 w-3.5 inline mr-1" />
                    Phone
                  </Label>
                  <Input
                    placeholder="+250 7XX XXX XXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-charcoal">
                  Special Instructions (optional)
                </Label>
                <Textarea
                  placeholder="Any allergies or preferences..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                className="w-full bg-emerald hover:bg-emerald-dark text-white h-11"
                onClick={() => setStep(2)}
              >
                Continue to Payment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6 py-5 space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="font-heading text-xl text-charcoal">
                  Payment Method
                </DialogTitle>
              </DialogHeader>

              {/* Payment Methods */}
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      paymentMethod === pm.value
                        ? "border-emerald bg-emerald/5"
                        : "border-border hover:border-emerald/30"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        pm.color,
                        pm.textColor
                      )}
                    >
                      <pm.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-charcoal">
                        {pm.label}
                      </p>
                      <p className="text-xs text-text-muted-custom">
                        {pm.sublabel}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                        paymentMethod === pm.value
                          ? "border-emerald"
                          : "border-border"
                      )}
                    >
                      {paymentMethod === pm.value && (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-pearl/50 rounded-xl p-4 space-y-2">
                <h4 className="font-heading font-semibold text-sm text-charcoal">
                  Order Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-text-muted-custom">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted-custom">
                    <span>Service Charge (5%)</span>
                    <span>{formatCurrency(serviceCharge)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-heading font-bold text-charcoal text-base pt-1">
                    <span>Grand Total</span>
                    <span className="text-emerald">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  className="flex-1 bg-emerald hover:bg-emerald-dark text-white h-11"
                  onClick={handlePlaceOrder}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Place Order — {formatCurrency(grandTotal)}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-10 text-center space-y-4"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-charcoal mb-1">
                  Order Confirmed!
                </h2>
                <p className="text-text-muted-custom">
                  Your order <Badge className="bg-emerald text-white">{orderId}</Badge> has been placed
                </p>
              </div>
              <p className="text-sm text-text-muted-custom">
                Our kitchen team will start preparing your food right away.
                {orderType === "room_service" && " It will be delivered to your room."}
                {orderType === "dine_in" && " A waiter will serve you at your table."}
                {orderType === "takeaway" && " We'll notify you when it's ready to pick up."}
              </p>
              <Button
                className="bg-emerald hover:bg-emerald-dark text-white px-8"
                onClick={resetAndClose}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
