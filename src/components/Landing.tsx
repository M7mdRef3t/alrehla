import type { FC } from "react";
import { motion } from "framer-motion";
import { landingCopy } from "../copy/landing";

interface LandingProps {
  onStartJourney: () => void;
}

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

export const Landing: FC<LandingProps> = ({ onStartJourney }) => {
  return (
    <div className="relative w-full max-w-xl py-10 md:py-14 min-h-[420px]">
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        aria-hidden="true"
      >
        {/* تنفس الوضع الفاتح — أوضح بس بنفس جو الخلفية */}
        <motion.div
          className="w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full blur-2xl dark:hidden"
          style={{
            background:
              "radial-gradient(circle at center, rgba(15,23,42,0.22), rgba(15,23,42,0))"
          }}
          animate={{ scale: [0.96, 1.06, 0.96], opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
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
        <motion.div variants={fogReveal} className="mt-8">
          <motion.button
            type="button"
            onClick={onStartJourney}
            className="rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {landingCopy.ctaJourney}
          </motion.button>
        </motion.div>
      </motion.main>
    </div>
  );
};
