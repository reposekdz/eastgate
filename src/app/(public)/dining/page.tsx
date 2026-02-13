"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FadeInUp,
  SlideIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { diningContent } from "@/lib/kw-data";
import { images } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";

export default function DiningPage() {
  const categories = [...new Set(diningContent.menuHighlights.map((m) => m.category))];

  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.dining})` }}
        >
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="body-sm uppercase tracking-[0.25em] text-gold-light mb-3 font-medium"
          >
            {diningContent.sectionLabel}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {diningContent.title}{" "}
            <span className="italic text-gold-light">{diningContent.titleAccent}</span>
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-[2px] w-16 bg-gold"
          />
        </div>
      </section>

      {/* About Our Dining */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <SlideIn direction="left">
              <div>
                <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                  {diningContent.sectionLabel}
                </p>
                <h2 className="heading-md sm:heading-lg text-charcoal mb-6 font-heading">
                  Ibiryo Byiza{" "}
                  <span className="italic text-emerald">by&apos;u Rwanda</span>
                </h2>
                <div className="h-[2px] w-12 bg-gold mb-6" />
                <p className="body-md sm:body-lg text-text-muted-custom mb-8">
                  {diningContent.description}
                </p>
                <Button
                  asChild
                  className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300"
                >
                  <Link href="/contact">{diningContent.ctaText}</Link>
                </Button>
              </div>
            </SlideIn>
            <SlideIn direction="right">
              <div className="relative overflow-hidden rounded-[4px]">
                <Image
                  src="https://images.pexels.com/photos/19689229/pexels-photo-19689229.jpeg"
                  alt="Bar n'Lounge — Ifoto na Anthony Rahayel kuri Pexels"
                  width={800}
                  height={600}
                  className="w-full h-64 sm:h-80 lg:h-[450px] object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-[4px] border-2 border-gold/30" />
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Menu
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                Ibyo Twateguye
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          {categories.map((cat) => (
            <div key={cat} className="mb-10 sm:mb-12">
              <FadeInUp>
                <h3 className="heading-sm text-charcoal mb-6 border-b-2 border-gold/20 pb-2 inline-block">
                  {cat}
                </h3>
              </FadeInUp>
              <StaggerContainer className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {diningContent.menuHighlights
                  .filter((m) => m.category === cat)
                  .map((item) => (
                    <StaggerItem key={item.name}>
                      <Card className="bg-white hover:shadow-lg transition-all duration-300 h-full">
                        <CardContent className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h4 className="font-heading font-semibold text-charcoal text-lg">
                              {item.name}
                            </h4>
                            <Badge className="bg-emerald/10 text-emerald shrink-0 rounded-[2px]">
                              {item.price}
                            </Badge>
                          </div>
                          <p className="body-sm text-text-muted-custom">{item.description}</p>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  ))}
              </StaggerContainer>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div
            className="relative h-64 sm:h-80 lg:h-auto bg-cover bg-center"
            style={{ backgroundImage: `url(${images.dining})` }}
          >
            <div className="absolute inset-0 bg-charcoal/30" />
          </div>
          <div className="bg-surface-dark flex items-center px-6 sm:px-8 py-12 sm:py-16 lg:px-16 lg:py-24">
            <FadeInUp>
              <div>
                <p className="body-sm uppercase tracking-[0.25em] text-gold mb-3 font-medium">
                  Gufata Intebe
                </p>
                <h2 className="heading-md sm:heading-lg text-white mb-6 font-heading">
                  Ugomba{" "}
                  <span className="italic text-gold-light">Gufata Intebe?</span>
                </h2>
                <div className="h-[2px] w-12 bg-gold mb-6" />
                <p className="body-md sm:body-lg text-white/70 mb-8">
                  Twandikire kugira ngo ufate intebe mu iresitora yacu. Dufite ahantu heza hawe n&apos;umuryango wawe.
                </p>
                <Button
                  asChild
                  className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm"
                >
                  <Link href="/contact">{diningContent.ctaText}</Link>
                </Button>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>
    </>
  );
}
