"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-1.5 text-white/70 text-xs">
      <Clock className="h-3 w-3" />
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-semibold text-white/90 tabular-nums tracking-tight">
          {hours}:{minutes}
          <span className="text-gold animate-pulse">:</span>
          {seconds}
        </span>
        <span className="hidden sm:inline text-[10px] text-white/50">{dateStr}</span>
      </div>
    </div>
  );
}
