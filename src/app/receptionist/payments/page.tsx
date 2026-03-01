"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [user?.branchId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/payments?branchId=${user?.branchId}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button onClick={fetchPayments}>Refresh</Button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold">{payment.guestName}</h3>
                  <p className="text-2xl font-bold">RWF {payment.amount.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Badge>{payment.method}</Badge>
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.date).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
