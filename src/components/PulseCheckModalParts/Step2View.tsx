import { motion } from "framer-motion";
import type { TacticalAdvice } from "./helpers";

interface Step2ViewProps {
  tacticalAdvice: TacticalAdvice;
}

export function Step2View({ tacticalAdvice }: Step2ViewProps) {
  const cosmicUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const themeColors = {
    attack: { bg: "rgba(52, 211, 153, 0.1)", border: "#34d39966", text: "#34d399" },
    defend: { bg: "rgba(251, 191, 36, 0.1)", border: "#fbbf2466", text: "#fbbf24" },
    recover: { bg: "rgba(139, 92, 246, 0.1)", border: "#8b5cf666", text: "#8b5cf6" },
  };
  const colors = themeColors[tacticalAdvice.theme] || themeColors.defend;

  return (
    <motion.div 
      className="pulse-check-section flex flex-col items-center justify-center text-center gap-8 py-10" 
      custom={2} 
      variants={cosmicUp} 
      initial="hidden" 
      animate="visible"
    >
      <div className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-5xl relative"
        style={{ background: colors.bg, border: `2px solid ${colors.border}` }}
      >
        {tacticalAdvice.icon}
        <div className="absolute inset-0 animate-pulse opacity-20 bg-current rounded-[2.5rem]" />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-2xl font-black tracking-tight text-white">{tacticalAdvice.title}</h3>
        <p className="text-slate-400 text-sm max-w-[300px] leading-relaxed mx-auto font-medium">
          {tacticalAdvice.message}
        </p>
      </div>
      
      <div className="w-full p-5 rounded-[2rem] bg-white/[0.03] border border-dashed border-white/10 shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-3"
          style={{ color: colors.text }}
        >
          خطوتك الآن
        </span>
        <p className="text-lg font-black text-white leading-snug">{tacticalAdvice.action}</p>
      </div>
    </motion.div>
  );
}

