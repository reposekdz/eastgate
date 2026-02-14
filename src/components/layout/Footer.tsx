"use client";

import { useState } from "react";
import { FadeInUp } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { MapPin, Phone, Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Simple in-memory subscriber store
const subscribers = new Set<string>();

export default function Footer() {
  const { t, isRw } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const footerLinks = [
    { label: t("footer", "about"), href: "/about" },
    { label: t("footer", "roomsSuites"), href: "/rooms" },
    { label: t("footer", "diningLink"), href: "/dining" },
    { label: t("footer", "spaWellness"), href: "/spa" },
    { label: t("footer", "eventsLink"), href: "/events" },
    { label: t("footer", "galleryLink"), href: "/gallery" },
    { label: t("footer", "contactLink"), href: "/contact" },
  ];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@") || !email.includes(".")) {
      toast.error(t("newsletter", "subscribeError"));
      return;
    }

    if (subscribers.has(email.toLowerCase())) {
      toast.info(t("newsletter", "alreadySubscribed"));
      return;
    }

    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    subscribers.add(email.toLowerCase());
    setSubscribed(true);
    setLoading(false);
    toast.success(t("newsletter", "subscribeSuccess"));

    // Reset after a few seconds
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 3000);
  };

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
                {t("footer", "brandDesc")}
              </p>
              <div className="h-[2px] w-12 bg-gold/40" />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="body-md font-semibold uppercase tracking-wider text-gold-light mb-6">
                {t("footer", "quickLinks")}
              </h4>
              <ul className="space-y-3">
                {footerLinks.map((link) => (
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
                {t("footer", "contactTitle")}
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

            {/* Newsletter — Fully Functional */}
            <div>
              <h4 className="body-md font-semibold uppercase tracking-wider text-gold-light mb-6">
                {t("footer", "newsletterTitle")}
              </h4>
              <p className="body-md text-white/60 mb-4">
                {t("footer", "newsletterDesc")}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("footer", "emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || subscribed}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-[2px] focus:border-gold focus:ring-gold"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || subscribed}
                    className={`rounded-[2px] shrink-0 transition-all ${
                      subscribed
                        ? "bg-emerald hover:bg-emerald-dark text-white"
                        : "bg-gold hover:bg-gold-dark text-charcoal"
                    }`}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : subscribed ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </Button>
                </div>
                {subscribed && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("newsletter", "subscribeSuccess")}
                  </p>
                )}
              </form>
            </div>
          </div>
        </FadeInUp>

        <Separator className="my-10 bg-white/10" />

        <div className="text-center">
          <p className="body-sm text-white/40">
            {t("footer", "copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
