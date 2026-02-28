"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const bookingId = searchParams.get("bookingId");
  const paymentIntent = searchParams.get("payment_intent");

  useEffect(() => {
    async function verifyPayment() {
      if (!paymentIntent || !bookingId) {
        setStatus("error");
        return;
      }

      try {
        // Update payment status
        const res = await fetch("/api/payments/public", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: bookingId,
            status: "completed",
            transactionId: paymentIntent,
            gatewayRef: paymentIntent,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
      }
    }

    verifyPayment();
  }, [paymentIntent, bookingId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-xl text-slate-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-charcoal mb-3">Payment Failed</h2>
          <p className="text-slate-600 mb-6">
            We couldn't verify your payment. Please contact support if you were charged.
          </p>
          <Button
            onClick={() => router.push("/book")}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-charcoal mb-3">Payment Successful!</h2>
        <p className="text-slate-600 mb-6">
          Your booking has been confirmed. Check your email for details.
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Return to Home
          </Button>
          <Button
            onClick={() => router.push("/rooms")}
            variant="outline"
            className="w-full"
          >
            Explore More Rooms
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
