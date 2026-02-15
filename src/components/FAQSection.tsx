"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInUp } from "@/components/animations/MotionWrapper";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const faqPairs: { q: "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8"; a: "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8" }[] = [
  { q: "q1", a: "a1" }, { q: "q2", a: "a2" }, { q: "q3", a: "a3" }, { q: "q4", a: "a4" },
  { q: "q5", a: "a5" }, { q: "q6", a: "a6" }, { q: "q7", a: "a7" }, { q: "q8", a: "a8" },
];

export default function FAQSection() {
  const { t } = useI18n();
  const faqs = faqPairs.map(({ q, a }) => ({ question: t("faq", q), answer: t("faq", a) }));

  return (
    <section className="section-padding bg-white" id="faq">
      <div className="mx-auto max-w-4xl">
        <FadeInUp>
          <div className="text-center mb-10 sm:mb-14">
            <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
              {t("faq", "sectionLabel")}
            </p>
            <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
              {t("faq", "title")}{" "}
              <span className="italic text-emerald">{t("faq", "titleAccent")}</span>
            </h2>
            <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            <p className="body-md text-text-muted-custom max-w-2xl mx-auto">
              {t("faq", "intro")}
            </p>
          </div>
        </FadeInUp>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-pearl/60 border border-gray-100 rounded-xl px-5 sm:px-6 data-[state=open]:bg-white data-[state=open]:shadow-md data-[state=open]:border-emerald/20 transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-heading text-sm sm:text-base font-semibold text-charcoal hover:text-emerald py-4 sm:py-5 [&[data-state=open]>svg]:text-emerald hover:no-underline gap-3">
                  <span className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-gold shrink-0" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="body-sm sm:body-md text-text-muted-custom pb-5 pl-9 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <FadeInUp delay={0.3}>
          <div className="mt-10 text-center bg-pearl/60 rounded-2xl p-6 sm:p-8 border border-gray-100">
            <MessageCircle size={28} className="text-emerald mx-auto mb-3" />
            <h4 className="font-heading text-lg font-semibold text-charcoal mb-2">
              {t("faq", "stillHaveQuestions")}
            </h4>
            <p className="body-sm text-text-muted-custom mb-4">
              {t("faq", "stillIntro")}
            </p>
            <Button
              asChild
              className="bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-[4px] px-6 gap-2"
            >
              <Link href="/contact">
                <MessageCircle size={14} />
                {t("faq", "contactUs")}
              </Link>
            </Button>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
