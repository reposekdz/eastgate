"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { Loader2 } from "lucide-react";

export default function OccupancyChart() {
  const { data, loading } = useAdminDashboard();

  if (loading) {
    return (
      <Card className="py-4 shadow-xs border-transparent">
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const occupancyData = data.occupancyData;
  const total = occupancyData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="py-4 shadow-xs border-transparent">
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-sm font-semibold text-charcoal">
          Room Status
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pt-2">
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {occupancyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => [`${value || 0}%`, ""]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  fontSize: "12px",
                  padding: "6px 10px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-charcoal">{total}%</span>
            <span className="text-[10px] text-text-muted-custom uppercase tracking-wider">
              Utilization
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {occupancyData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-text-muted-custom">{item.name}</span>
              <span className="text-xs font-semibold text-charcoal ml-auto">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
