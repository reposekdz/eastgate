"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const status = searchParams.get("status");
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");
    const orderId = searchParams.get("order");

    if (status === "successful" || status === "completed") {
      router.push(`/payment/success?order=${orderId || txRef}&transaction_id=${transactionId}&provider=flutterwave`);
    } else if (status === "cancelled") {
      router.push("/payment/cancel");
    } else {
      router.push(`/payment/success?order=${orderId || txRef}&transaction_id=${transactionId}`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-emerald-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Processing Payment...</h2>
        <p className="text-gray-600 mt-2">Please wait</p>
      </div>
    </div>
  );
}
