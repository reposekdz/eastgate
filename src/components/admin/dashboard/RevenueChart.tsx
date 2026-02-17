"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAppDataStore } from "@/lib/store/app-data-store";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-[8px] border bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-charcoal mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-muted-custom capitalize">{entry.name}</span>
          </div>
          <span className="font-medium text-charcoal">
            RWF {(entry.value / 1000).toFixed(0)}K
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart() {
  const { bookings, restaurantOrders } = useAppDataStore();

  const chartData = useMemo(() => {
    const byMonth: Record<
      number,
      { month: string; rooms: number; restaurant: number; events: number; spa: number; services: number }
    > = {};
    MONTHS.forEach((m, i) => {
      byMonth[i] = {
        month: m,
        rooms: 0,
        restaurant: 0,
        events: 0,
        spa: 0,
        services: 0,
      };
    });
    bookings.forEach((b) => {
      const monthIdx = new Date(b.checkIn).getMonth();
      if (byMonth[monthIdx]) byMonth[monthIdx].rooms += b.totalAmount;
    });
    restaurantOrders.forEach((o) => {
      const monthIdx = new Date(o.createdAt).getMonth();
      if (byMonth[monthIdx]) byMonth[monthIdx].restaurant += o.total;
    });
    return Object.values(byMonth);
  }, [bookings, restaurantOrders]);

  return (
    <Card className="py-4 shadow-xs border-transparent">
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-sm font-semibold text-charcoal">
          Revenue Overview (real data)
        </CardTitle>
        <CardDescription className="text-xs text-text-muted-custom">
          Revenue from bookings and restaurant orders
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pt-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B6E4F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0B6E4F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRestaurant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-pearl" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="rooms"
                name="Rooms"
                stroke="#0B6E4F"
                fill="url(#colorRooms)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="restaurant"
                name="Restaurant"
                stroke="#D97706"
                fill="url(#colorRestaurant)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
