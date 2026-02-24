"use client";

import RoomShowcase from "@/components/sections/RoomShowcase";
import { motion } from "framer-motion";
import { images } from "@/lib/data";
import { useI18n } from "@/lib/i18n/context";

export default function RoomsPage() {
  const { t } = useI18n();

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images.hero})` }}
        >
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-lg text-white mb-4"
          >
            {t("rooms", "title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="body-lg text-white/80 max-w-2xl"
          >
            {t("rooms", "description")}
          </motion.p>
        </div>
      </section>

      {/* Room Showcase */}
      <RoomShowcase />
    </>
  );
}
