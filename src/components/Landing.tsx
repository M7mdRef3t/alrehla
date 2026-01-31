import type { FC } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { landingCopy } from "../copy/landing";
import { RelationshipGym } from "./RelationshipGym";
import { useJourneyState } from "../state/journeyState";

interface LandingProps {
  onStartJourney: () => void;
}

// Fog-to-Clarity animation — use transform/opacity + will-change to avoid reflow/stutter
const fogReveal = {
  hidden: {
    opacity: 0,
    filter: "blur(8px)",
    y: 8  // Further reduced for smoother, less jumpy entry
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut"
    }
  }
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.3 }
  }
};

export const Landing: FC<LandingProps> = ({ onStartJourney }) => {
  const [showGym, setShowGym] = useState(false);
  /** زر الجيم يظهر لأول مرة فقط (قبل إتمام القياس الأولي) */
  const isFirstTime = useJourneyState((s) => s.baselineCompletedAt == null);

  return (
    <div className="relative w-full max-w-xl py-10 md:py-14 min-h-[420px]">
      {/* Breathing background — z-0, no interactions */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        aria-hidden="true"
      >
        <motion.div
          className="w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full bg-teal-50 blur-3xl"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.25, 0.5, 0.25]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
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
          className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-normal"
          style={{ fontFamily: "'Almarai', sans-serif", willChange: "transform, opacity" }}
          variants={fogReveal}
        >
          <span className="block">{landingCopy.titleLine1}</span>
          <span className="block mt-2">{landingCopy.titleLine2}</span>
        </motion.h1>

        <motion.p
          className="text-base md:text-lg text-slate-600 leading-relaxed max-w-md mx-auto whitespace-pre-line"
          style={{ willChange: "transform, opacity" }}
          variants={fogReveal}
        >
          {landingCopy.subtitle}
        </motion.p>

        <motion.div className="mt-10 flex flex-col items-center gap-3">
          {isFirstTime && (
            <motion.button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-700 border-2 border-slate-200 px-6 py-2.5 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 active:scale-[0.98] transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              style={{ willChange: "transform, opacity" }}
              onClick={() => setShowGym(true)}
              title="تدرب على سيناريوهات حقيقية قبل ما تبدأ"
              variants={fogReveal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Target className="w-4 h-4" />
              جرب نفسك الأول
            </motion.button>
          )}
          <motion.p
            className="text-sm text-slate-400 mt-1"
            variants={fogReveal}
            style={{ willChange: "transform, opacity" }}
          >
            {landingCopy.description}
          </motion.p>
        </motion.div>
        
        {showGym && (
          <RelationshipGym
            onClose={() => setShowGym(false)}
            onStartJourney={() => {
              setShowGym(false);
              onStartJourney();
            }}
          />
        )}
      </motion.main>
    </div>
  );
};
