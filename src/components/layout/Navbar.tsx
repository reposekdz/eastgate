"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinksKw } from "@/lib/kw-data";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navBg = !isHome || scrolled
    ? "bg-charcoal/95 backdrop-blur-sm shadow-lg"
    : "bg-transparent";

  return (
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
        <div className="hidden items-center gap-6 xl:gap-8 lg:flex">
          {navLinksKw.filter(l => l.href !== "/").map((link) => (
            <Link
              key={link.label}
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
        <div className="hidden lg:block">
          <Button
            asChild
            className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-6 py-2 rounded-[2px] tracking-wide uppercase text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
          >
            <Link href="/rooms">Gufata Icyumba</Link>
          </Button>
        </div>

        {/* Mobile toggle - hidden on mobile (bottom nav replaces it), shown on tablet */}
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
              {navLinksKw.map((link) => (
                <Link
                  key={link.label}
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
                className="bg-gold hover:bg-gold-dark text-charcoal font-semibold mt-2 rounded-[2px] uppercase tracking-wide"
              >
                <Link href="/rooms">Gufata Icyumba</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
