import type { FC } from "react";
import { motion } from "framer-motion";

interface TacticalNarrativeProps {
  shortPromiseBody: string;
  isEmotionalPrisoner: boolean;
  activeRing: "green" | "yellow" | "red";
}

export const TacticalNarrative: FC<TacticalNarrativeProps> = ({
  shortPromiseBody,
  isEmotionalPrisoner,
  activeRing
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ delay: 1.2 }}
      className="relative group p-10 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 backdrop-blur-3xl shadow-2xl mb-12 text-right overflow-hidden"
    >
      {/* Decorative HUD Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <svg width="40" height="40" viewBox="0 0 40 40" className="text-teal-500">
          <path d="M0 0 L10 0 M0 0 L0 10" fill="none" stroke="currentColor" strokeWidth="1"/>
          <circle cx="20" cy="20" r="2" fill="currentColor"/>
        </svg>
      </div>

      <div 
        className="absolute -top-32 -right-32 w-80 h-80 blur-[120px] rounded-full pointer-events-none opacity-[0.15]"
        style={{ 
          background: `radial-gradient(circle, ${activeRing === "red" ? "#f43f5e" : "#2dd4bf"}, transparent)` 
        }}
      />

      <div className="flex items-center gap-3 mb-6 opacity-60">
        <div className={`w-2 h-2 rounded-full animate-pulse ${activeRing === "red" ? "bg-rose-500" : "bg-teal-400"}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Tactical Assessment</span>
      </div>

      <p className="text-2xl/relaxed text-white font-medium whitespace-pre-wrap relative z-10 tracking-tight">
        {shortPromiseBody}
      </p>
      
      {isEmotionalPrisoner && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8 }}
          className="mt-8 p-6 rounded-3xl bg-rose-500/5 border-r-4 border-rose-500/40 relative"
        >
          <div className="absolute top-0 left-0 p-3 opacity-20">
            <span className="text-2xl font-serif">"</span>
          </div>
          <p className="text-lg text-rose-200/80 leading-relaxed font-bold italic pr-2">
            "جسمك حُر.. لكن عقلك لسه متعلق بمحاكمات وهمية."
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
