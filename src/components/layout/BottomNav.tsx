"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  Home,
  Bed,
  Images,
  Users,
  Menu,
  X,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
  MessageCircle,
} from "lucide-react";

const iconMap = {
  Home,
  Bed,
  Images,
  Users,
  Menu,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
  MessageCircle,
} as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { t, isRw } = useI18n();

  const bottomNavLinks = [
    { label: t("nav", "home"), href: "/", icon: "Home" as const },
    { label: t("nav", "rooms"), href: "/rooms", icon: "Bed" as const },
    { label: t("nav", "gallery"), href: "/gallery", icon: "Images" as const },
    { label: t("nav", "about"), href: "/about", icon: "Users" as const },
    { label: isRw ? "Byose" : "More", href: "#more", icon: "Menu" as const },
  ];

  const moreMenuLinks = [
    { label: t("nav", "dining"), href: "/dining", icon: "UtensilsCrossed" as const },
    { label: isRw ? "Spa n'Ubuzima" : "Spa & Wellness", href: "/spa", icon: "Sparkles" as const },
    { label: t("nav", "events"), href: "/events", icon: "CalendarDays" as const },
    { label: t("nav", "contact"), href: "/contact", icon: "MessageCircle" as const },
  ];

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[998] md:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 z-[999] bg-charcoal rounded-2xl p-4 shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-white font-heading font-semibold text-lg">
                  {isRw ? "Byose" : "More"}
                </h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {moreMenuLinks.map((link) => {
                  const Icon = iconMap[link.icon as keyof typeof iconMap];
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-gold/20 text-gold"
                          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {Icon && <Icon size={20} />}
                      <span className="text-sm font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[997] md:hidden">
        <div className="bg-charcoal/95 backdrop-blur-xl border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around py-2">
            {bottomNavLinks.map((link) => {
              const Icon = iconMap[link.icon as keyof typeof iconMap];
              const isMore = link.href === "#more";
              const isActive = isMore
                ? moreOpen
                : pathname === link.href;

              if (isMore) {
                return (
                  <button
                    key={link.label}
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
                  >
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isActive ? "text-gold" : "text-white/50"
                      }`}
                    >
                      {moreOpen ? <X size={22} /> : <Menu size={22} />}
                    </motion.div>
                    <span
                      className={`text-[10px] font-medium ${
                        isActive ? "text-gold" : "text-white/50"
                      }`}
                    >
                      {link.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? "text-gold" : "text-white/50"
                    }`}
                  >
                    {Icon && <Icon size={22} />}
                  </motion.div>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? "text-gold" : "text-white/50"
                    }`}
                  >
                    {link.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-0.5 w-6 h-0.5 bg-gold rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
