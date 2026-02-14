"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuOrderDialog, type CartItem } from "@/components/MenuOrderDialog";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMenuOrder, setShowMenuOrder] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t, isRw } = useI18n();

  const navLinks = [
    { label: t("nav", "about"), href: "/about" },
    { label: t("nav", "rooms"), href: "/rooms" },
    { label: t("nav", "dining"), href: "/dining" },
    { label: t("nav", "viewMenu"), href: "/menu" },
    { label: t("nav", "spa"), href: "/spa" },
    { label: t("nav", "events"), href: "/events" },
    { label: t("nav", "gallery"), href: "/gallery" },
    { label: isRw ? "FAQ" : "FAQ", href: "/#faq" },
    { label: t("nav", "contact"), href: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navBg = !isHome || scrolled
    ? "bg-charcoal/95 backdrop-blur-sm shadow-lg"
    : "bg-transparent";

  const totalCartItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-heading font-bold text-white tracking-wider">
              East<span className="text-gold">Gate</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-5 xl:gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`body-sm transition-colors duration-300 font-medium tracking-wide uppercase ${
                  pathname === link.href
                    ? "text-gold"
                    : "text-white/80 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Desktop + Language */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher variant="pill" />
            {/* Give Order Button */}
            <Button
              onClick={() => setShowMenuOrder(true)}
              className="bg-emerald hover:bg-emerald-dark text-white font-semibold px-4 py-2 rounded-[2px] tracking-wide uppercase text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(11,110,79,0.3)] gap-2 relative"
            >
              <UtensilsCrossed size={16} />
              {t("nav", "orderFood")}
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gold text-charcoal text-[10px] font-bold flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </Button>
            <Button
              asChild
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-6 py-2 rounded-[2px] tracking-wide uppercase text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
            >
              <Link href="/book">{t("nav", "bookRoom")}</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white lg:hidden hidden md:block"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>

        {/* Tablet Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-charcoal/98 backdrop-blur-md px-6 pb-6 lg:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`body-md py-2.5 border-b border-white/10 uppercase tracking-wide transition-colors ${
                      pathname === link.href
                        ? "text-gold"
                        : "text-white/80 hover:text-gold"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex items-center gap-3 pt-2">
                  <LanguageSwitcher variant="pill" />
                </div>
                {/* Mobile Order Button */}
                <Button
                  onClick={() => { setShowMenuOrder(true); setMobileOpen(false); }}
                  className="bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-[2px] uppercase tracking-wide gap-2 relative"
                >
                  <UtensilsCrossed size={16} />
                  {t("nav", "orderFood")}
                  {totalCartItems > 0 && (
                    <span className="ml-1 h-5 w-5 rounded-full bg-gold text-charcoal text-[10px] font-bold flex items-center justify-center">
                      {totalCartItems}
                    </span>
                  )}
                </Button>
                <Button
                  asChild
                  className="bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[2px] uppercase tracking-wide"
                >
                  <Link href="/book">{t("nav", "bookRoom")}</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Menu Order Dialog */}
      <MenuOrderDialog
        open={showMenuOrder}
        onOpenChange={setShowMenuOrder}
        cart={cart}
        onUpdateCart={setCart}
      />
    </>
  );
}
