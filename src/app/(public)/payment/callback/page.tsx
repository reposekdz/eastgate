"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState("Processing payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get("tx_ref");
      const transactionId = searchParams.get("transaction_id");
      const paymentId = searchParams.get("payment_id");
      const token = searchParams.get("token");

      if (!txRef && !transactionId && !token) {
        setStatus("failed");
        setMessage("Invalid payment reference");
        return;
      }

      try {
        // Update payment status
        const res = await fetch("/api/payments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: paymentId || txRef,
            status: "completed",
            transactionId: transactionId || token,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("Payment successful! Your booking is confirmed.");
        } else {
          setStatus("failed");
          setMessage("Payment verification failed");
        }
      } catch (error) {
        setStatus("failed");
        setMessage("Payment verification error");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal mb-2">Processing Payment</h2>
            <p className="text-text-muted-custom">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">Payment Successful!</h2>
            <p className="text-text-muted-custom mb-6">{message}</p>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Return Home
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">Payment Failed</h2>
            <p className="text-text-muted-custom mb-6">{message}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/book")}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Return Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
