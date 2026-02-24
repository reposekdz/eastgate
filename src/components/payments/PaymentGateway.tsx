"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Smartphone, Landmark, Globe, Shield, Lock, Loader2, ArrowRight, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaymentGatewayProps {
  amount: number;
  orderId: string;
  onSuccess?: (transactionId: string) => void;
}

export default function PaymentGateway({ amount, orderId, onSuccess }: PaymentGatewayProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("mtn");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleCardPayment = async () => {
    if (!cardNumber || !cardName || !expiry || !cvv) {
      toast.error("Please fill all card details");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount + (amount * 0.029 + 500), orderId, cardNumber, cardName, expiry, cvv }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Payment successful!");
        router.push(`/payment/process?method=card&amount=${amount}&order=${orderId}&tx=${data.transactionId}`);
        onSuccess?.(data.transactionId);
      } else {
        toast.error(data.error || "Payment failed");
      }
    } catch (error) {
      toast.error("Payment processing error");
    } finally {
      setLoading(false);
    }
  };

  const handleMobilePayment = async () => {
    if (!phoneNumber) {
      toast.error("Please enter phone number");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/payments/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount + (amount * 0.01), orderId, phoneNumber, provider: mobileProvider }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Payment request sent to your phone");
        router.push(`/payment/process?method=${mobileProvider}_mobile&amount=${amount}&order=${orderId}`);
      } else {
        toast.error(data.error || "Payment failed");
      }
    } catch (error) {
      toast.error("Payment processing error");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount + (amount * 0.034 + 500), orderId }),
      });
      const data = await response.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        toast.error("PayPal initialization failed");
      }
    } catch (error) {
      toast.error("Payment processing error");
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterwavePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/flutterwave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount + (amount * 0.014), orderId }),
      });
      const data = await response.json();
      if (data.link) {
        window.location.href = data.link;
      } else {
        toast.error("Flutterwave initialization failed");
      }
    } catch (error) {
      toast.error("Payment processing error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Secure Payment</span>
          <Badge className="bg-emerald text-white"><Shield className="h-3 w-3 mr-1" />SSL Encrypted</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="card"><CreditCard className="h-5 w-5" /></TabsTrigger>
            <TabsTrigger value="mobile"><Smartphone className="h-5 w-5" /></TabsTrigger>
            <TabsTrigger value="paypal"><Globe className="h-5 w-5" /></TabsTrigger>
            <TabsTrigger value="flutterwave"><Globe className="h-5 w-5" /></TabsTrigger>
            <TabsTrigger value="bank"><Landmark className="h-5 w-5" /></TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
              <div className="flex justify-between mb-8">
                <CreditCard className="h-10 w-10" />
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-xl font-mono">{cardNumber || "•••• •••• •••• ••••"}</p>
              <div className="flex justify-between mt-6">
                <p className="font-semibold">{cardName || "YOUR NAME"}</p>
                <p className="font-semibold">{expiry || "MM/YY"}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Card Number</Label><Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} /></div>
              <div><Label>Cardholder Name</Label><Input placeholder="JOHN DOE" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} /></div>
              <div><Label>Expiry Date</Label><Input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} maxLength={5} /></div>
              <div><Label>CVV</Label><Input type="password" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} /></div>
            </div>
            <Button onClick={handleCardPayment} disabled={loading} className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Pay RWF {(amount + amount * 0.029 + 500).toFixed(0)} <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant={mobileProvider === "mtn" ? "default" : "outline"} onClick={() => setMobileProvider("mtn")} className="h-20">MTN MoMo</Button>
              <Button variant={mobileProvider === "airtel" ? "default" : "outline"} onClick={() => setMobileProvider("airtel")} className="h-20">Airtel Money</Button>
            </div>
            <div><Label>Phone Number</Label><Input placeholder="+250 7XX XXX XXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></div>
            <Button onClick={handleMobilePayment} disabled={loading} className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-600">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Pay RWF {(amount + amount * 0.01).toFixed(0)} <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4">
            <div className="text-center py-8">
              <Globe className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-bold mb-2">Pay with PayPal</h3>
            </div>
            <Button onClick={handlePayPalPayment} disabled={loading} className="w-full h-12 bg-[#0070BA]">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue to PayPal <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </TabsContent>

          <TabsContent value="flutterwave" className="space-y-4">
            <div className="text-center py-8">
              <Globe className="h-16 w-16 mx-auto mb-4 text-orange-600" />
              <h3 className="text-xl font-bold mb-2">Pay with Flutterwave</h3>
            </div>
            <Button onClick={handleFlutterwavePayment} disabled={loading} className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue to Flutterwave <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Bank Name</Label><Input placeholder="Select your bank" value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
              <div><Label>Account Number</Label><Input placeholder="Your account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
            </div>
            <Button disabled={loading} className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Submit Bank Transfer <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
