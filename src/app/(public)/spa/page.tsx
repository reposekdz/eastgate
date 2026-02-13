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
import { spaContent } from "@/lib/kw-data";
import { images } from "@/lib/data";
import { Leaf, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SpaPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.spa})` }}
        >
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="body-sm uppercase tracking-[0.25em] text-gold-light mb-3 font-medium"
          >
            {spaContent.sectionLabel}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {spaContent.title}{" "}
            <span className="italic text-gold-light">{spaContent.titleAccent}</span>
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
            {spaContent.description}
          </motion.p>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Serivisi Zacu
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                Imiti y&apos;Ubuzima
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:gap-8 sm:grid-cols-2">
            {spaContent.services.map((service) => (
              <StaggerItem key={service.name}>
                <Card className="group bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald/10 text-emerald group-hover:bg-emerald group-hover:text-white transition-colors">
                          <Leaf size={18} />
                        </div>
                        <h3 className="font-heading font-semibold text-charcoal text-lg">
                          {service.name}
                        </h3>
                      </div>
                    </div>
                    <p className="body-md text-text-muted-custom mb-5">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="border-emerald/30 text-emerald rounded-[2px]">
                          <Clock size={12} className="mr-1" />
                          {service.duration}
                        </Badge>
                        <span className="font-semibold text-emerald text-lg">
                          {service.price}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Split Content */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <SlideIn direction="left" className="relative h-64 sm:h-80 lg:h-auto">
            <img
              src="https://images.unsplash.com/photo-1649446326998-a16524cfa667?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBob3RlbCUyMGJhdGhyb29tJTIwbWFyYmxlJTIwYmF0aHR1YiUyMHdpdGglMjBmbG93ZXJzfGVufDB8MHx8fDE3NzA5MjAxMjd8MA&ixlib=rb-4.1.0&q=85"
              alt="Ubwiherero bw'ubwiza — Ifoto na Rohit Tandon kuri Unsplash"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-charcoal/10" />
          </SlideIn>

          <div className="bg-surface-dark flex items-center px-6 sm:px-8 py-12 sm:py-16 lg:px-16 lg:py-24">
            <SlideIn direction="right">
              <div>
                <p className="body-sm uppercase tracking-[0.25em] text-gold mb-3 font-medium">
                  Uburambe Bwihariye
                </p>
                <h2 className="heading-md sm:heading-lg text-white mb-6 font-heading">
                  Ahantu h&apos;Amahoro{" "}
                  <span className="italic text-gold-light">n&apos;Ubwiza</span>
                </h2>
                <div className="h-[2px] w-12 bg-gold mb-6" />
                <p className="body-md sm:body-lg text-white/70 mb-8">
                  Spa yacu ni ahantu hihariye aho ushobora gusiga ibibazo byose bya buri munsi. Ibikoresho byacu by&apos;umwimerere hamwe n&apos;abahanga bacu bazagufasha gusubiza imbaraga n&apos;amahoro.
                </p>
                <Button
                  asChild
                  className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm"
                >
                  <Link href="/contact" className="flex items-center gap-2">
                    {spaContent.ctaText}
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>
    </>
  );
}
