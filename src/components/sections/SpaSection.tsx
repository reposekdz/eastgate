"use client";

import { SlideIn } from "@/components/animations/MotionWrapper";
import { Button } from "@/components/ui/button";
import { images, spaServices } from "@/lib/data";
import { Leaf } from "lucide-react";

export default function SpaSection() {
  return (
    <section id="spa" className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Content */}
        <div className="order-2 lg:order-1 bg-ivory flex items-center px-8 py-16 lg:px-16 lg:py-24">
          <SlideIn direction="left">
            <div>
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                Spa & Wellness
              </p>
              <h2 className="heading-lg text-charcoal mb-6">
                Rejuvenate{" "}
                <span className="italic text-emerald">Your Soul</span>
              </h2>
              <div className="mb-6 h-[2px] w-16 bg-gold" />
              <p className="body-lg text-text-muted-custom mb-8">
                Immerse yourself in tranquility at our full-service spa. Inspired
                by ancient African healing traditions, our treatments use locally
                sourced botanicals to restore balance and vitality.
              </p>

              {/* Services List */}
              <ul className="mb-8 space-y-3">
                {spaServices.map((service) => (
                  <li
                    key={service}
                    className="flex items-center gap-3 body-md text-slate-custom"
                  >
                    <Leaf size={16} className="text-emerald shrink-0" />
                    {service}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="outline"
                className="border-emerald text-emerald hover:bg-emerald hover:text-white rounded-[2px] uppercase tracking-wider text-sm px-8 py-5 transition-all duration-300"
              >
                <a href="#">Book a Treatment</a>
              </Button>
            </div>
          </SlideIn>
        </div>

        {/* Image */}
        <SlideIn
          direction="right"
          className="order-1 lg:order-2 relative h-[500px] lg:h-auto"
        >
          <img
            src={images.spa}
            alt={images.spaAlt}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/10" />
        </SlideIn>
      </div>
    </section>
  );
}
