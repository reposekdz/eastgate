"use client";

import { SlideIn, FadeInUp } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";

export default function DiningSection() {
  return (
    <section id="dining" className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Image */}
        <SlideIn direction="left" className="relative h-[500px] lg:h-auto">
          <img
            src={images.dining}
            alt={images.diningAlt}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/20" />
        </SlideIn>

        {/* Content */}
        <div className="bg-surface-dark flex items-center px-8 py-16 lg:px-16 lg:py-24">
          <SlideIn direction="right">
            <div>
              <p className="body-sm uppercase tracking-[0.25em] text-gold mb-3 font-medium">
                Culinary Excellence
              </p>
              <h2 className="heading-lg text-white mb-6">
                Savor the{" "}
                <span className="italic text-gold-light">Extraordinary</span>
              </h2>
              <div className="mb-6 h-[2px] w-16 bg-gold" />
              <p className="body-lg text-white/70 mb-8">
                Our award-winning chefs blend traditional Rwandan flavors with
                international culinary artistry. From farm-to-table dining at our
                signature restaurant to intimate private dining experiences,
                every meal tells a story.
              </p>
              <Button
                asChild
                className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
              >
                <a href="#">Reserve a Table</a>
              </Button>
            </div>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}
