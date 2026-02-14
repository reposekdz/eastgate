"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/store/auth-store";
import { useBranchStore } from "@/lib/store/branch-store";
import {
  Grid3X3,
  Users,
  UtensilsCrossed,
  Clock,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";

export default function WaiterTablesPage() {
  const { user } = useAuthStore();
  const { getTables, getOrders } = useBranchStore();
  const branchId = user?.branchId || "br-001";
  const userRole = user?.role || "waiter";

  const tables = getTables(branchId, userRole);
  const orders = getOrders(branchId, userRole);

  const getTableColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 border-emerald-400 hover:border-emerald-500";
      case "occupied":
        return "bg-blue-100 border-blue-400 hover:border-blue-500";
      case "reserved":
        return "bg-purple-100 border-purple-400 hover:border-purple-500";
      case "cleaning":
        return "bg-yellow-100 border-yellow-400 hover:border-yellow-500";
      default:
        return "bg-gray-100 border-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Sparkles className="h-4 w-4 text-emerald-600" />;
      case "occupied":
        return <UtensilsCrossed className="h-4 w-4 text-blue-600" />;
      case "reserved":
        return <CalendarCheck className="h-4 w-4 text-purple-600" />;
      case "cleaning":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const availableCount = tables.filter((t) => t.status === "available").length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const reservedCount = tables.filter((t) => t.status === "reserved").length;
  const cleaningCount = tables.filter((t) => t.status === "cleaning").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="heading-md text-charcoal">Table Map</h1>
          <p className="body-sm text-text-muted-custom mt-1">
            Interactive floor layout &bull; {tables.length} tables
          </p>
        </div>
        <Link href="/waiter/new-order">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" size="sm">
            <UtensilsCrossed className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-emerald-400" />
          <span className="text-sm text-charcoal">
            Available ({availableCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-blue-400" />
          <span className="text-sm text-charcoal">
            Occupied ({occupiedCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-purple-400" />
          <span className="text-sm text-charcoal">
            Reserved ({reservedCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm bg-yellow-400" />
          <span className="text-sm text-charcoal">
            Cleaning ({cleaningCount})
          </span>
        </div>
      </div>

      {/* Table Grid */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => {
            const tableOrder = table.currentOrder
              ? orders.find((o) => o.id === table.currentOrder)
              : null;

            return (
              <Tooltip key={table.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${getTableColor(
                      table.status
                    )}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {getStatusIcon(table.status)}
                        <span className="text-2xl font-bold text-charcoal">
                          {table.number}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-text-muted-custom mb-2">
                        <Users className="h-3 w-3" />
                        {table.seats} seats
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${
                          table.status === "available"
                            ? "border-emerald-400 text-emerald-700"
                            : table.status === "occupied"
                            ? "border-blue-400 text-blue-700"
                            : table.status === "reserved"
                            ? "border-purple-400 text-purple-700"
                            : "border-yellow-400 text-yellow-700"
                        }`}
                      >
                        {table.status}
                      </Badge>
                      {table.guestName && (
                        <p className="text-[11px] text-charcoal font-medium mt-2 truncate">
                          {table.guestName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Table {table.number} &bull; {table.seats} seats
                    </p>
                    <p className="text-xs capitalize">Status: {table.status}</p>
                    {table.guestName && (
                      <p className="text-xs">Guest: {table.guestName}</p>
                    )}
                    {table.waiter && (
                      <p className="text-xs">Waiter: {table.waiter}</p>
                    )}
                    {tableOrder && (
                      <p className="text-xs">
                        Order: {tableOrder.id} ({tableOrder.status})
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Occupied Tables Detail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-amber-600" /> Occupied
            Tables Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables
              .filter((t) => t.status === "occupied")
              .map((table) => {
                const tableOrder = table.currentOrder
                  ? orders.find((o) => o.id === table.currentOrder)
                  : null;
                return (
                  <div
                    key={table.id}
                    className="p-4 rounded-xl border border-blue-200 bg-blue-50/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {table.number}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal">
                            Table {table.number}
                          </p>
                          <p className="text-[11px] text-text-muted-custom">
                            {table.seats} seats
                          </p>
                        </div>
                      </div>
                      {tableOrder && (
                        <Badge
                          className={`text-[10px] ${
                            tableOrder.status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : tableOrder.status === "preparing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {tableOrder.status}
                        </Badge>
                      )}
                    </div>
                    {table.guestName && (
                      <p className="text-xs text-charcoal mb-1">
                        <span className="text-text-muted-custom">Guest:</span>{" "}
                        {table.guestName}
                      </p>
                    )}
                    {table.waiter && (
                      <p className="text-xs text-charcoal mb-1">
                        <span className="text-text-muted-custom">Waiter:</span>{" "}
                        {table.waiter}
                      </p>
                    )}
                    {tableOrder && (
                      <p className="text-xs text-text-muted-custom">
                        {tableOrder.items
                          .map((i) => `${i.quantity}x ${i.name}`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            {tables.filter((t) => t.status === "occupied").length === 0 && (
              <p className="text-sm text-text-muted-custom col-span-full text-center py-4">
                No occupied tables
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
