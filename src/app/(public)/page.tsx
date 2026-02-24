"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { roomsContent, testimonialsKw } from "@/lib/kw-data";
import { images } from "@/lib/data";
import { useI18n } from "@/lib/i18n/context";
import {
  ChevronDown,
  ArrowRight,
  Star,
  Quote,
  Bed,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
  ImageIcon,
  Clock,
  Wifi,
  Car,
  Coffee,
  Waves,
  Phone,
  Dumbbell,
} from "lucide-react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import FAQSection from "@/components/FAQSection";

// Room type from API
interface Room {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  branchId: number;
  status: string;
  amenities?: string;
}


// ─── Animated Counter Component ──────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ""));

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = numericTarget / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        setCount(numericTarget);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, numericTarget]);

  const displayValue = Number.isInteger(numericTarget)
    ? Math.floor(count).toLocaleString()
    : count.toFixed(1);

  return (
    <span ref={ref} className="font-heading text-4xl sm:text-5xl font-bold text-gold">
      {isInView ? displayValue : "0"}{suffix}
    </span>
  );
}

// ─── Feature Card Component ──────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="group bg-white/5 backdrop-blur-xs border-white/10 hover:bg-white/10 hover:border-gold/30 transition-all duration-500 cursor-pointer h-full">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors">
            <Icon size={24} />
          </div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="body-sm text-white/60">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Service Highlight Card ──────────────────────────────
function ServiceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-emerald/5 transition-all duration-300">
      <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0 group-hover:bg-emerald/20 transition-colors">
        <Icon size={22} className="text-emerald" />
      </div>
      <div>
        <h4 className="font-heading font-semibold text-charcoal mb-1">{title}</h4>
        <p className="body-sm text-text-muted-custom">{description}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  
  // State for rooms from API
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Fetch rooms from API on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Fetch all rooms (not just available) for homepage showcase
        const res = await fetch("/api/public/rooms?status=");
        if (res.ok) {
          const data = await res.json();
          // Map API response to our format
          const mappedRooms = (data.rooms || []).map((room: any) => ({
            id: room.id,
            name: `Room ${room.number} - ${room.type}`,
            description: room.description || "Comfortable and elegant room",
            price: room.price,
            image: room.imageUrl || "/eastgatelogo.png",
            branchId: room.branchId,
            status: room.status,
          }));
          setRooms(mappedRooms);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // Services data with translations (locale-aware via t())
  const services = [
    { icon: Wifi, titleKey: "service1Title" as const, descKey: "service1Desc" as const },
    { icon: Car, titleKey: "service2Title" as const, descKey: "service2Desc" as const },
    { icon: Coffee, titleKey: "service3Title" as const, descKey: "service3Desc" as const },
    { icon: Waves, titleKey: "service4Title" as const, descKey: "service4Desc" as const },
    { icon: Dumbbell, titleKey: "service5Title" as const, descKey: "service5Desc" as const },
    { icon: Clock, titleKey: "service6Title" as const, descKey: "service6Desc" as const },
  ].map(({ icon, titleKey, descKey }) => ({
    icon,
    title: t("homepageExtras", titleKey),
    description: t("homepageExtras", descKey),
  }));

  // Stats data with translations
  const stats = [
    { value: "15", suffix: "+", label: t("homepage", "yearsExperience") },
    { value: "120", suffix: "+", label: t("homepage", "roomsSuites") },
    { value: "50000", suffix: "+", label: t("homepage", "happyGuests") },
    { value: "4.9", suffix: "", label: t("homepage", "guestRating") },
  ];

  return (
    <>


      {/* ─── Hero Section ─── */}
      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${images.hero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal/80" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 sm:px-6 text-center">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6 h-[1px] w-16 bg-gold"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="body-sm sm:body-md mb-4 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gold-light"
          >
            {t("homepage", "heroSubtitle")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-3xl sm:text-4xl md:heading-xl max-w-4xl text-white mb-6 font-heading font-bold"
          >
            {t("homepage", "heroTitle")}{" "}
            <span className="italic text-gold">{t("homepage", "heroTitleAccent")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="body-md sm:body-lg max-w-2xl text-white/80 mb-10 px-4"
          >
            {t("homepage", "heroDescription")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 sm:px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,169,81,0.4)]"
            >
              <Link href="/book">{t("homepage", "bookARoom")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/60 text-white bg-white/10 hover:bg-white/20 hover:border-white px-8 sm:px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm backdrop-blur-sm"
            >
              <Link href="/contact">{t("homepage", "writeToUs")}</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="mt-6"
          >
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="border border-emerald/40 text-emerald bg-emerald/10 hover:bg-emerald/20 hover:border-emerald px-6 py-5 rounded-[2px] uppercase tracking-wider text-xs backdrop-blur-sm transition-all duration-300"
            >
              <Link href="/staff-login">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M18 20a6 6 0 0 0-12 0"/>
                  <circle cx="12" cy="10" r="4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                {t("homepageExtras", "staffLogin")}
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="absolute bottom-10"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <a href="#features" className="text-white/50 hover:text-gold transition-colors">
                <ChevronDown size={32} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Quick Features ─── */}
      <section id="features" className="bg-charcoal py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <StaggerItem>
              <FeatureCard
                icon={Bed}
                title={t("homepage", "rooms")}
                description={t("homepage", "roomsDesc")}
                href="/rooms"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={UtensilsCrossed}
                title={t("homepage", "dining")}
                description={t("homepage", "diningDesc")}
                href="/dining"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={Sparkles}
                title={t("homepage", "spa")}
                description={t("homepage", "spaDesc")}
                href="/spa"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={CalendarDays}
                title={t("homepage", "events")}
                description={t("homepage", "eventsDesc")}
                href="/events"
              />
            </StaggerItem>
            <StaggerItem>
              <FeatureCard
                icon={ImageIcon}
                title={t("homepage", "gallery")}
                description={t("homepage", "galleryDesc")}
                href="/gallery"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Live Stats Counter ─── */}
      <section className="bg-charcoal/95 py-16 sm:py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <div className="text-center mb-12">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-light mb-3 font-medium">
                {t("homepage", "liveStats")}
              </p>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {stats.map((stat, i) => (
              <FadeInUp key={i} delay={i * 0.1}>
                <div className="text-center">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  <p className="body-sm text-white/60 mt-2 uppercase tracking-wide font-medium">
                    {stat.label}
                  </p>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Rooms Preview ─── */}
      <section className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {t("homepage", "accommodations")}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {t("homepage", "roomsSuites")}
              </h2>
              <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {loadingRooms ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <StaggerItem key={i}>
                  <div className="bg-white rounded-[4px] shadow-sm overflow-hidden animate-pulse">
                    <div className="h-56 sm:h-72 bg-gray-200" />
                    <div className="p-5 sm:p-7">
                      <div className="h-6 bg-gray-200 rounded mb-2" />
                      <div className="h-4 bg-gray-200 rounded mb-4" />
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                </StaggerItem>
              ))
            ) : rooms.length > 0 ? (
              rooms.map((room: Room) => (
                <StaggerItem key={room.id}>
                  <div className="group overflow-hidden bg-white rounded-[4px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                    <div className="relative h-56 sm:h-72 overflow-hidden">
                      <img
                        src={room.image || "/eastgatelogo.png"}
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {/* Quick book overlay */}
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <Button
                          asChild
                          size="sm"
                          className="bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[2px] uppercase tracking-wider text-xs w-full"
                        >
                          <Link href="/book">{t("homepage", "bookARoom")}</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="p-5 sm:p-7">
                      <h3 className="heading-sm text-charcoal mb-2">{room.name}</h3>
                      <p className="body-sm sm:body-md text-text-muted-custom mb-4 line-clamp-2">
                        {room.description}
                      </p>
                    <div className="flex items-center justify-between">
                      <span className="body-md font-semibold text-emerald">{room.price}</span>
                      <Button
                        variant="ghost"
                        className="text-gold-dark hover:text-gold hover:bg-transparent p-0 uppercase tracking-wide text-xs font-semibold group/btn"
                        asChild
                      >
                        <Link href="/rooms" className="flex items-center gap-1">
                          {t("homepageExtras", "learnMore")}
                          <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
              ))
            ) : (
              // Fallback to static data if no API data
              roomsContent.rooms.map((room: typeof roomsContent.rooms[0]) => (
                <StaggerItem key={room.id}>
                  <div className="group overflow-hidden bg-white rounded-[4px] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                    <div className="relative h-56 sm:h-72 overflow-hidden">
                      <img
                        src={room.image}
                        alt={room.alt}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <Button
                          asChild
                          size="sm"
                          className="bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-[2px] uppercase tracking-wider text-xs w-full"
                        >
                          <Link href="/book">{t("homepage", "bookARoom")}</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="p-5 sm:p-7">
                      <h3 className="heading-sm text-charcoal mb-2">{room.name}</h3>
                      <p className="body-sm sm:body-md text-text-muted-custom mb-4 line-clamp-2">
                        {room.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="body-md font-semibold text-emerald">{room.price}</span>
                        <Button
                          variant="ghost"
                          className="text-gold-dark hover:text-gold hover:bg-transparent p-0 uppercase tracking-wide text-xs font-semibold group/btn"
                          asChild
                        >
                          <Link href="/rooms" className="flex items-center gap-1">
                            {t("homepageExtras", "learnMore")}
                            <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))
            )}
          </StaggerContainer>

          <FadeInUp delay={0.3}>
            <div className="text-center mt-10">
              <Button
                asChild
                variant="outline"
                className="border-emerald text-emerald hover:bg-emerald hover:text-white rounded-[2px] uppercase tracking-wider text-sm px-8 py-5"
              >
                <Link href="/rooms">{t("homepage", "viewAllRooms")}</Link>
              </Button>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ─── Services & Amenities ─── */}
      <section className="section-padding bg-white">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {t("common", "services")}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {t("homepageExtras", "servicesHeading")}{" "}
                <span className="italic text-emerald">{t("homepageExtras", "servicesHeadingAccent")}</span>
              </h2>
              <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
              <p className="body-md text-text-muted-custom max-w-2xl mx-auto">
                {t("homepageExtras", "servicesIntro")}
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <StaggerItem key={i}>
                <ServiceCard {...service} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {t("homepage", "guestTestimonials")}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {t("homepage", "guestWords")}
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonialsKw.map((testimonial) => (
              <StaggerItem key={testimonial.id}>
                <div className="bg-white rounded-[4px] p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-500 relative h-full">
                  <Quote size={32} className="text-gold/20 absolute top-6 right-6" fill="currentColor" />
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} size={16} className="text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="body-sm sm:body-md text-slate-custom mb-6 italic leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover"
                      width={48}
                      height={48}
                    />
                    <div>
                      <p className="body-md font-semibold text-charcoal">{testimonial.name}</p>
                      <p className="body-sm text-text-muted-custom">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Guest Rating Section ─── */}
      <section className="section-padding bg-white">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-10 sm:mb-14">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {t("homepageExtras", "guestRatingHeading")}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {t("homepageExtras", "shareExperience")}{" "}
                <span className="italic text-emerald">{t("homepageExtras", "shareExperienceAccent")}</span>
              </h2>
              <div className="mx-auto mb-6 h-[2px] w-16 bg-gold" />
              <p className="body-md text-text-muted-custom max-w-2xl mx-auto">
                {t("homepageExtras", "shareExperienceIntro")}
              </p>
            </div>
          </FadeInUp>
          <StarRating />
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <FAQSection />

      {/* ─── Quick Actions Bar ─── */}
      <section className="bg-emerald py-12 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <Link href="/book" className="group">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300">
                <Bed size={28} className="text-gold" />
                <h3 className="font-heading font-semibold text-white text-lg">
                  {t("homepage", "getRoom")}
                </h3>
                <p className="body-sm text-white/70">
                  {t("homepageExtras", "reserveRoomNow")}
                </p>
                <ArrowRight size={16} className="text-gold group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/menu" className="group">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300">
                <UtensilsCrossed size={28} className="text-gold" />
                <h3 className="font-heading font-semibold text-white text-lg">
                  {t("homepageExtras", "viewMenuShort")}
                </h3>
                <p className="body-sm text-white/70">
                  {t("homepageExtras", "browseFood")}
                </p>
                <ArrowRight size={16} className="text-gold group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/contact" className="group">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300">
                <Phone size={28} className="text-gold" />
                <h3 className="font-heading font-semibold text-white text-lg">
                  {t("homepage", "writeToUs")}
                </h3>
                <p className="body-sm text-white/70">
                  {t("homepageExtras", "askQuestions")}
                </p>
                <ArrowRight size={16} className="text-gold group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative min-h-[400px] sm:min-h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${images.ctaBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-dark/90 to-charcoal/85" />
        </div>
        <div className="relative z-10 flex min-h-[400px] sm:min-h-[500px] items-center justify-center px-4 sm:px-6">
          <div className="text-center max-w-3xl">
            <FadeInUp>
              <div className="mx-auto mb-6 h-[1px] w-16 bg-gold" />
              <h2 className="text-2xl sm:heading-lg text-white mb-6 font-heading font-bold">
                {t("homepage", "startYourJourney")}{" "}
                <span className="italic text-gold-light">{t("homepage", "journeyAccent")}</span>
              </h2>
              <p className="body-md sm:body-lg text-white/75 mb-10 px-4">
                {t("homepage", "journeyDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-8 sm:px-12 py-6 rounded-[2px] uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(200,169,81,0.4)]"
                >
                  <Link href="/book">{t("homepage", "journeyCta")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/50 text-white bg-white/10 hover:bg-white/20 hover:border-white px-8 py-6 rounded-[2px] uppercase tracking-wider text-sm backdrop-blur-sm"
                >
                  <Link href="/contact">{t("homepage", "writeToUs")}</Link>
                </Button>
              </div>
            </FadeInUp>
          </div>
        </div>
      </section>
    </>
  );
}
