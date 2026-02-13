"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { heroContent, roomsContent, testimonialsKw, ctaContent } from "@/lib/kw-data";
import { images } from "@/lib/data";
import { ChevronDown, ArrowRight, Star, Quote, Bed, UtensilsCrossed, Sparkles, CalendarDays, ImageIcon } from "lucide-react";
import Link from "next/link";

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="group bg-white/5 backdrop-blur-xs border-white/10 hover:bg-white/10 hover:border-gold/30 transition-all duration-500 cursor-pointer h-full">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors">
            <Icon size={24} />
          </div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="body-sm text-white/60">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${images.hero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 sm:px-6 text-center">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6 h-[1px] w-16 bg-gold"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="body-sm sm:body-md mb-4 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gold-light"
          >
            {heroContent.subtitle}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-3xl sm:text-4xl md:heading-xl max-w-4xl text-white mb-6 font-heading font-bold"
          >
            {heroContent.title}{" "}
            <span className="italic text-gold">{heroContent.titleAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="body-md sm:body-lg max-w-2xl text-white/80 mb-10 px-4"
          >
            {heroContent.description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 sm:px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,169,81,0.4)]"
            >
              <Link href="/rooms">{heroContent.ctaPrimary}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/60 text-white bg-white/10 hover:bg-white/20 hover:border-white px-8 sm:px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm backdrop-blur-sm"
            >
              <Link href="/about">{heroContent.ctaSecondary}</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="absolute bottom-10"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <a href="#features" className="text-white/50 hover:text-gold transition-colors">
                <ChevronDown size={32} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Quick Features ─── */}
      <section id="features" className="bg-charcoal py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <StaggerItem>
              <FeatureCard
                icon={Bed}
                title="Ibyumba"
                description="Ibyumba n'amasuite y'ubwiza"
                href="/rooms"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={UtensilsCrossed}
                title="Ibiryo"
                description="Ibiryo byiza by'u Rwanda n'iy'isi"
                href="/dining"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={Sparkles}
                title="Spa"
                description="Imiti n'ubuzima"
                href="/spa"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={CalendarDays}
                title="Ibirori"
                description="Ahantu h'ibirori n'inama"
                href="/events"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={ImageIcon}
                title="Amafoto"
                description="Reba amafoto y'ihoteli"
                href="/gallery"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Rooms Preview ─── */}
      <section className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {roomsContent.sectionLabel}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {roomsContent.title}
              </h2>
              <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {roomsContent.rooms.map((room) => (
              <StaggerItem key={room.id}>
                <div className="group overflow-hidden bg-white rounded-[4px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <div className="relative h-56 sm:h-72 overflow-hidden">
                    <img
                      src={room.image}
                      alt={room.alt}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-5 sm:p-7">
                    <h3 className="heading-sm text-charcoal mb-2">{room.name}</h3>
                    <p className="body-sm sm:body-md text-text-muted-custom mb-4 line-clamp-2">
                      {room.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="body-md font-semibold text-emerald">{room.price}</span>
                      <Button
                        variant="ghost"
                        className="text-gold-dark hover:text-gold hover:bg-transparent p-0 uppercase tracking-wide text-xs font-semibold group/btn"
                        asChild
                      >
                        <Link href="/rooms" className="flex items-center gap-1">
                          {roomsContent.ctaText}
                          <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeInUp delay={0.3}>
            <div className="text-center mt-10">
              <Button
                asChild
                variant="outline"
                className="border-emerald text-emerald hover:bg-emerald hover:text-white rounded-[2px] uppercase tracking-wider text-sm px-8 py-5"
              >
                <Link href="/rooms">Reba Ibyumba Byose</Link>
              </Button>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Ibyo Abashyitsi Bavuga
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                Amagambo y&apos;Abashyitsi
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonialsKw.map((t) => (
              <StaggerItem key={t.id}>
                <div className="bg-white rounded-[4px] p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-500 relative h-full">
                  <Quote size={32} className="text-gold/20 absolute top-6 right-6" fill="currentColor" />
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={16} className="text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="body-sm sm:body-md text-slate-custom mb-6 italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="h-12 w-12 rounded-full object-cover"
                      width={48}
                      height={48}
                    />
                    <div>
                      <p className="body-md font-semibold text-charcoal">{t.name}</p>
                      <p className="body-sm text-text-muted-custom">{t.title}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative min-h-[400px] sm:min-h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${images.ctaBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-dark/90 to-charcoal/85" />
        </div>
        <div className="relative z-10 flex min-h-[400px] sm:min-h-[500px] items-center justify-center px-4 sm:px-6">
          <div className="text-center max-w-3xl">
            <FadeInUp>
              <div className="mx-auto mb-6 h-[1px] w-16 bg-gold" />
              <h2 className="text-2xl sm:heading-lg text-white mb-6 font-heading font-bold">
                {ctaContent.title}{" "}
                <span className="italic text-gold-light">{ctaContent.titleAccent}</span>
              </h2>
              <p className="body-md sm:body-lg text-white/75 mb-10 px-4">
                {ctaContent.description}
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 sm:px-12 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,169,81,0.4)]"
              >
                <Link href="/rooms">{ctaContent.ctaText}</Link>
              </Button>
            </FadeInUp>
          </div>
        </div>
      </section>
    </>
  );
}
