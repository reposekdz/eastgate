"use client";

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
import { revenueData } from "@/lib/mock-data";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-[8px] border bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-charcoal mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-text-muted-custom capitalize">{entry.name}</span>
          </div>
          <span className="font-medium text-charcoal">
            ${(entry.value / 1000).toFixed(0)}K
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart() {
  return (
    <Card className="py-4 shadow-xs border-transparent">
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-sm font-semibold text-charcoal">Revenue Overview</CardTitle>
        <CardDescription className="text-xs text-text-muted-custom">
          Monthly revenue breakdown by stream
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pt-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRooms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B6E4F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0B6E4F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRestaurant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8A951" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C8A951" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6B6B7B" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6B6B7B" }}
                tickFormatter={(v) => `$${v / 1000}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
              />
              <Area
                type="monotone"
                dataKey="rooms"
                name="Rooms"
                stroke="#0B6E4F"
                strokeWidth={2}
                fill="url(#colorRooms)"
              />
              <Area
                type="monotone"
                dataKey="restaurant"
                name="Restaurant"
                stroke="#C8A951"
                strokeWidth={2}
                fill="url(#colorRestaurant)"
              />
              <Area
                type="monotone"
                dataKey="events"
                name="Events"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#colorEvents)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
