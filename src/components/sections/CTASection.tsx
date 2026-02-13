"use client";

import { FadeInUp } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";

export default function CTASection() {
  return (
    <section className="relative min-h-[500px] overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${images.ctaBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-dark/90 to-charcoal/85" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[500px] items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <FadeInUp>
            <div className="mx-auto mb-6 h-[1px] w-16 bg-gold" />
            <h2 className="heading-lg text-white mb-6">
              Begin Your{" "}
              <span className="italic text-gold-light">Journey</span>
            </h2>
            <p className="body-lg text-white/75 mb-10">
              Exclusive rates available for direct bookings. Experience the magic
              of Rwanda from the comfort of unmatched luxury.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-12 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,169,81,0.4)]"
            >
              <a href="#rooms">Book Now — Best Rate Guaranteed</a>
            </Button>
          </FadeInUp>
        </div>
      </div>
    </section>
  );
}
