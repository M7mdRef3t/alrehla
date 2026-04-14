import type { FC } from "react";
import { motion } from "framer-motion";
import { Target, ShieldCheck, Zap } from "lucide-react";
import type { SovereigntySnapshot } from "@/utils/sovereigntySnapshot";

interface SovereigntySnapshotCardProps {
  snapshot: SovereigntySnapshot;
}

const toneTokens: Record<
  SovereigntySnapshot["tone"],
  { primary: string; glow: string; text: string; bgSoft: string }
> = {
  danger: {
    primary: "var(--ds-theme-status-critical)",
    glow: "rgba(244, 63, 94, 0.2)",
    text: "var(--ds-theme-status-critical)",
    bgSoft: "rgba(244, 63, 94, 0.05)"
  },
  caution: {
    primary: "var(--ds-color-accent-amber)",
    glow: "rgba(251, 191, 36, 0.2)",
    text: "var(--ds-color-accent-amber)",
    bgSoft: "rgba(251, 191, 36, 0.05)"
  },
  safe: {
    primary: "var(--ds-color-primary-glow)",
    glow: "rgba(45, 212, 191, 0.2)",
    text: "var(--ds-color-primary-glow)",
    bgSoft: "rgba(45, 212, 191, 0.05)"
  },
  steady: {
    primary: "var(--ds-color-accent-indigo)",
    glow: "rgba(124, 58, 237, 0.2)",
    text: "var(--ds-color-accent-indigo)",
    bgSoft: "rgba(124, 58, 237, 0.05)"
  }
};

export const SovereigntySnapshotCard: FC<SovereigntySnapshotCardProps> = ({ snapshot }) => {
  const theme = toneTokens[snapshot.tone];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full py-12 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background radial glow */}
      <div 
        className="absolute top-1/4 -right-20 w-80 h-80 blur-[100px] rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${theme.primary}, transparent)` }}
      />
      
      <div className="relative z-10 text-right space-y-8">
        {/* Sovereign Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: `0 0 20px ${theme.primary}` }} />
          <div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">الرؤية الخاصة</span>
             <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {snapshot.headline}
             </h3>
          </div>
        </div>

        {/* Diagnostic Narrative */}
        <p className="text-2xl leading-snug text-slate-300 font-medium max-w-2xl leading-relaxed">
          {snapshot.body}
        </p>

        {/* Quantized Analysis Layers */}
        <div className="py-10 px-8 rounded-[3.5rem] border border-white/10 relative overflow-hidden shadow-2xl"
          style={{ 
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(40px)"
          }}
        >
          <div className="absolute top-0 right-0 w-2 h-full opacity-60" style={{ backgroundColor: theme.primary }} />
          
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">إشارات البوصلة المرصودة</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.reasons.map((reason, idx) => (
              <motion.div 
                key={reason}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                 <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 mt-0.5">
                    <ShieldCheck className="w-4 h-4" style={{ color: theme.primary }} />
                 </div>
                 <span className="text-base font-bold text-slate-200 leading-tight">
                    {reason}
                 </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Accelerated CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
           <div className="px-6 py-4 rounded-2xl bg-[var(--ds-color-primary-soft)] border border-[var(--ds-color-primary-glow)] flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                 <Zap className="w-6 h-6" style={{ color: theme.primary }} />
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">الخطوة القادمة المحسومة</p>
                 <p className="text-lg font-black text-white leading-tight">{snapshot.ctaLabel}</p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

