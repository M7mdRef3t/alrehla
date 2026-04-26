import type { FC } from "react";
import { motion } from "framer-motion";

interface ResultVerdictProps {
  commandScore: number;
  activeRing: "green" | "yellow" | "red";
  title: string;
  stateLabel: string;
  goalLabel: string;
  isEmotionalPrisoner: boolean;
}

export const ResultVerdict: FC<ResultVerdictProps> = ({
  commandScore,
  activeRing,
  title,
  stateLabel,
  goalLabel,
  isEmotionalPrisoner
}) => {
  return (
    <div className="text-center relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col items-center"
      >
        {/* Sovereignty Gauge - High Fidelity */}
        <div className="relative w-64 h-32 mb-8 overflow-hidden">
           <svg className="w-full h-full transform" viewBox="0 0 100 50">
             {/* Background Arc */}
             <path 
               d="M 10 50 A 40 40 0 0 1 90 50" 
               fill="none" 
               stroke="rgba(255,255,255,0.05)" 
               strokeWidth="8" 
               strokeLinecap="round"
             />
             {/* Filled Arc */}
             <motion.path 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: commandScore / 100 }}
               transition={{ duration: 2, ease: "easeOut" }}
               d="M 10 50 A 40 40 0 0 1 90 50" 
               fill="none" 
               stroke={activeRing === "red" ? "var(--consciousness-critical)" : activeRing === "yellow" ? "var(--ds-color-accent-amber)" : "var(--consciousness-primary)"}
               strokeWidth="8" 
               strokeDasharray="100 100"
               strokeLinecap="round"
               style={{ filter: `drop-shadow(0 0 10px ${activeRing === "red" ? "rgba(244,63,94,0.4)" : "rgba(45,212,191,0.4)"})` }}
             />
           </svg>
           <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-4xl font-black text-[var(--consciousness-text)]"
              >
                {commandScore}<span className="text-lg text-[var(--consciousness-text-muted)] opacity-60">%</span>
              </motion.span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--consciousness-text-muted)] opacity-60 mb-2">مؤشر القيادة</span>
           </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black text-teal-400 tracking-[0.3em] uppercase">
            الخلاصة الاستراتيجية
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-[var(--consciousness-text)] leading-tight tracking-tight px-4 blur-none">
            {isEmotionalPrisoner ? stateLabel : title}
          </h2>
          <p className="text-xl text-[var(--consciousness-text-muted)] font-medium max-w-lg mx-auto leading-relaxed">
            {goalLabel}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
