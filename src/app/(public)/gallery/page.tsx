"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { galleryContent } from "@/lib/kw-data";
import { images } from "@/lib/data";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("byose");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const filteredImages =
    activeCategory === "byose"
      ? galleryContent.images
      : galleryContent.images.filter((img) => img.category === activeCategory);

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  const navigateLightbox = (dir: number) => {
    setLightboxIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return filteredImages.length - 1;
      if (next >= filteredImages.length) return 0;
      return next;
    });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.pool})` }}
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
            {galleryContent.sectionLabel}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {galleryContent.title}{" "}
            <span className="italic text-gold">{galleryContent.titleAccent}</span>
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
            className="body-md text-white/70 max-w-xl"
          >
            {galleryContent.description}
          </motion.p>
        </div>
      </section>

      {/* Gallery */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          {/* Category Filter */}
          <FadeInUp>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
              {galleryContent.categories.map((cat) => (
                <Button
                  key={cat.key}
                  variant={activeCategory === cat.key ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`rounded-full px-5 sm:px-6 py-2 text-sm transition-all duration-300 ${
                    activeCategory === cat.key
                      ? "bg-emerald text-white hover:bg-emerald-dark"
                      : "border-emerald/30 text-emerald hover:bg-emerald/10"
                  }`}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </FadeInUp>

          {/* Grid */}
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredImages.map((img, idx) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className={`relative group cursor-pointer overflow-hidden rounded-[4px] ${
                    idx % 5 === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                  }`}
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                      idx % 5 === 0 ? "h-48 sm:h-full" : "h-40 sm:h-56"
                    }`}
                  />
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/50 transition-all duration-500 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                      <ZoomIn
                        size={28}
                        className="text-white mx-auto mb-2"
                      />
                      <p className="text-white font-heading font-semibold text-sm sm:text-base px-2">
                        {img.title}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && filteredImages[lightboxIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={28} />
            </button>

            {/* Prev */}
            <button
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(-1);
              }}
            >
              <ChevronLeft size={36} />
            </button>

            {/* Next */}
            <button
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10 p-2"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox(1);
              }}
            >
              <ChevronRight size={36} />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="max-w-[90vw] max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredImages[lightboxIdx].src}
                alt={filteredImages[lightboxIdx].alt}
                className="max-w-full max-h-[75vh] object-contain rounded-[4px]"
              />
              <div className="text-center mt-4">
                <p className="text-white font-heading font-semibold text-lg">
                  {filteredImages[lightboxIdx].title}
                </p>
                <p className="text-white/50 body-sm mt-1">
                  {lightboxIdx + 1} / {filteredImages.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
