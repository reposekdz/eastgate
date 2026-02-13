"use client";

import { FadeInUp } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { footerLinksKw, footerContent } from "@/lib/kw-data";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-dark text-white hidden md:block">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-8 lg:px-8">
        <FadeInUp>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="heading-sm text-white mb-4">
                East<span className="text-gold">Gate</span>
              </h3>
              <p className="body-md text-white/60 mb-6 leading-relaxed">
                {footerContent.brand.description}
              </p>
              <div className="h-[2px] w-12 bg-gold/40" />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="body-md font-semibold uppercase tracking-wider text-gold-light mb-6">
                {footerContent.quickLinks}
              </h4>
              <ul className="space-y-3">
                {footerLinksKw.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="body-md text-white/60 hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="body-md font-semibold uppercase tracking-wider text-gold-light mb-6">
                {footerContent.contactTitle}
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-gold shrink-0 mt-0.5" />
                  <span className="body-md text-white/60">
                    KG 7 Ave, Kigali, Rwanda
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-gold shrink-0" />
                  <a
                    href="tel:+250788000000"
                    className="body-md text-white/60 hover:text-gold transition-colors"
                  >
                    +250 788 000 000
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-gold shrink-0" />
                  <a
                    href="mailto:reservations@eastgatehotel.rw"
                    className="body-md text-white/60 hover:text-gold transition-colors"
                  >
                    reservations@eastgatehotel.rw
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="body-md font-semibold uppercase tracking-wider text-gold-light mb-6">
                {footerContent.newsletterTitle}
              </h4>
              <p className="body-md text-white/60 mb-4">
                {footerContent.newsletterDescription}
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2"
              >
                <Input
                  type="email"
                  placeholder={footerContent.emailPlaceholder}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-[2px] focus:border-gold focus:ring-gold"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gold hover:bg-gold-dark text-charcoal rounded-[2px] shrink-0"
                >
                  <ArrowRight size={18} />
                </Button>
              </form>
            </div>
          </div>
        </FadeInUp>

        <Separator className="my-10 bg-white/10" />

        <div className="text-center">
          <p className="body-sm text-white/40">
            {footerContent.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
