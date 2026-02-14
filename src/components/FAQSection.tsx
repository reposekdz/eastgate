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

const faqs = [
  {
    question: "What are the check-in and check-out times?",
    questionRw: "Amasaha yo kwinjira no gusohoka ni ayahe?",
    answer:
      "Check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out are available upon request and subject to availability. Please contact the front desk to arrange.",
    answerRw:
      "Kwinjira ni saa 8:00 z'umugoroba naho gusohoka ni saa 5:00 z'igitondo. Kwinjira kare no gusohoka buhoro bishoboka ukoresha gusaba kandi bikurikijwe n'iboneka. Vugana na resepisiyo.",
  },
  {
    question: "Do you offer airport shuttle service?",
    questionRw: "Mufite serivisi yo guhura ku kibuga cy'indege?",
    answer:
      "Yes, we offer complimentary airport shuttle service for all guests staying at EastGate Hotel. Our shuttle runs 24/7. Please provide your flight details when booking so we can arrange a pickup.",
    answerRw:
      "Yego, dutanga serivisi yo guhura ku kibuga cy'indege kubuntu ku bashyitsi bose ba EastGate Hotel. Bisi yacu ikora 24/7. Duhe amakuru y'indege yawe igihe ufata icyumba.",
  },
  {
    question: "What payment methods do you accept?",
    questionRw: "Uburyo bwo kwishyura mwemera ni ubuhe?",
    answer:
      "We accept Visa, Mastercard, MTN Mobile Money, Airtel Money, PayPal, bank transfer, and cash (RWF). All prices are displayed in Rwandan Francs (RWF).",
    answerRw:
      "Twemera Visa, Mastercard, MTN Mobile Money, Airtel Money, PayPal, itransferi y'ibanki, n'amafaranga (RWF). Ibiciro byose bigaragazwa mu mafaranga y'u Rwanda (RWF).",
  },
  {
    question: "Is breakfast included in the room rate?",
    questionRw: "Ifunguro rya mugitondo ribarirwa mu giciro cy'icyumba?",
    answer:
      "Yes! All room rates include a complimentary buffet breakfast featuring both Rwandan specialties and international cuisine. Breakfast is served from 6:30 AM to 10:30 AM daily.",
    answerRw:
      "Yego! Ibiciro by'ibyumba byose birimo ifunguro rya mugitondo rya bifeti ririmo ibiryo by'u Rwanda n'iby'amahanga. Ifunguro ritangirwa kuva saa 12:30 kugeza saa 4:30 buri munsi.",
  },
  {
    question: "Do you have a swimming pool and spa?",
    questionRw: "Mufite pisine na spa?",
    answer:
      "Yes, we have a stunning infinity pool with panoramic views and a full-service spa offering African-inspired treatments. The pool is open from 7:00 AM to 9:00 PM. Spa appointments can be booked through reception.",
    answerRw:
      "Yego, dufite pisine y'infinity ifite isura nziza n'ispa yuzuye itanga imiti ishingiye ku muco w'Afurika. Pisine ifunguka kuva saa 1:00 kugeza saa 3:00 z'ijoro. Gahunda za spa zishobora gufatirwa kuri resepisiyo.",
  },
  {
    question: "Can I host events or conferences at the hotel?",
    questionRw: "Nshobora gukora ibirori cyangwa inama mu ihoteli?",
    answer:
      "Absolutely! We have world-class event spaces including ballrooms, conference rooms, and outdoor venues. Our events team will help you plan everything from weddings to corporate retreats. Contact our events coordinator for details.",
    answerRw:
      "Rwose! Dufite ahantu h'ibirori h'umwimerere harimo amasalon manini, amazu y'inama, n'ahantu ho hanze. Itsinda ryacu ry'ibirori rizagufasha gutegura ibyo byose kuva ku bukwe kugeza ku nama z'ikigo. Vugana n'umucunga w'ibirori.",
  },
  {
    question: "Is Wi-Fi available throughout the hotel?",
    questionRw: "Wi-Fi iboneka mu ihoteli yose?",
    answer:
      "Yes, high-speed Wi-Fi is available throughout the entire hotel at no extra charge. This includes all rooms, common areas, the pool area, and our restaurant.",
    answerRw:
      "Yego, Wi-Fi yihuta iboneka mu ihoteli yose nta giciro cyongeyeho. Ibi birimo ibyumba byose, ahantu rusange, ku pisine, n'iresitora yacu.",
  },
  {
    question: "What is the cancellation policy?",
    questionRw: "Politiki yo guhagarika ni iyihe?",
    answer:
      "Free cancellation is available up to 48 hours before check-in. Cancellations made within 48 hours will be charged one night's stay. No-shows will be charged the full booking amount.",
    answerRw:
      "Guhagarika kubuntu bishoboka kugeza amasaha 48 mbere yo kwinjira. Guhagarika bikorerwa mu masaha 48 bizishyurwa ijoro rimwe. Kutaza bizishyurwa igiciro cyose cy'ifatwa.",
  },
];

export default function FAQSection() {
  const { isRw } = useI18n();

  return (
    <section className="section-padding bg-white" id="faq">
      <div className="mx-auto max-w-4xl">
        <FadeInUp>
          <div className="text-center mb-10 sm:mb-14">
            <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
              {isRw ? "Ibibazo Bikunze Kubazwa" : "Frequently Asked Questions"}
            </p>
            <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
              {isRw ? "Ibyo Ugomba" : "What You Need to"}{" "}
              <span className="italic text-emerald">{isRw ? "Kumenya" : "Know"}</span>
            </h2>
            <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            <p className="body-md text-text-muted-custom max-w-2xl mx-auto">
              {isRw
                ? "Shakisha ibisubizo by'ibibazo bikunze kubazwa ku bakoresha serivisi zacu."
                : "Find answers to the most commonly asked questions about our services and hotel."}
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
                    {isRw ? faq.questionRw : faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="body-sm sm:body-md text-text-muted-custom pb-5 pl-9 leading-relaxed">
                  {isRw ? faq.answerRw : faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <FadeInUp delay={0.3}>
          <div className="mt-10 text-center bg-pearl/60 rounded-2xl p-6 sm:p-8 border border-gray-100">
            <MessageCircle size={28} className="text-emerald mx-auto mb-3" />
            <h4 className="font-heading text-lg font-semibold text-charcoal mb-2">
              {isRw ? "Hari Ikibazo Gishya?" : "Still Have Questions?"}
            </h4>
            <p className="body-sm text-text-muted-custom mb-4">
              {isRw
                ? "Twandikire kandi tuzagusubiza byihuse."
                : "Contact us and we'll get back to you shortly."}
            </p>
            <Button
              asChild
              className="bg-emerald hover:bg-emerald-dark text-white font-semibold rounded-[4px] px-6 gap-2"
            >
              <Link href="/contact">
                <MessageCircle size={14} />
                {isRw ? "Twandikire" : "Contact Us"}
              </Link>
            </Button>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
