"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency, formatDate } from "@/lib/format";

export default function OrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestEmail, setGuestEmail] = useState("");

  useEffect(() => {
    // Get guest email from localStorage or session
    const email = localStorage.getItem("guestEmail");
    if (email) {
      setGuestEmail(email);
      fetchOrders(email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (email: string) => {
    try {
      const res = await fetch(`/api/orders?guestEmail=${email}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "preparing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      case "served": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative h-[30vh] overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl sm:text-4xl text-white font-bold mb-2">
            {t("ordersPage", "yourOrders")} <span className="text-yellow-500">{t("ordersPage", "ordersAccent")}</span>
          </h1>
          <p className="text-sm text-gray-300">
            {t("ordersPage", "trackOrders")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t("ordersPage", "noOrdersYet")}
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t("ordersPage", "noOrdersDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                  <Link href="/menu">
                    <Package className="mr-2 h-4 w-4" />
                    {t("ordersPage", "orderFood")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/book">
                    <Clock className="mr-2 h-4 w-4" />
                    {t("ordersPage", "bookARoom")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4 flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
