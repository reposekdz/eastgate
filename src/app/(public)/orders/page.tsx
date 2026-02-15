"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export default function OrdersPage() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600">{t("ordersPage", "loading")}</p>
        </div>
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
      </section>
    </div>
  );
}
