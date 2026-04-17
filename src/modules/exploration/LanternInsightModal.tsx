import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanternsState } from "@/domains/consciousness/store/lanterns.store";

export const LanternInsightModal: React.FC = () => {
  const { availableLanterns, activeLanternId, dismissLantern, clearLanterns } = useLanternsState();

  const activeLantern = availableLanterns.find((l) => l.id === activeLanternId);

  const handleClose = () => {
    dismissLantern();
    // After dismissing the insight, clear the swarm so the user doesn't see it again immediately
    setTimeout(() => {
      clearLanterns();
    }, 600);
  };

  return (
    <AnimatePresence>
      {activeLantern && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-b from-stone-900/90 to-stone-900/95 border border-stone-800/60 rounded-3xl p-8 shadow-[0_0_50px_rgba(251,191,36,0.1)] overflow-hidden"
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Internal Glow Effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                {/* Handwriting message */}
                <h3 className="text-xl md:text-2xl text-amber-50 leading-relaxed font-arabic" style={{ lineHeight: "1.8" }}>
                  "{activeLantern.message}"
                </h3>

                {/* Subtext signature */}
                <div className="pt-6 border-t border-stone-800/60 w-full">
                  <p className="text-sm text-amber-200/50 italic font-arabic">
                    — {activeLantern.timeElapsed}
                  </p>
                </div>

                {/* Organic Dismiss Button */}
                <button
                  onClick={handleClose}
                  className="mt-4 px-8 py-3 text-sm text-stone-400 hover:text-amber-200 transition-colors duration-300 rounded-full border border-stone-800 hover:border-amber-900/50 bg-stone-900/50"
                  dir="ltr"
                >
                  <span className="font-arabic">أكمل مسيرك</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
