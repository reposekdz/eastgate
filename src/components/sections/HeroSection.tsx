"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  order: number;
  isActive: boolean;
}

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([{
    id: "default",
    title: "Exceptional Hospitality",
    subtitle: "Redefining Luxury in East Africa",
    description: "Immerse yourself in world-class service where every detail is meticulously crafted. Experience hospitality that transcends expectations.",
    imageUrl: images.hero,
    ctaText: "Explore Our Services",
    ctaLink: "/rooms",
    order: 0,
    isActive: true
  }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/hero/slides")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.slides?.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const currentSlide = slides[currentIndex];

  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />
        </motion.div>
      </AnimatePresence>

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

        <AnimatePresence mode="wait">
          <motion.h1
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="heading-xl max-w-4xl text-white mb-6"
          >
            {currentSlide.title}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="body-lg max-w-2xl text-white/80 mb-10"
          >
            {currentSlide.description}
          </motion.p>
        </AnimatePresence>

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
            <a href={currentSlide.ctaLink}>{currentSlide.ctaText}</a>
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

        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all"
              aria-label="Next slide"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? "w-8 bg-gold" : "w-2 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

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
