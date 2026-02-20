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
import { useI18n } from "@/lib/i18n/context";

const infoIcons: Record<string, React.ElementType> = {
  address: MapPin,
  phone: Phone,
  email: Mail,
  hours: Clock,
};

const contactInfoKeys = ["address", "phone", "email", "hours"] as const;
const contactSubjectKeys = ["subject1", "subject2", "subject3", "subject4", "subject5", "subject6"] as const;

export default function ContactPage() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const infoTitles: Record<string, string> = {
    address: t("contact", "addressTitle"),
    phone: t("contact", "phoneTitle"),
    email: t("contact", "emailTitle"),
    hours: t("contact", "hoursTitle"),
  };
  const infoValues: Record<string, string> = {
    address: "KG 7 Ave, Kigali, Rwanda",
    phone: "+250 788 000 000",
    email: "reservations@eastgatehotel.rw",
    hours: "24/7",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Failed to submit contact form:", error);
    } finally {
      setLoading(false);
    }
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
            {t("contact", "sectionLabel")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {t("contact", "title")}
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
                      {t("contact", "sendMessage")}
                    </h2>

                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 mb-6 bg-emerald/10 text-emerald rounded-[4px]"
                      >
                        <CheckCircle size={20} />
                        <p className="body-md font-medium">
                          {t("contact", "successMessage")}
                        </p>
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {t("contact", "nameLabel")}
                          </label>
                          <Input
                            placeholder={t("contact", "namePlaceholder")}
                            className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {t("contact", "emailLabel")}
                          </label>
                          <Input
                            type="email"
                            placeholder={t("contact", "emailPlaceholder")}
                            className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {t("contact", "phoneLabel")}
                          </label>
                          <Input
                            type="tel"
                            placeholder={t("contact", "phonePlaceholder")}
                            className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="body-sm font-medium text-charcoal mb-1.5 block">
                            {t("contact", "subjectLabel")}
                          </label>
                          <Select value={formData.subject} onValueChange={(val) => setFormData({ ...formData, subject: val })}>
                            <SelectTrigger className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald">
                              <SelectValue
                                placeholder={t("contact", "subjectPlaceholder")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {contactSubjectKeys.map((key) => (
                                <SelectItem key={key} value={key}>
                                  {t("contact", key)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="body-sm font-medium text-charcoal mb-1.5 block">
                          {t("contact", "messageLabel")}
                        </label>
                        <Textarea
                          placeholder={t("contact", "messagePlaceholder")}
                          rows={5}
                          className="rounded-[2px] border-border focus:border-emerald focus:ring-emerald resize-none"
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 py-5 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 w-full sm:w-auto"
                        disabled={loading}
                      >
                        <Send size={16} className="mr-2" />
                        {loading ? t("contact", "sending") || "Sending..." : t("contact", "submitText")}
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
                  {contactInfoKeys.map((key) => {
                    const Icon = infoIcons[key];
                    const title = infoTitles[key];
                    const value = infoValues[key];
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
                              {title}
                            </h4>
                            {key === "phone" ? (
                              <a
                                href={`tel:${value.replace(/\s/g, "")}`}
                                className="body-md text-text-muted-custom hover:text-emerald transition-colors"
                              >
                                {value}
                              </a>
                            ) : key === "email" ? (
                              <a
                                href={`mailto:${value}`}
                                className="body-md text-text-muted-custom hover:text-emerald transition-colors break-all"
                              >
                                {value}
                              </a>
                            ) : (
                              <p className="body-md text-text-muted-custom">
                                {value}
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
                        {t("contact", "socialTitle")}
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
              <h3 className="heading-sm text-charcoal">{t("contact", "locationTitle")}</h3>
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
                title={t("contact", "mapTitle")}
              />
            </div>
          </div>
        </FadeInUp>
      </section>
    </>
  );
}
