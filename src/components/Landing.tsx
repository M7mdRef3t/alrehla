import type { FC } from "react";
import { motion } from "framer-motion";
import { landingCopy } from "../copy/landing";

const fogReveal = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 8 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 1, ease: "easeOut" }
  }
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.3 } }
};

export const Landing: FC = () => {
  return (
    <div className="relative w-full max-w-xl py-10 md:py-14 min-h-[420px]">
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        aria-hidden="true"
      >
        {/* تنفس الوضع الفاتح — رمادي */}
        <motion.div
          className="w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full bg-gray-300 blur-2xl dark:hidden"
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* تنفس الوضع الداكن — زي الأول teal */}
        <motion.div
          className="hidden w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full bg-teal-900/40 blur-3xl dark:block"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <motion.main
        className="relative z-10 w-full text-center"
        style={{ willChange: "transform, opacity" }}
        aria-labelledby="landing-title"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          id="landing-title"
          className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-normal"
          style={{ fontFamily: "'Almarai', sans-serif", willChange: "transform, opacity" }}
          variants={fogReveal}
        >
          <span className="block">{landingCopy.titleLine1}</span>
          <span className="block mt-2">{landingCopy.titleLine2}</span>
        </motion.h1>
        <motion.p
          className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto whitespace-pre-line"
          style={{ willChange: "transform, opacity" }}
          variants={fogReveal}
        >
          {landingCopy.subtitle}
        </motion.p>
      </motion.main>
    </div>
  );
};
