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
      className="pulse-check-section flex flex-col items-center justify-center text-center gap-10 py-12" 
      custom={2} 
      variants={cosmicUp} 
      initial="hidden" 
      animate="visible"
    >
      <div className="relative">
        <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-5xl relative z-10"
          style={{ 
            background: colors.bg, 
            border: `2px solid ${colors.border}`,
            boxShadow: `0 0 40px ${colors.bg}`
          }}
        >
          {tacticalAdvice.icon}
        </div>
        {/* Decorative Rings */}
        <motion.div 
          className="absolute inset-0 rounded-[2.5rem] border border-white/5 -m-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl font-black tracking-tight text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {tacticalAdvice.title}
        </h3>
        <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-sm max-w-[320px] leading-relaxed mx-auto font-medium">
          {tacticalAdvice.message}
        </p>
      </div>
      
      <div className="relative w-full p-7 rounded-[2.5rem] bg-white/[0.04] border border-white/10 shadow-3xl overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: colors.text }} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-4"
          style={{ color: colors.text, opacity: 0.8 }}
        >
          الاشتباك التكتيكي المقترح
        </span>
        <p className="text-xl font-black text-white leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
          {tacticalAdvice.action}
        </p>
        
        {/* Subtle background glow */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none" style={{ background: colors.text }} />
      </div>
    </motion.div>
  );
}

