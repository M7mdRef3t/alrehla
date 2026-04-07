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
      <div className="w-32 h-32 rounded-[3rem] flex items-center justify-center text-6xl relative shadow-2xl"
        style={{ 
          background: `radial-gradient(circle at center, ${colors.bg}, transparent)`, 
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 40px ${colors.bg}`
        }}
      >
        {tacticalAdvice.icon}
        <motion.div 
          className="absolute inset-0 rounded-[3rem]" 
          animate={{ boxShadow: [`0 0 20px ${colors.border}`, `0 0 40px ${colors.border}`, `0 0 20px ${colors.border}`] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-3xl font-black tracking-tight text-app-foreground drop-shadow-sm">{tacticalAdvice.title}</h3>
        <p className="text-app-muted-foreground text-base max-w-[320px] leading-relaxed mx-auto font-medium">
          {tacticalAdvice.message}
        </p>
      </div>
      
      <motion.div 
        className="w-full p-6 rounded-[2.5rem] bg-app-muted border border-app-border shadow-xl backdrop-blur-md relative overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
        <span className="text-[11px] font-black uppercase tracking-[0.3em] block mb-4"
          style={{ color: colors.text }}
        >
          خطة العمل
        </span>
        <p className="text-xl font-black text-app-foreground leading-tight tracking-tight">{tacticalAdvice.action}</p>
      </motion.div>
    </motion.div>
  );
}

