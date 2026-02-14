"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, UtensilsCrossed, Search, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { label: t("nav", "about"), href: "/about" },
    { label: t("nav", "rooms"), href: "/rooms" },
    { label: t("nav", "dining"), href: "/dining" },
    { label: t("nav", "viewMenu"), href: "/menu" },
    { label: t("nav", "spa"), href: "/spa" },
    { label: t("nav", "events"), href: "/events" },
    { label: t("nav", "gallery"), href: "/gallery" },
    { label: "FAQ", href: "/#faq" },
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
      >
        {/* Top Bar with Search, Time, Language */}
        <div className="border-b border-white/10 py-2 hidden lg:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                placeholder="Search rooms, dining, spa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </form>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="w-32 h-9 bg-white/10 border-white/20 text-white">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="rw">Kinyarwanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Menu Icon (always visible on mobile/tablet) + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile/Tablet hamburger - always visible below lg */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>

            {/* Logo - always visible */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-heading font-bold text-white tracking-wider">
                East<span className="text-gold">Gate</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-4 xl:gap-6 lg:flex">
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

          {/* CTA Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              asChild
              className="bg-emerald hover:bg-emerald-dark text-white font-semibold px-4 py-2 rounded-[2px] tracking-wide uppercase text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(11,110,79,0.3)] gap-2"
            >
              <Link href="/order-food">
                <UtensilsCrossed size={16} />
                Order Food
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-6 py-2 rounded-[2px] tracking-wide uppercase text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
            >
              <Link href="/book">{t("nav", "bookRoom")}</Link>
            </Button>
            {pathname === "/" && (
              <Button
                asChild
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-2 rounded-[2px] tracking-wide uppercase text-sm"
              >
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile: order button + language */}
          <div className="flex items-center gap-2 lg:hidden">
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger className="w-16 h-8 bg-white/10 border-white/20 text-white p-1">
                <Globe className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="rw">RW</SelectItem>
              </SelectContent>
            </Select>
            <Button
              asChild
              size="sm"
              className="bg-emerald hover:bg-emerald-dark text-white rounded-[2px] gap-1 h-8 px-2.5 text-xs"
            >
              <Link href="/order-food">
                <UtensilsCrossed size={14} />
                <span className="hidden sm:inline">Order Food</span>
              </Link>
            </Button>
          </div>
        </nav>

        {/* Mobile/Tablet Slide-down Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-charcoal/98 backdrop-blur-md px-6 pb-6 lg:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-2">
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
                <Button
                  asChild
                  className="bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-[2px] uppercase tracking-wide gap-2 mt-2"
                >
                  <Link href="/order-food">
                    <UtensilsCrossed size={16} />
                    Order Food
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[2px] uppercase tracking-wide"
                >
                  <Link href="/book">{t("nav", "bookRoom")}</Link>
                </Button>
                {pathname === "/" && (
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 font-semibold rounded-[2px] uppercase tracking-wide"
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
