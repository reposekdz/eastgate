"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Clock,
  MapPin,
  Bell,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  mockNotifications,
  notificationStyles,
  type HotelNotification,
} from "@/lib/notifications";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState<HotelNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const savedDismissed = localStorage.getItem("eastgate-dismissed-notifs");
    if (savedDismissed) {
      try {
        setDismissed(new Set(JSON.parse(savedDismissed)));
      } catch { /* ignore */ }
    }

    const now = new Date();
    const active = mockNotifications.filter(
      (n) => n.active && new Date(n.expiresAt) > now
    );
    setNotifications(active);
  }, []);

  const visibleNotifications = notifications.filter(
    (n) => !dismissed.has(n.id)
  );

  // Auto-rotate every 6s if not paused
  useEffect(() => {
    if (visibleNotifications.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleNotifications.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [visibleNotifications.length, isPaused]);

  const handleDismiss = useCallback((id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    localStorage.setItem(
      "eastgate-dismissed-notifs",
      JSON.stringify([...newDismissed])
    );
    if (currentIndex >= visibleNotifications.length - 1) {
      setCurrentIndex(0);
    }
  }, [dismissed, currentIndex, visibleNotifications.length]);

  const handleDismissAll = () => {
    setIsVisible(false);
  };

  if (!isVisible || visibleNotifications.length === 0) return null;

  const current = visibleNotifications[currentIndex % visibleNotifications.length];
  if (!current) return null;

  const style = notificationStyles[current.type];

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getExpiresIn = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Expiring soon";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-30 w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={cn(
            "bg-gradient-to-r",
            style.gradient,
            "relative overflow-hidden transition-all duration-500",
            isExpanded ? "shadow-2xl" : "shadow-md"
          )}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-3 sm:py-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Notification Icon — Animated */}
              <motion.div
                className="shrink-0 mt-0.5"
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                key={current.id}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl shadow-lg border border-white/10">
                  {style.icon}
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <motion.h3
                    key={`title-${current.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-heading font-bold text-white text-sm sm:text-base leading-tight"
                  >
                    {current.title}
                  </motion.h3>
                  <Badge className="bg-white/20 text-white/90 text-[10px] border-0 font-medium backdrop-blur-sm">
                    {current.type.charAt(0).toUpperCase() + current.type.slice(1)}
                  </Badge>
                  {current.priority === "high" && (
                    <Badge className="bg-white/30 text-white text-[10px] border-0 gap-0.5 animate-pulse">
                      <Sparkles className="h-2 w-2" />
                      Priority
                    </Badge>
                  )}
                </div>

                <motion.p
                  key={`msg-${current.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "text-white/85 text-xs sm:text-sm leading-relaxed mb-2",
                    isExpanded ? "" : "line-clamp-2"
                  )}
                >
                  {current.message}
                </motion.p>

                {/* Image preview when expanded */}
                <AnimatePresence>
                  {isExpanded && current.imageUrl && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <img
                        src={current.imageUrl}
                        alt={current.title}
                        className="w-full max-w-sm h-32 object-cover rounded-xl border-2 border-white/20 shadow-lg"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 flex-wrap">
                  {current.ctaText && current.ctaLink && (
                    <Link href={current.ctaLink}>
                      <Button
                        size="sm"
                        className="h-7 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 rounded-full px-4 gap-1 transition-all hover:scale-105"
                      >
                        {current.ctaText}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </Link>
                  )}

                  {/* Expand / Collapse */}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-7 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[10px] font-medium transition-all"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>

                  <div className="flex items-center gap-2 text-white/50 text-[10px] ml-auto sm:ml-0">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>{current.branchName}</span>
                    <span className="hidden sm:inline">•</span>
                    <Clock className="hidden sm:inline h-2.5 w-2.5" />
                    <span className="hidden sm:inline">{getTimeAgo(current.createdAt)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-white/40">{getExpiresIn(current.expiresAt)}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {visibleNotifications.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setCurrentIndex(
                          (currentIndex - 1 + visibleNotifications.length) %
                            visibleNotifications.length
                        )
                      }
                      className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-white/60 font-mono min-w-[28px] text-center tabular-nums">
                      {(currentIndex % visibleNotifications.length) + 1}/{visibleNotifications.length}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentIndex(
                          (currentIndex + 1) % visibleNotifications.length
                        )
                      }
                      className="h-7 w-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDismiss(current.id)}
                    className="h-6 w-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110"
                    aria-label="Dismiss this"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {visibleNotifications.length > 1 && (
                    <button
                      onClick={handleDismissAll}
                      className="h-6 px-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-[9px] font-medium transition-all"
                      title="Dismiss all"
                    >
                      All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Progress dots */}
            {visibleNotifications.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {visibleNotifications.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentIndex % visibleNotifications.length
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/30 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
