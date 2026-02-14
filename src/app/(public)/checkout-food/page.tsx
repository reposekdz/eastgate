"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { formatWithCurrency } from "@/lib/currencies";
import { useCurrency } from "@/components/shared/CurrencySelector";
import { useI18n } from "@/lib/i18n/context";
import {
  ShoppingCart,
  MapPin,
  Phone,
  User,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Check,
  X,
  Clock,
  UtensilsCrossed,
  Home,
  Store,
  ChevronRight,
  AlertCircle,
  Percent,
  Gift,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface CartItem {
  item: {
    id: string;
    name: string;
    nameFr?: string;
    price: number;
  };
  quantity: number;
}

type OrderType = "dine_in" | "takeaway" | "delivery";
type PaymentMethod = "cash" | "card" | "mtn_mobile" | "airtel_money" | "bank_transfer";

export default function CheckoutFoodPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const { t } = useI18n();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Payment Details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Promo/Discount
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("eastgate-cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      toast.error("Your cart is empty");
      router.push("/order-food");
    }
  }, [router]);

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const serviceFee = subtotal * 0.1;
  const deliveryFee = orderType === "delivery" ? 2000 : 0;
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal + serviceFee + deliveryFee - discountAmount;

  const handleApplyPromo = () => {
    const promoCodes: Record<string, { discount: number; minAmount: number }> = {
      "WELCOME10": { discount: 10, minAmount: 10000 },
      "FEAST20": { discount: 20, minAmount: 30000 },
      "LUNCH15": { discount: 15, minAmount: 15000 },
      "DINNER25": { discount: 25, minAmount: 50000 },
    };

    const promo = promoCodes[promoCode.toUpperCase()];
    if (promo) {
      if (subtotal >= promo.minAmount) {
        setDiscount(promo.discount);
        setAppliedPromo(promoCode.toUpperCase());
        toast.success(`${promo.discount}% discount applied!`);
      } else {
        toast.error(`Minimum order ${formatCurrency(promo.minAmount)} required`);
      }
    } else {
      toast.error("Invalid promo code");
    }
  };

  const handleRemovePromo = () => {
    setDiscount(0);
    setAppliedPromo(null);
    setPromoCode("");
    toast.success("Promo code removed");
  };

  const validateStep1 = () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!customerPhone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (orderType === "dine_in" && !tableNumber.trim()) {
      toast.error("Please enter table number");
      return false;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please enter delivery address");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (paymentMethod === "card") {
      if (!cardNumber.trim() || cardNumber.length < 16) {
        toast.error("Please enter valid card number");
        return false;
      }
      if (!cardExpiry.trim()) {
        toast.error("Please enter card expiry date");
        return false;
      }
      if (!cardCvv.trim() || cardCvv.length < 3) {
        toast.error("Please enter valid CVV");
        return false;
      }
    }
    if ((paymentMethod === "mtn_mobile" || paymentMethod === "airtel_money") && !mobileNumber.trim()) {
      toast.error("Please enter mobile number");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateStep2()) return;

    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Create order
    const order = {
      id: `ORD-${Date.now()}`,
      customerName,
      customerPhone,
      customerEmail,
      orderType,
      tableNumber: orderType === "dine_in" ? tableNumber : undefined,
      roomNumber: orderType === "dine_in" ? roomNumber : undefined,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
      specialInstructions,
      items: cart,
      subtotal,
      serviceFee,
      deliveryFee,
      discount: discountAmount,
      total,
      paymentMethod,
      promoCode: appliedPromo,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage (in production, this would be an API call)
    const existingOrders = JSON.parse(localStorage.getItem("eastgate-food-orders") || "[]");
    localStorage.setItem("eastgate-food-orders", JSON.stringify([...existingOrders, order]));

    // Clear cart
    localStorage.removeItem("eastgate-cart");

    setProcessing(false);
    setStep(3);
    
    toast.success("Order placed successfully!");
  };

  const orderTypeOptions = [
    {
      id: "dine_in" as OrderType,
      label: "Dine In",
      icon: UtensilsCrossed,
      description: "Eat at the restaurant",
    },
    {
      id: "takeaway" as OrderType,
      label: "Takeaway",
      icon: Store,
      description: "Pick up your order",
    },
    {
      id: "delivery" as OrderType,
      label: "Delivery",
      icon: Truck,
      description: "Delivered to your location",
      fee: "2,000 RWF",
    },
  ];

  const paymentOptions = [
    {
      id: "cash" as PaymentMethod,
      label: "Cash",
      icon: Wallet,
      description: "Pay with cash",
    },
    {
      id: "card" as PaymentMethod,
      label: "Credit/Debit Card",
      icon: CreditCard,
      description: "Visa, Mastercard",
    },
    {
      id: "mtn_mobile" as PaymentMethod,
      label: "MTN Mobile Money",
      icon: Smartphone,
      description: "Pay with MTN MoMo",
    },
    {
      id: "airtel_money" as PaymentMethod,
      label: "Airtel Money",
      icon: Phone,
      description: "Pay with Airtel Money",
    },
    {
      id: "bank_transfer" as PaymentMethod,
      label: "Bank Transfer",
      icon: Building2,
      description: "Transfer to account",
    },
  ];

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-pearl/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-text-muted-custom opacity-20" />
            <h2 className="text-2xl font-heading font-bold text-charcoal mb-2">
              Cart is Empty
            </h2>
            <p className="text-text-muted-custom mb-6">
              Add items to your cart before checking out
            </p>
            <Button asChild className="bg-emerald hover:bg-emerald-dark">
              <Link href="/order-food">Browse Menu</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald/10 via-white to-gold/10 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-2 border-emerald shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="h-20 w-20 rounded-full bg-emerald mx-auto mb-6 flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-heading font-bold text-charcoal mb-2">
                Order Confirmed!
              </h1>
              <p className="text-text-muted-custom mb-8">
                Your order has been successfully placed
              </p>

              <div className="bg-pearl/50 rounded-lg p-6 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-text-muted-custom mb-1">Order Number</p>
                    <p className="font-mono font-bold text-emerald">ORD-{Date.now()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted-custom mb-1">Order Type</p>
                    <p className="font-semibold capitalize">{orderType.replace("_", " ")}</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted-custom">Subtotal</span>
                    <span className="font-semibold">{formatWithCurrency(subtotal, currency.code)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted-custom">Service Fee</span>
                    <span className="font-semibold">{formatWithCurrency(serviceFee, currency.code)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted-custom">Delivery Fee</span>
                      <span className="font-semibold">{formatWithCurrency(deliveryFee, currency.code)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald">
                      <span>Discount ({discount}%)</span>
                      <span className="font-semibold">-{formatWithCurrency(discountAmount, currency.code)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-heading font-semibold">Total Paid</span>
                    <span className="text-2xl font-heading font-bold text-emerald">
                      {formatWithCurrency(total, currency.code)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Estimated Time</p>
                  <p className="text-blue-700">
                    Your order will be {orderType === "delivery" ? "delivered" : "ready"} in approximately{" "}
                    <strong>{orderType === "delivery" ? "45-60" : "20-30"} minutes</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-emerald hover:bg-emerald-dark h-12"
                >
                  <Link href="/order-tracking">
                    Track Order
                    <ChevronRight size={18} className="ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-12"
                >
                  <Link href="/order-food">
                    <Home size={18} className="mr-2" />
                    Back to Menu
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-pearl/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-charcoal via-surface-dark to-charcoal border-b border-gold/20 shadow-lg mb-8">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/order-food" className="flex items-center gap-3">
              <Image
                src="/eastgatelogo.png"
                alt="EastGate Hotel"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
              />
              <div className="hidden sm:block border-l border-white/20 pl-3">
                <h1 className="text-base font-heading font-bold text-white leading-tight">
                  Checkout
                </h1>
                <p className="text-xs text-white/60">Complete your order</p>
              </div>
            </Link>
            
            <Button
              asChild
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Link href="/order-food">
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all",
                    step >= s
                      ? "bg-emerald text-white"
                      : "bg-gray-200 text-gray-400"
                  )}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    className={cn(
                      "h-1 w-24 mx-2 transition-all",
                      step > s ? "bg-emerald" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold text-charcoal">
              {step === 1 ? "Order Details" : "Payment"}
            </h2>
            <p className="text-sm text-text-muted-custom">
              {step === 1 ? "Enter your information" : "Complete your payment"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Order Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5" />
                        Order Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {orderTypeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.id}
                              onClick={() => setOrderType(option.id)}
                              className={cn(
                                "p-4 rounded-lg border-2 transition-all text-left hover:shadow-md",
                                orderType === option.id
                                  ? "border-emerald bg-emerald/5"
                                  : "border-gray-200 hover:border-emerald/50"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-6 w-6 mb-2",
                                  orderType === option.id ? "text-emerald" : "text-gray-400"
                                )}
                              />
                              <div className="font-semibold text-sm mb-1">{option.label}</div>
                              <div className="text-xs text-text-muted-custom">{option.description}</div>
                              {option.fee && (
                                <Badge className="mt-2 bg-gold/10 text-gold border-gold/30">
                                  +{option.fee}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Your Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+250 7XX XXX XXX"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>

                      {orderType === "dine_in" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="table">Table Number *</Label>
                            <Input
                              id="table"
                              value={tableNumber}
                              onChange={(e) => setTableNumber(e.target.value)}
                              placeholder="e.g. T-12"
                            />
                          </div>
                          <div>
                            <Label htmlFor="room">Room Number (Optional)</Label>
                            <Input
                              id="room"
                              value={roomNumber}
                              onChange={(e) => setRoomNumber(e.target.value)}
                              placeholder="e.g. 205"
                            />
                          </div>
                        </div>
                      )}

                      {orderType === "delivery" && (
                        <div>
                          <Label htmlFor="address">Delivery Address *</Label>
                          <Textarea
                            id="address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Street address, building, apartment..."
                            rows={3}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="instructions">Special Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          placeholder="Any special requests or dietary requirements..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="w-full bg-emerald hover:bg-emerald-dark h-12"
                  >
                    Continue to Payment
                    <ChevronRight size={18} className="ml-2" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                        <div className="space-y-3">
                          {paymentOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <div
                                key={option.id}
                                className={cn(
                                  "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer",
                                  paymentMethod === option.id
                                    ? "border-emerald bg-emerald/5"
                                    : "border-gray-200 hover:border-emerald/50"
                                )}
                              >
                                <RadioGroupItem value={option.id} id={option.id} />
                                <Icon
                                  className={cn(
                                    "h-5 w-5",
                                    paymentMethod === option.id ? "text-emerald" : "text-gray-400"
                                  )}
                                />
                                <label htmlFor={option.id} className="flex-1 cursor-pointer">
                                  <div className="font-semibold text-sm">{option.label}</div>
                                  <div className="text-xs text-text-muted-custom">{option.description}</div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </RadioGroup>

                      {/* Payment Details Forms */}
                      {paymentMethod === "card" && (
                        <div className="mt-6 space-y-4">
                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                              id="cardNumber"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                              placeholder="1234 5678 9012 3456"
                              maxLength={16}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input
                                id="expiry"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                placeholder="123"
                                maxLength={3}
                                type="password"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {(paymentMethod === "mtn_mobile" || paymentMethod === "airtel_money") && (
                        <div className="mt-6">
                          <Label htmlFor="mobile">Mobile Number</Label>
                          <Input
                            id="mobile"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="+250 7XX XXX XXX"
                          />
                          <p className="text-xs text-text-muted-custom mt-2">
                            You will receive a prompt on your phone to approve the payment
                          </p>
                        </div>
                      )}

                      {paymentMethod === "bank_transfer" && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm font-semibold mb-2">Bank Transfer Details</p>
                          <div className="space-y-1 text-sm">
                            <p><strong>Bank:</strong> Bank of Kigali</p>
                            <p><strong>Account Name:</strong> EastGate Hotel Ltd</p>
                            <p><strong>Account Number:</strong> 0123-4567-8901-2345</p>
                            <p><strong>SWIFT Code:</strong> BKIGKPRW</p>
                          </div>
                          <p className="text-xs text-blue-700 mt-3">
                            Your order will be confirmed once payment is verified (within 2 hours)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={processing}
                      className="flex-1 bg-emerald hover:bg-emerald-dark h-12"
                    >
                      {processing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          Place Order
                          <Check size={18} className="ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="max-h-60">
                  <div className="space-y-3">
                    {cart.map(({ item, quantity }) => (
                      <div key={item.id} className="flex justify-between gap-2 text-sm">
                        <span className="flex-1">
                          <span className="font-semibold">{quantity}×</span> {item.name}
                        </span>
                        <span className="font-semibold text-emerald">
                          {formatWithCurrency(item.price * quantity, currency.code)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Promo Code */}
                <div>
                  <Label className="text-xs mb-2 flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    Promo Code
                  </Label>
                  {appliedPromo ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald gap-1 flex-1">
                        <Percent size={12} />
                        {appliedPromo} ({discount}% OFF)
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemovePromo}
                        className="h-8 w-8 p-0"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="h-9 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim()}
                        className="bg-gold hover:bg-gold-dark text-charcoal h-9"
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted-custom">Subtotal</span>
                    <span className="font-semibold">{formatWithCurrency(subtotal, currency.code)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted-custom">Service Fee (10%)</span>
                    <span className="font-semibold">{formatWithCurrency(serviceFee, currency.code)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted-custom">Delivery Fee</span>
                      <span className="font-semibold">{formatWithCurrency(deliveryFee, currency.code)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald">
                      <span>Discount ({discount}%)</span>
                      <span className="font-semibold">-{formatWithCurrency(discountAmount, currency.code)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-heading font-semibold text-charcoal">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-heading font-bold text-emerald">
                      {formatWithCurrency(total, currency.code)}
                    </div>
                    {currency.code !== "RWF" && (
                      <div className="text-xs text-text-muted-custom">
                        ≈ {formatCurrency(total)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Security Badge */}
                <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
