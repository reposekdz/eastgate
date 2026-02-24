"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { eventsContent } from "@/lib/kw-data";
import { images } from "@/lib/data";
import { useI18n } from "@/lib/i18n/context";
import {
  Heart,
  Briefcase,
  Presentation,
  Wine,
  PartyPopper,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Briefcase,
  Presentation,
  Wine,
  PartyPopper,
};

export default function EventsPage() {
  const { t } = useI18n();
  
  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${images.events})` }}
        >
          <div className="absolute inset-0 bg-charcoal/75" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="body-sm uppercase tracking-[0.25em] text-gold-light mb-3 font-medium"
          >
            {t("events", "sectionLabel")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {t("events", "title")}{" "}
            <span className="italic text-gold-light">{t("events", "titleAccent")}</span>
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-[2px] w-16 bg-gold mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="body-md sm:body-lg text-white/70 max-w-2xl"
          >
            {t("events", "description")}
          </motion.p>
        </div>
      </section>

      {/* Event Types */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Ubwoko bw&apos;Ibirori
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                Dutegura Ibirori Byose
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {eventsContent.types.map((type) => {
              const Icon = iconMap[type.icon];
              return (
                <StaggerItem key={type.name}>
                  <Card className="bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full text-center">
                    <CardContent className="p-5 sm:p-6">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
                        {Icon && <Icon size={24} />}
                      </div>
                      <h3 className="font-heading font-semibold text-charcoal">
                        {type.name}
                      </h3>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Venues */}
      <section className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Ahantu Hacu
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                Ahantu h&apos;Ibirori
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:grid-cols-2">
            {eventsContent.venues.map((venue) => (
              <StaggerItem key={venue.name}>
                <Card className="bg-white hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="font-heading font-semibold text-charcoal text-xl">
                        {venue.name}
                      </h3>
                      <Badge variant="outline" className="border-emerald/30 text-emerald shrink-0 rounded-[2px]">
                        <Users size={12} className="mr-1" />
                        {venue.capacity}
                      </Badge>
                    </div>
                    <p className="body-md text-text-muted-custom">
                      {venue.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="relative min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${images.events})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 to-emerald-dark/80" />
        </div>
        <div className="relative z-10 flex min-h-[400px] items-center justify-center px-4 sm:px-6">
          <FadeInUp>
            <div className="text-center max-w-3xl">
              <div className="mx-auto mb-6 h-[1px] w-16 bg-gold" />
              <h2 className="text-2xl sm:heading-lg text-white mb-6 font-heading font-bold">
                Ugomba Gutegura <span className="italic text-gold-light">Igikorwa?</span>
              </h2>
              <p className="body-md sm:body-lg text-white/70 mb-8">
                Twandikire kandi itsinda ryacu ry&apos;ibirori rizagufasha gutegura igikorwa cyawe.
              </p>
              <Button
                asChild
                className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  {eventsContent.ctaText}
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </FadeInUp>
        </div>
      </section>
    </>
  );
}
