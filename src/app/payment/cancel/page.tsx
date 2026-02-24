"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <XCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">Your payment was cancelled. No charges were made to your account.</p>
        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />Try Again
          </Button>
          <Button className="flex-1" onClick={() => router.push("/")}>Return Home</Button>
        </div>
      </div>
    </div>
  );
}
