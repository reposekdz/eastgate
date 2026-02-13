"use client";

import { FadeInUp } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { images, eventTypes } from "@/lib/data";

export default function EventsSection() {
  return (
    <section id="events" className="relative min-h-[600px] overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${images.events})` }}
      >
        <div className="absolute inset-0 bg-charcoal/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-padding">
        <div className="mx-auto max-w-3xl text-center">
          <FadeInUp>
            <p className="body-sm uppercase tracking-[0.25em] text-gold mb-3 font-medium">
              Events & Conferences
            </p>
            <h2 className="heading-lg text-white mb-6">
              Exceptional Spaces for{" "}
              <span className="italic text-gold-light">
                Exceptional Occasions
              </span>
            </h2>
            <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            <p className="body-lg text-white/70 mb-10">
              From grand celebrations to intimate corporate retreats, our
              versatile venues and dedicated events team ensure every gathering
              is flawless.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {eventTypes.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="border-gold/50 text-gold-light bg-white/5 px-5 py-2 text-sm tracking-wide backdrop-blur-xs hover:bg-gold/20 transition-all duration-300 rounded-[2px]"
                >
                  {type}
                </Badge>
              ))}
            </div>
          </FadeInUp>

          <FadeInUp delay={0.5}>
            <Button
              asChild
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(200,169,81,0.3)]"
            >
              <a href="#">Plan Your Event</a>
            </Button>
          </FadeInUp>
        </div>
      </div>
    </section>
  );
}
