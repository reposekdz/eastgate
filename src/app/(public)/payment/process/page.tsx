"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/format";
import {
  Loader2, CheckCircle2, XCircle, CreditCard, Smartphone, Landmark, Globe,
  ArrowLeft, Shield, Clock, Receipt, Download, Share2, Bell, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PaymentStatus = "processing" | "verifying" | "success" | "failed" | "pending";

function PaymentProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const { clearCart } = useCartStore();

  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [progress, setProgress] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [securityCheck, setSecurityCheck] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");

  const paymentMethod = searchParams.get("method") || "mtn_mobile";
  const amount = parseFloat(searchParams.get("amount") || "0");
  const orderRef = searchParams.get("order") || "";

  const paymentMethods = {
    mtn_mobile: {
      name: "MTN Mobile Money",
      icon: Smartphone,
      color: "bg-[#FFCC00]",
      textColor: "text-black",
      instruction: locale === "rw" ? "Emeza kwishyura kuri telefoni yawe MTN" : "Confirm payment on your MTN phone",
      processingTime: "30 seconds",
      fee: amount * 0.01,
    },
    airtel_money: {
      name: "Airtel Money",
      icon: Smartphone,
      color: "bg-[#ED1C24]",
      textColor: "text-white",
      instruction: locale === "rw" ? "Emeza kwishyura kuri telefoni yawe Airtel" : "Confirm payment on your Airtel phone",
      processingTime: "30 seconds",
      fee: amount * 0.01,
    },
    bank_transfer: {
      name: "Bank Transfer",
      icon: Landmark,
      color: "bg-emerald",
      textColor: "text-white",
      instruction: locale === "rw" ? "Kwishyura kwawe kuzarangizwa mu masaha 2" : "Your payment will be processed within 2 hours",
      processingTime: "2 hours",
      fee: 0,
    },
    paypal: {
      name: "PayPal",
      icon: Globe,
      color: "bg-[#003087]",
      textColor: "text-white",
      instruction: locale === "rw" ? "Kwishyura kuri PayPal kuzarangizwa" : "PayPal payment processing",
      processingTime: "1 minute",
      fee: amount * 0.029 + 500,
    },
    credit_card: {
      name: "Credit/Debit Card",
      icon: CreditCard,
      color: "bg-gradient-to-r from-purple-600 to-blue-600",
      textColor: "text-white",
      instruction: locale === "rw" ? "Kwishyura kuri karita kuzarangizwa" : "Card payment processing",
      processingTime: "Instant",
      fee: amount * 0.025,
    },
  };

  const currentMethod = paymentMethods[paymentMethod as keyof typeof paymentMethods] || paymentMethods.mtn_mobile;

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    const txId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setTransactionId(txId);
    setOrderId(orderRef || `ORD-${Date.now()}`);

    // Security check
    setTimeout(() => setSecurityCheck(true), 1000);

    const steps = [
      { progress: 15, delay: 500, status: "processing" as PaymentStatus, time: 25 },
      { progress: 30, delay: 800, status: "processing" as PaymentStatus, time: 20 },
      { progress: 50, delay: 1000, status: "verifying" as PaymentStatus, time: 15 },
      { progress: 70, delay: 1200, status: "verifying" as PaymentStatus, time: 10 },
      { progress: 90, delay: 1500, status: "verifying" as PaymentStatus, time: 5 },
      { progress: 100, delay: 1800, status: "success" as PaymentStatus, time: 0 },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      setProgress(step.progress);
      setStatus(step.status);
      setEstimatedTime(step.time);
    }

    // Generate receipt
    const receipt = `https://eastgate.rw/receipts/${txId}.pdf`;
    setReceiptUrl(receipt);

    setTimeout(() => {
      clearCart();
      toast.success(locale === "rw" ? "Kwishyura byagenze neza!" : "Payment successful!", {
        description: `Transaction ID: ${txId}`,
      });
    }, 500);
  };

  const handleDownloadReceipt = () => {
    toast.success("Receipt downloaded successfully");
  };

  const handleShareReceipt = () => {
    toast.success("Receipt link copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gold-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 shadow-2xl">
        <AnimatePresence mode="wait">
          {(status === "processing" || status === "verifying") && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className={`h-16 w-16 rounded-2xl ${currentMethod.color} ${currentMethod.textColor} flex items-center justify-center shadow-lg`}>
                  <currentMethod.icon className="h-8 w-8" />
                </div>
                <Badge className="bg-emerald text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {estimatedTime}s
                </Badge>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-charcoal mb-2">
                  {status === "processing"
                    ? locale === "rw" ? "Birimo Gutunganya..." : "Processing Payment..."
                    : locale === "rw" ? "Birimo Kugenzura..." : "Verifying Payment..."}
                </h2>
                <p className="text-text-muted-custom">{currentMethod.instruction}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted-custom">Progress</span>
                  <span className="font-semibold text-emerald">{progress}%</span>
                </div>
                <div className="h-3 bg-pearl rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald to-emerald-dark"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Security Check */}
              {securityCheck && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-emerald bg-emerald/10 p-3 rounded-lg"
                >
                  <Shield className="h-4 w-4" />
                  <span>Security verification passed</span>
                </motion.div>
              )}

              {/* Payment Details */}
              <div className="bg-gradient-to-br from-pearl/50 to-gold/10 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted-custom">Amount</span>
                  <span className="text-3xl font-bold text-emerald">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted-custom">Processing Fee</span>
                  <span className="font-semibold">{formatCurrency(currentMethod.fee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-charcoal">{formatCurrency(amount + currentMethod.fee)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald" />
              </div>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="mx-auto h-24 w-24 rounded-full bg-emerald/10 flex items-center justify-center"
              >
                <CheckCircle2 className="h-16 w-16 text-emerald" />
              </motion.div>

              <div className="text-center">
                <h2 className="text-3xl font-bold text-charcoal mb-2">
                  {locale === "rw" ? "Kwishyura Byagenze Neza!" : "Payment Successful!"}
                </h2>
                <p className="text-text-muted-custom">
                  {locale === "rw"
                    ? "Ibyo wafashe byemejwe kandi bizatangwa vuba"
                    : "Your order has been confirmed and will be prepared shortly"}
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-gradient-to-br from-emerald/5 to-gold/5 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-emerald/20">
                  <span className="font-semibold text-charcoal">Transaction Details</span>
                  <Badge className="bg-emerald text-white">Completed</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted-custom">Order ID</span>
                    <span className="font-mono font-semibold text-charcoal">{orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted-custom">Transaction ID</span>
                    <span className="font-mono font-semibold text-charcoal">{transactionId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted-custom">Payment Method</span>
                    <span className="font-semibold text-charcoal">{currentMethod.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted-custom">Date & Time</span>
                    <span className="font-semibold text-charcoal">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="border-t border-emerald/20 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-charcoal">Total Paid</span>
                      <span className="font-bold text-emerald text-xl">{formatCurrency(amount + currentMethod.fee)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownloadReceipt} variant="outline" className="h-11">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button onClick={handleShareReceipt} variant="outline" className="h-11">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={() => router.push("/orders")} className="w-full bg-emerald hover:bg-emerald-dark text-white h-12">
                  <Receipt className="h-4 w-4 mr-2" />
                  {locale === "rw" ? "Reba Ibifashwe" : "View Order"}
                </Button>
                <Button onClick={() => router.push("/")} variant="outline" className="w-full h-12">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === "rw" ? "Subira Ahabanza" : "Back to Home"}
                </Button>
              </div>

              {/* Notification */}
              <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Email confirmation sent</p>
                  <p className="text-blue-700">Check your email for order details and receipt</p>
                </div>
              </div>
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="mx-auto h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-charcoal mb-2">
                  {locale === "rw" ? "Kwishyura Ntibyagenze" : "Payment Failed"}
                </h2>
                <p className="text-text-muted-custom">
                  {locale === "rw" ? "Hari ikibazo cyabaye. Ongera ugerageze." : "Something went wrong. Please try again."}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-900">Common issues:</p>
                  <ul className="list-disc list-inside text-red-700 mt-1">
                    <li>Insufficient balance</li>
                    <li>Network timeout</li>
                    <li>Incorrect PIN entered</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={processPayment} className="w-full bg-emerald hover:bg-emerald-dark text-white h-12">
                  {locale === "rw" ? "Ongera Ugerageze" : "Try Again"}
                </Button>
                <Button onClick={() => router.push("/")} variant="outline" className="w-full h-12">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === "rw" ? "Subira Ahabanza" : "Back to Home"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <PaymentProcessContent />
    </Suspense>
  );
}
