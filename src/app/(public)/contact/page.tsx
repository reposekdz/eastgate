"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FadeInUp,
  SlideIn,
} from "@/components/animations/MotionWrapper";
import { contactContent } from "@/lib/kw-data";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

const infoIcons: Record<string, React.ElementType> = {
  address: MapPin,
  phone: Phone,
  email: Mail,
  hours: Clock,
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.pexels.com/photos/6871940/pexels-photo-6871940.jpeg)`,
          }}
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
            {contactContent.sectionLabel}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {contactContent.title}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-[2px] w-16 bg-gold"
          />
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <SlideIn direction="left">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="heading-sm text-charcoal mb-6">
                      Ohereza Ubutumwa
                    </h2>

                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 mb-6 bg-emerald/10 text-emerald rounded-[4px]"
                      >
                        <CheckCircle size={20} />
                        <p className="body-md font-medium">
                          {contactContent.form.successMessage}
                        </p>
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {contactContent.form.nameLabel}
                          </label>
                          <Input
                            placeholder={contactContent.form.namePlaceholder}
                            className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald"
                            required
                          />
                        </div>
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {contactContent.form.emailLabel}
                          </label>
                          <Input
                            type="email"
                            placeholder={contactContent.form.emailPlaceholder}
                            className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {contactContent.form.phoneLabel}
                          </label>
                          <Input
                            type="tel"
                            placeholder={contactContent.form.phonePlaceholder}
                            className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald"
                          />
                        </div>
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {contactContent.form.subjectLabel}
                          </label>
                          <Select>
                            <SelectTrigger className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald">
                              <SelectValue
                                placeholder={contactContent.form.subjectPlaceholder}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {contactContent.form.subjectOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="body-sm font-medium text-charcoal mb-1.5 block">
                          {contactContent.form.messageLabel}
                        </label>
                        <Textarea
                          placeholder={contactContent.form.messagePlaceholder}
                          rows={5}
                          className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald resize-none"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 w-full sm:w-auto"
                      >
                        <Send size={16} className="mr-2" />
                        {contactContent.form.submitText}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </SlideIn>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <SlideIn direction="right">
                <div className="space-y-6">
                  {(
                    Object.entries(contactContent.info) as [
                      string,
                      { title: string; value: string }
                    ][]
                  ).map(([key, info]) => {
                    const Icon = infoIcons[key];
                    return (
                      <Card
                        key={key}
                        className="bg-white hover:shadow-lg transition-all duration-300"
                      >
                        <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold shrink-0">
                            {Icon && <Icon size={20} />}
                          </div>
                          <div>
                            <h4 className="font-heading font-semibold text-charcoal mb-1">
                              {info.title}
                            </h4>
                            {key === "phone" ? (
                              <a
                                href={`tel:${info.value.replace(/\s/g, "")}`}
                                className="body-md text-text-muted-custom hover:text-emerald transition-colors"
                              >
                                {info.value}
                              </a>
                            ) : key === "email" ? (
                              <a
                                href={`mailto:${info.value}`}
                                className="body-md text-text-muted-custom hover:text-emerald transition-colors break-all"
                              >
                                {info.value}
                              </a>
                            ) : (
                              <p className="body-md text-text-muted-custom">
                                {info.value}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Social */}
                  <Card className="bg-charcoal">
                    <CardContent className="p-5 sm:p-6">
                      <h4 className="font-heading font-semibold text-white mb-4">
                        {contactContent.socialTitle}
                      </h4>
                      <div className="flex gap-3">
                        {[Facebook, Instagram, Twitter].map((Icon, i) => (
                          <a
                            key={i}
                            href="#"
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-charcoal transition-all duration-300"
                          >
                            <Icon size={18} />
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SlideIn>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="bg-pearl">
        <FadeInUp>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="heading-sm text-charcoal">Aho Tuherereye</h3>
            </div>
            <div className="w-full h-64 sm:h-80 lg:h-96 rounded-[4px] overflow-hidden bg-surface-dark relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15949.620082456!2d29.856!3d-1.943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca42fff5bac4f%3A0x6bf3b8cc05c4f4f!2sKigali%2C%20Rwanda!5e0!3m2!1srw!2srw!4v1700000000000!5m2!1srw!2srw"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Aho EastGate Hotel Iherereye"
              />
            </div>
          </div>
        </FadeInUp>
      </section>
    </>
  );
}
