"use client";

import { useState, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/format";
import {
  CreditCard,
  Shield,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface PayPalPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  description: string;
  guestName: string;
  onSuccess: (transactionId: string) => void;
  onError?: () => void;
}

type PaymentStep = "details" | "processing" | "success";

export default function PayPalPayment({
  open,
  onOpenChange,
  amount,
  description,
  guestName,
  onSuccess,
  onError,
}: PayPalPaymentProps) {
  const { t, isRw } = useI18n();
  const [paypalEmail, setPaypalEmail] = useState("");
  const [step, setStep] = useState<PaymentStep>("details");
  const [progress, setProgress] = useState(0);
  const [transactionId, setTransactionId] = useState("");

  const handlePayment = useCallback(async () => {
    if (!paypalEmail || !paypalEmail.includes("@")) {
      toast.error(isRw ? "Nyamuneka andika imeli ya PayPal yuzuye" : "Please enter a valid PayPal email");
      return;
    }

    setStep("processing");
    setProgress(0);

    // Simulate PayPal processing with realistic progress
    const progressSteps = [10, 25, 40, 55, 70, 85, 95, 100];
    for (const p of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
      setProgress(p);
    }

    // Simulate success (90% of time) or failure
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const txId = `PP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setTransactionId(txId);
      setStep("success");
      toast.success(t("paypal", "paypalSuccess"));
      onSuccess(txId);
    } else {
      setStep("details");
      toast.error(t("paypal", "paypalError"));
      onError?.();
    }
  }, [paypalEmail, isRw, onSuccess, onError, t]);

  const handleClose = () => {
    setStep("details");
    setProgress(0);
    setPaypalEmail("");
    setTransactionId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#0070ba]/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-[#0070ba]" />
            </div>
            {t("paypal", "payWithPaypal")}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-2"
            >
              {/* PayPal branding */}
              <div className="bg-gradient-to-r from-[#0070ba] to-[#003087] rounded-xl p-4 text-white text-center">
                <p className="text-2xl font-bold tracking-wider">PayPal</p>
                <p className="text-xs text-white/70 mt-1">{t("paypal", "paypalSecure")}</p>
              </div>

              {/* Amount */}
              <div className="bg-pearl/50 rounded-lg p-4 text-center">
                <p className="text-xs text-text-muted-custom uppercase">{isRw ? "Igiteranyo cyo Kwishyura" : "Payment Amount"}</p>
                <p className="text-3xl font-bold text-charcoal mt-1">{formatCurrency(amount)}</p>
                <p className="text-xs text-text-muted-custom mt-1">{description}</p>
                <p className="text-xs text-text-muted-custom">{isRw ? "Izina" : "Name"}: {guestName}</p>
              </div>

              {/* PayPal Email */}
              <div>
                <Label className="text-sm font-medium">{t("paypal", "paypalEmail")}</Label>
                <Input
                  type="email"
                  placeholder={t("paypal", "enterPaypalEmail")}
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <p className="text-xs text-text-muted-custom flex items-start gap-2">
                <Shield className="h-4 w-4 text-[#0070ba] shrink-0 mt-0.5" />
                {t("paypal", "paypalDescription")}
              </p>

              <Button
                onClick={handlePayment}
                className="w-full h-12 bg-[#0070ba] hover:bg-[#003087] text-white gap-2 text-base font-semibold"
                disabled={!paypalEmail}
              >
                <Lock className="h-4 w-4" />
                {isRw ? "Ishyura" : "Pay"} {formatCurrency(amount)}
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted-custom">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {isRw ? "Byizewe 256-bit" : "256-bit Encrypted"}
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {isRw ? "Kwishyura Kwizewe" : "Secure Payment"}
                </div>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center space-y-6"
            >
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-[#0070ba]/20" />
                <div className="absolute inset-0 rounded-full border-4 border-[#0070ba] border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-[#0070ba]" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-charcoal text-lg">{t("paypal", "paypalProcessing")}</p>
                <p className="text-sm text-text-muted-custom mt-1">
                  {isRw ? "Nyamuneka tegereza..." : "Please wait..."}
                </p>
              </div>
              <Progress value={progress} className="h-2 w-3/4 mx-auto" />
              <p className="text-xs text-text-muted-custom">{progress}%</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald" />
              </div>
              <div>
                <p className="font-bold text-charcoal text-lg">{t("paypal", "paypalSuccess")}</p>
                <p className="text-sm text-text-muted-custom mt-1">{formatCurrency(amount)}</p>
              </div>
              <div className="bg-pearl/50 rounded-lg p-3 text-sm">
                <p className="text-text-muted-custom">{isRw ? "Nimero y'Ibikorwa" : "Transaction ID"}</p>
                <p className="font-mono font-bold text-charcoal">{transactionId}</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">{isRw ? "PayPal · Byishyuwe" : "PayPal · Paid"}</Badge>
              <Button onClick={handleClose} className="w-full bg-emerald hover:bg-emerald-dark text-white mt-2">
                {isRw ? "Funga" : "Done"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
