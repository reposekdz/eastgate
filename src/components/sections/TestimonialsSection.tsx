"use client";

import {
  StaggerContainer,
  StaggerItem,
  FadeInUp,
} from "@/components/animations/MotionWrapper";
import { testimonials } from "@/lib/data";
import { Star, Quote } from "lucide-react";

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[number];
}) {
  return (
    <div className="bg-white rounded-[4px] p-8 shadow-sm hover:shadow-lg transition-all duration-500 relative">
      {/* Quote Icon */}
      <Quote
        size={32}
        className="text-gold/20 absolute top-6 right-6"
        fill="currentColor"
      />

      {/* Stars */}
      <div className="flex gap-1 mb-5">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className="text-gold fill-gold"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="body-md text-slate-custom mb-6 italic leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="h-12 w-12 rounded-full object-cover"
          width={48}
          height={48}
        />
        <div>
          <p className="body-md font-semibold text-charcoal">
            {testimonial.name}
          </p>
          <p className="body-sm text-text-muted-custom">{testimonial.title}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="section-padding bg-pearl">
      <div className="mx-auto max-w-7xl">
        <FadeInUp>
          <div className="text-center mb-16">
            <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
              Testimonials
            </p>
            <h2 className="heading-lg text-charcoal mb-4">
              What Our Guests Say
            </h2>
            <div className="mx-auto h-[2px] w-16 bg-gold" />
          </div>
        </FadeInUp>

        <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.id}>
              <TestimonialCard testimonial={testimonial} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
