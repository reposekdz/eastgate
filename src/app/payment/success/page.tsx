"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const orderId = searchParams.get("order");
    const transactionId = searchParams.get("transaction_id");
    const provider = searchParams.get("provider");

    if (orderId) {
      verifyPayment(orderId, transactionId, provider);
    }
  }, [searchParams]);

  const verifyPayment = async (orderId: string, transactionId: string | null, provider: string | null) => {
    try {
      const params = new URLSearchParams({ orderId });
      if (transactionId) params.append("transactionId", transactionId);
      if (provider) params.append("provider", provider);

      const response = await fetch(`/api/payments/verify?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayment(data);
      } else {
        setError(data.error || "Payment verification failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Verifying Payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="w-full">Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your transaction has been completed successfully</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-semibold text-gray-900">{payment?.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transaction ID</p>
              <p className="font-semibold text-gray-900 truncate">{payment?.payment?.transactionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-emerald-600 text-xl">
                {payment?.payment?.amount?.toLocaleString()} {payment?.payment?.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize">{payment?.payment?.provider}</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-emerald-800">✓ A confirmation email has been sent to your registered email address</p>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />Download Receipt
          </Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/")}>
            Continue<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
