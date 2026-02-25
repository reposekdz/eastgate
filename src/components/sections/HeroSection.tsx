"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
}

export default function HeroSection() {
  const [heroData, setHeroData] = useState<HeroData>({
    title: "Exceptional Hospitality",
    subtitle: "Redefining Luxury in East Africa",
    description: "Immerse yourself in world-class service where every detail is meticulously crafted. Experience hospitality that transcends expectations.",
    imageUrl: images.hero,
    ctaText: "Explore Our Services",
    ctaLink: "/rooms",
  });

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setHeroData({ ...data.data, imageUrl: data.data.imageUrl || images.hero });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroData.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
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
          className="body-md mb-4 uppercase tracking-[0.3em] text-gold-light"
        >
          EastGate Hotel &middot; Rwanda
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="heading-xl max-w-4xl text-white mb-6"
        >
          {heroData.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="body-lg max-w-2xl text-white/80 mb-10"
        >
          {heroData.description}
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
            className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,169,81,0.4)]"
          >
            <a href={heroData.ctaLink}>{heroData.ctaText}</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="bg-emerald hover:bg-emerald-dark text-white border-emerald hover:border-emerald-dark px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm backdrop-blur-xs"
          >
            <a href="#about">Discover More</a>
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
            <a
              href="#about"
              className="text-white/50 hover:text-gold transition-colors"
              aria-label="Scroll down"
            >
              <ChevronDown size={32} />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
