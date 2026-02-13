"use client";

import { FadeInUp, SlideIn } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";

export default function AboutSection() {
  return (
    <section id="about" className="section-padding bg-ivory">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Text Content */}
          <SlideIn direction="left">
            <div>
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Welcome
              </p>
              <h2 className="heading-lg text-charcoal mb-6">
                Welcome to{" "}
                <span className="text-emerald italic">EastGate</span>
              </h2>
              <div className="mb-6 h-[2px] w-16 bg-gold" />
              <p className="body-lg text-text-muted-custom mb-6">
                A sanctuary of luxury nestled in the breathtaking landscapes of
                Rwanda. Our hotel combines world-class hospitality with authentic
                African warmth, offering an experience that transcends the
                ordinary.
              </p>
              <p className="body-md text-text-muted-custom mb-8">
                Since our founding, we have been committed to providing
                exceptional service that honors Rwanda&apos;s rich culture while
                delivering the sophistication our guests expect.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-emerald text-emerald hover:bg-emerald hover:text-white rounded-[2px] uppercase tracking-wider text-sm px-8 py-5 transition-all duration-300"
              >
                <a href="#rooms">Discover More</a>
              </Button>
            </div>
          </SlideIn>

          {/* Image */}
          <SlideIn direction="right">
            <div className="relative">
              <div className="overflow-hidden rounded-[4px]">
                <img
                  src={images.lobby}
                  alt={images.lobbyAlt}
                  className="h-[500px] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {/* Decorative border offset */}
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-[4px] border-2 border-gold/30" />
            </div>
          </SlideIn>
        </div>
      </div>
    </section>
  );
}
