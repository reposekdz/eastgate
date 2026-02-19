"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, UtensilsCrossed, Search, Globe, Clock, Bell, User, ShoppingCart, Heart, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { languageNames, languageFlags } from "@/lib/i18n/multi-lang-translations";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Booking Confirmed", message: "Your room reservation for Dec 25 is confirmed", time: "2m ago", read: false, type: "success" },
    { id: 2, title: "Special Offer", message: "Get 20% off on spa services this weekend", time: "1h ago", read: false, type: "info" },
    { id: 3, title: "Order Ready", message: "Your food order #1234 is ready for pickup", time: "3h ago", read: true, type: "success" },
  ]);
  const [cartCount] = useState(2);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mainNavLinks = useMemo(() => [
    { label: t("nav", "about"), href: "/about" },
    { label: t("nav", "rooms"), href: "/rooms" },
    { label: t("nav", "dining"), href: "/dining" },
    { label: t("nav", "viewMenu"), href: "/menu" },
    { label: t("nav", "spa"), href: "/spa" },
    { label: t("nav", "events"), href: "/events" },
    { label: t("nav", "gallery"), href: "/gallery" },
    { label: "FAQ", href: "/#faq" },
    { label: t("nav", "contact"), href: "/contact" },
  ], [t, locale]);

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
        <div className="border-b border-white/10 py-1 md:py-1 hidden md:block">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 lg:gap-4">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-xs lg:max-w-md">
              <Search className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 h-3.5 lg:h-4 w-3.5 lg:w-4 text-white/50" />
              <Input
                placeholder={t("common", "search") || "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 lg:pl-10 h-8 lg:h-9 text-xs lg:text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </form>
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-1.5 lg:gap-2 text-white/70 text-xs lg:text-sm">
                <Clock className="h-3.5 lg:h-4 w-3.5 lg:w-4" />
                <span>{currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</span>
              </div>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="w-28 lg:w-40 h-8 lg:h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors text-xs lg:text-sm">
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <Globe className="h-3.5 lg:h-4 w-3.5 lg:w-4" />
                    <span className="truncate">{languageFlags[locale]} <span className="hidden lg:inline">{languageNames[locale]}</span><span className="lg:hidden">{locale.toUpperCase()}</span></span>
                  </div>
                </SelectTrigger>
                <SelectContent className="z-[9999] bg-white border shadow-lg" position="popper" sideOffset={5}>
                  <SelectItem value="en">{languageFlags.en} {languageNames.en}</SelectItem>
                  <SelectItem value="rw">{languageFlags.rw} {languageNames.rw}</SelectItem>
                  <SelectItem value="fr">{languageFlags.fr} {languageNames.fr}</SelectItem>
                  <SelectItem value="sw">{languageFlags.sw} {languageNames.sw}</SelectItem>
                  <SelectItem value="es">{languageFlags.es} {languageNames.es}</SelectItem>
                  <SelectItem value="de">{languageFlags.de} {languageNames.de}</SelectItem>
                  <SelectItem value="zh">{languageFlags.zh} {languageNames.zh}</SelectItem>
                  <SelectItem value="ar">{languageFlags.ar} {languageNames.ar}</SelectItem>
                  <SelectItem value="pt">{languageFlags.pt} {languageNames.pt}</SelectItem>
                  <SelectItem value="ja">{languageFlags.ja} {languageNames.ja}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-4 sm:py-2 lg:px-8 lg:py-3">
          {/* Mobile Header - Logo + Interactive Icons */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Image 
                src="/eastgatelogo.png" 
                alt="EastGate Hotel" 
                width={150} 
                height={60}
                className="h-8 sm:h-9 md:h-10 lg:h-14 xl:h-16 w-auto object-contain drop-shadow-lg rounded-xl"
                priority
              />
            </Link>

            {/* Mobile Interactive Icons */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Search Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className="relative h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
              >
                <Search className="w-4 h-4" />
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] border-2 border-charcoal">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </motion.button>

              {/* Cart */}
              <Link href="/orders">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="relative h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald text-white text-[10px] border-2 border-charcoal">
                      {cartCount}
                    </Badge>
                  )}
                </motion.button>
              </Link>

              {/* Language Selector */}
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="min-w-[44px] h-9 bg-white/10 border-white/20 text-white px-2 hover:bg-white/20 transition-colors rounded-lg flex items-center justify-center">
                  <span className="text-base leading-none">{languageFlags[locale]}</span>
                </SelectTrigger>
                <SelectContent className="z-[9999] bg-white border shadow-lg min-w-[120px]" position="popper" sideOffset={5}>
                  <SelectItem value="en"><span className="text-base">{languageFlags.en}</span> EN</SelectItem>
                  <SelectItem value="rw"><span className="text-base">{languageFlags.rw}</span> RW</SelectItem>
                  <SelectItem value="fr"><span className="text-base">{languageFlags.fr}</span> FR</SelectItem>
                  <SelectItem value="sw"><span className="text-base">{languageFlags.sw}</span> SW</SelectItem>
                  <SelectItem value="es"><span className="text-base">{languageFlags.es}</span> ES</SelectItem>
                  <SelectItem value="de"><span className="text-base">{languageFlags.de}</span> DE</SelectItem>
                  <SelectItem value="zh"><span className="text-base">{languageFlags.zh}</span> ZH</SelectItem>
                  <SelectItem value="ar"><span className="text-base">{languageFlags.ar}</span> AR</SelectItem>
                  <SelectItem value="pt"><span className="text-base">{languageFlags.pt}</span> PT</SelectItem>
                  <SelectItem value="ja"><span className="text-base">{languageFlags.ja}</span> JA</SelectItem>
                </SelectContent>
              </Select>

              {/* User Profile */}
              <Link href="/login">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="h-9 w-9 rounded-lg bg-gradient-to-br from-gold to-gold-dark backdrop-blur-sm flex items-center justify-center text-charcoal hover:from-gold-dark hover:to-gold transition-all border border-gold-light shadow-lg shadow-gold/30"
                >
                  <User className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1.5 lg:gap-2 xl:gap-3 lg:flex flex-wrap justify-start">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[10px] lg:text-xs xl:text-sm transition-colors duration-300 font-medium tracking-wide uppercase whitespace-nowrap px-0.5 lg:px-1 ${
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
          <div className="hidden lg:flex items-center gap-1 xl:gap-1 flex-shrink-0">
            <Button
              asChild
              className="bg-emerald hover:bg-emerald-dark text-white font-semibold px-1.5 lg:px-2 py-1 rounded-[2px] tracking-wide uppercase text-[8px] lg:text-[9px] xl:text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(11,110,79,0.3)] gap-0.5 whitespace-nowrap h-7 lg:h-8"
            >
              <Link href="/menu" className="flex items-center gap-0.5">
                <UtensilsCrossed className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                <span className="hidden xl:inline">{t("nav", "orderFood")}</span>
                <span className="xl:hidden">{t("nav", "order") || "Order"}</span>
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-1.5 lg:px-2 py-1 rounded-[2px] tracking-wide uppercase text-[8px] lg:text-[9px] xl:text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(200,169,81,0.3)] whitespace-nowrap h-7 lg:h-8"
            >
              <Link href="/book">{t("nav", "bookRoom")}</Link>
            </Button>
            {pathname === "/" && (
              <Button
                asChild
                className="bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal font-bold px-3 lg:px-4 xl:px-8 py-1.5 lg:py-1.5 xl:py-2.5 rounded-full tracking-wide uppercase text-[9px] lg:text-[10px] xl:text-sm transition-all duration-300 hover:shadow-[0_0_25px_rgba(200,169,81,0.5)] hover:scale-105 border-2 border-gold-light whitespace-nowrap h-8 lg:h-8 xl:h-10"
              >
                <Link href="/login">{t("auth", "signIn")}</Link>
              </Button>
            )}
          </div>

          {/* Mobile: order button + language */}
          <div className="hidden items-center gap-1.5 sm:gap-2 lg:hidden">
          </div>
        </nav>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden bg-charcoal/98 backdrop-blur-xl border-t border-white/10 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">Search</h3>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  className="text-xs text-white/60 hover:text-white px-3 py-1 bg-white/10 rounded-full transition-colors"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Search rooms, dining, spa, events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="pl-10 pr-20 h-11 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white px-2 py-1 bg-white/10 rounded-md text-xs"
                  >
                    Clear
                  </button>
                )}
              </form>
              {/* Quick Search Suggestions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['Rooms', 'Dining', 'Spa', 'Events'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSearchQuery(item);
                      handleSearch(new Event('submit') as any);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 text-xs rounded-full transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Panel */}
        <AnimatePresence>
          {notificationOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
                onClick={() => setNotificationOpen(false)}
              />
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-charcoal/98 backdrop-blur-xl border-l border-white/10 z-[61] lg:hidden overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div>
                    <h3 className="text-white font-heading font-semibold text-lg">Notifications</h3>
                    <p className="text-white/60 text-xs mt-0.5">{notifications.filter(n => !n.read).length} unread</p>
                  </div>
                  <button
                    onClick={() => setNotificationOpen(false)}
                    className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                  <button
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                    className="text-xs text-emerald hover:text-emerald-light font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                  <span className="text-white/30">•</span>
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Bell className="h-12 w-12 text-white/20 mb-3" />
                      <p className="text-white/60 text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {notifications.map((notif, idx) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                            !notif.read
                              ? "bg-white/10 border-white/20 hover:bg-white/15"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                          onClick={() => {
                            setNotifications(notifications.map(n => 
                              n.id === notif.id ? { ...n, read: true } : n
                            ));
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                              !notif.read ? "bg-emerald" : "bg-white/20"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-semibold mb-1">{notif.title}</h4>
                              <p className="text-white/70 text-xs leading-relaxed">{notif.message}</p>
                              <p className="text-white/40 text-[10px] mt-1.5">{notif.time}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(notifications.filter(n => n.id !== notif.id));
                              }}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md bg-white/10 hover:bg-red-500/20 flex items-center justify-center text-white/60 hover:text-red-400 transition-all"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Quick Info Bar */}
        <div className="lg:hidden bg-gradient-to-r from-emerald/10 to-gold/10 border-t border-white/10 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>Kigali, Rwanda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              <span>+250 788 123 456</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</span>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Slide-down Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-gradient-to-b from-charcoal via-charcoal/98 to-charcoal/95 backdrop-blur-xl px-6 pb-6 lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="flex flex-col gap-2 pt-4 w-full max-w-sm mx-auto">
                {mainNavLinks.map((link, idx) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl border transition-all duration-300 w-full ${
                        pathname === link.href
                          ? "bg-gold/20 border-gold text-gold shadow-lg shadow-gold/20"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 hover:text-gold"
                      }`}
                    >
                      <span className="font-medium tracking-wide uppercase text-sm">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mainNavLinks.length * 0.05 + 0.1 }}
                  className="space-y-2 mt-4 pt-4 border-t border-white/10"
                >
                  <Button
                    asChild
                    className="w-full bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-xl uppercase tracking-wide gap-2 h-12 shadow-lg hover:shadow-emerald/30 transition-all duration-300"
                  >
                    <Link href="/menu">
                      <UtensilsCrossed size={18} />
                      {t("nav", "orderFood")}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-xl uppercase tracking-wide h-12 shadow-lg hover:shadow-gold/30 transition-all duration-300"
                  >
                    <Link href="/book">{t("nav", "bookRoom")}</Link>
                  </Button>
                  {pathname === "/" && (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-charcoal font-bold rounded-xl uppercase tracking-wide h-12 border-2 border-gold-light shadow-lg hover:shadow-gold/40 transition-all duration-300"
                    >
                      <Link href="/login">{t("auth", "signIn")}</Link>
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
