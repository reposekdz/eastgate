"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FadeInUp,
  SlideIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/MotionWrapper";
import { aboutContent } from "@/lib/kw-data";
import { images } from "@/lib/data";
import { Target, Eye, Heart, Shield, Globe, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";

const valueIcons = [Heart, Shield, Globe, Award];

export default function AboutPage() {
  const { t } = useI18n();
  const statLabels = [t("about", "stat1Label"), t("about", "stat2Label"), t("about", "stat3Label"), t("about", "stat4Label")];
  const valuesData = [
    { title: t("about", "value1Title"), description: t("about", "value1Desc") },
    { title: t("about", "value2Title"), description: t("about", "value2Desc") },
    { title: t("about", "value3Title"), description: t("about", "value3Desc") },
    { title: t("about", "value4Title"), description: t("about", "value4Desc") },
  ];
  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.lobby})` }}
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
            {t("about", "sectionLabel")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:heading-xl text-white font-heading font-bold mb-4"
          >
            {t("about", "title")}{" "}
            <span className="italic text-gold">{t("about", "titleAccent")}</span>
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-[2px] w-16 bg-gold"
          />
        </div>
      </section>

      {/* About Story */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <SlideIn direction="left">
              <div>
                <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                  {t("about", "ourStory")}
                </p>
                <h2 className="heading-md sm:heading-lg text-charcoal mb-6 font-heading">
                  {t("about", "title")}{" "}
                  <span className="text-emerald italic">{t("about", "titleAccent")}</span>
                </h2>
                <div className="h-[2px] w-12 bg-gold mb-6" />
                <p className="body-md sm:body-lg text-text-muted-custom mb-5">
                  {t("about", "description")}
                </p>
                <p className="body-md text-text-muted-custom mb-8">
                  {t("about", "descriptionSecondary")}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-emerald text-emerald hover:bg-emerald hover:text-white rounded-[2px] uppercase tracking-wider text-sm px-8 py-5"
                >
                  <Link href="/rooms" className="flex items-center gap-2">
                    {t("about", "ctaText")}
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </SlideIn>
            <SlideIn direction="right">
              <div className="relative">
                <div className="overflow-hidden rounded-[4px]">
                  <Image
                    src={images.lobby}
                    alt={images.lobbyAlt}
                    width={800}
                    height={600}
                    className="h-64 sm:h-80 lg:h-[450px] w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-[4px] border-2 border-gold/30" />
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-charcoal py-12 sm:py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {aboutContent.stats.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-heading font-bold text-gold mb-2">
                    {stat.value}
                  </p>
                  <p className="body-sm text-white/60 uppercase tracking-wider">
                    {statLabels[i]}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-pearl">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {t("about", "missionVisionLabel")}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {t("about", "whatWeStandFor")}
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <div className="grid gap-8 md:grid-cols-2 mb-16">
            <SlideIn direction="left">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 h-full border-t-4 border-t-emerald">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                      <Target size={24} />
                    </div>
                    <h3 className="heading-sm text-charcoal">{t("about", "missionTitle")}</h3>
                  </div>
                  <p className="body-md text-text-muted-custom leading-relaxed">
                    {t("about", "missionDesc")}
                  </p>
                </CardContent>
              </Card>
            </SlideIn>
            <SlideIn direction="right">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 h-full border-t-4 border-t-gold">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <Eye size={24} />
                    </div>
                    <h3 className="heading-sm text-charcoal">{t("about", "visionTitle")}</h3>
                  </div>
                  <p className="body-md text-text-muted-custom leading-relaxed">
                    {t("about", "visionDesc")}
                  </p>
                </CardContent>
              </Card>
            </SlideIn>
          </div>

          {/* Values */}
          <FadeInUp>
            <div className="text-center mb-10">
              <h3 className="heading-sm text-charcoal">{t("about", "ourValues")}</h3>
            </div>
          </FadeInUp>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {valuesData.map((value, i) => {
              const Icon = valueIcons[i];
              return (
                <StaggerItem key={value.title}>
                  <Card className="bg-white hover:shadow-lg transition-all duration-300 h-full text-center">
                    <CardContent className="p-5 sm:p-6">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
                        <Icon size={22} />
                      </div>
                      <h4 className="font-heading font-semibold text-charcoal text-lg mb-2">
                        {value.title}
                      </h4>
                      <p className="body-sm text-text-muted-custom">{value.description}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-ivory">
        <div className="mx-auto max-w-7xl">
          <FadeInUp>
            <div className="text-center mb-12 sm:mb-16">
              <p className="body-sm uppercase tracking-[0.25em] text-gold-dark mb-3 font-medium">
                {t("about", "teamLabel")}
              </p>
              <h2 className="text-2xl sm:heading-lg text-charcoal mb-4 font-heading font-bold">
                {t("about", "teamTitle")}
              </h2>
              <div className="mx-auto h-[2px] w-16 bg-gold" />
            </div>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {aboutContent.team.map((member) => (
              <StaggerItem key={member.name}>
                <Card className="group bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full overflow-hidden">
                  <div className="relative h-56 sm:h-64 overflow-hidden">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <CardContent className="p-5 sm:p-6 text-center">
                    <h4 className="font-heading font-semibold text-charcoal text-lg mb-1">
                      {member.name}
                    </h4>
                    <p className="body-sm text-gold-dark font-medium mb-3">{member.role}</p>
                    <p className="body-sm text-text-muted-custom">{member.bio}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="relative min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${images.ctaBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-dark/90 to-charcoal/85" />
        </div>
        <div className="relative z-10 flex min-h-[400px] items-center justify-center px-4 sm:px-6">
          <FadeInUp>
            <div className="text-center max-w-3xl">
              <div className="mx-auto mb-6 h-[1px] w-16 bg-gold" />
              <h2 className="text-2xl sm:heading-lg text-white mb-6 font-heading font-bold">
                {t("about", "wantToKnowMore")} <span className="italic text-gold-light">{t("about", "knowMoreAccent")}</span>
              </h2>
              <p className="body-md sm:body-lg text-white/70 mb-8">
                {t("about", "contactPrompt")}
              </p>
              <Button
                asChild
                className="bg-gold hover:bg-gold-dark text-charcoal font-semibold px-10 py-6 rounded-[2px] uppercase tracking-wider text-sm"
              >
                <Link href="/contact">{t("about", "contactCta")}</Link>
              </Button>
            </div>
          </FadeInUp>
        </div>
      </section>
    </>
  );
}
