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
      className="relative group p-8 rounded-[3rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 backdrop-blur-2xl shadow-2xl mb-10 text-right"
    >
      <div 
        className="absolute -top-20 -right-20 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20"
        style={{ 
          background: `radial-gradient(circle, ${activeRing === "red" ? "var(--consciousness-critical)" : "var(--consciousness-primary)"}, transparent)` 
        }}
      />
      <p className="text-xl/relaxed text-[var(--consciousness-text)] font-medium whitespace-pre-wrap relative z-10">
        {shortPromiseBody}
      </p>
      
      {isEmotionalPrisoner && (
        <div className="mt-6 p-5 rounded-2xl bg-rose-500/5 border-r-4 border-rose-500/30">
          <p className="text-sm text-slate-300 leading-relaxed font-bold italic opacity-90">
            "جسمك حُر.. لكن عقلك لسه متعلق بمحاكمات وهمية."
          </p>
        </div>
      )}
    </motion.div>
  );
};
