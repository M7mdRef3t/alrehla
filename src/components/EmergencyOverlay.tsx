import type { FC } from "react";
import { motion } from "framer-motion";
import { useEmergencyState } from "../state/emergencyState";

export const EmergencyOverlay: FC = () => {
  const close = useEmergencyState((s) => s.close);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-lg px-4"
      onClick={close}
      aria-labelledby="emergency-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="bg-transparent max-w-md w-full text-center"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <h2
          id="emergency-title"
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          وقف
        </h2>
        <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-10">
          مش دورك دلوقتي.
        </p>
        <button
          type="button"
          className="rounded-full bg-rose-400 text-white px-10 py-4 text-base font-semibold shadow-sm hover:bg-rose-500 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
          onClick={close}
          title="خروج هادي"
          aria-label="خروج هادي"
        >
          خروج هادي
        </button>
      </motion.div>
    </div>
  );
};
