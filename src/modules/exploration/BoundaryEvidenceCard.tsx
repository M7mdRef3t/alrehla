import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2, FileText, Activity, ShieldCheck, Zap } from "lucide-react";
import type { BoundaryEvidenceSnapshot } from "@/utils/boundaryEvidence";

interface BoundaryEvidenceCardProps {
  evidence: BoundaryEvidenceSnapshot;
}

const toneTokens: Record<
  BoundaryEvidenceSnapshot["tone"],
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
  }
};

export const BoundaryEvidenceCard: FC<BoundaryEvidenceCardProps> = ({ evidence }) => {
  const [copied, setCopied] = useState(false);
  const theme = toneTokens[evidence.tone];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(evidence.copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full py-12 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background glow */}
      <div 
        className="absolute top-1/2 left-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-10"
        style={{ background: `radial-gradient(circle, ${theme.primary}, transparent)` }}
      />
      
      <div className="relative z-10 text-right space-y-8">
        {/* Header Section */}
        <div className="flex items-start justify-between w-full">
           <button
             type="button"
             onClick={() => void handleCopy()}
             className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 group shrink-0"
           >
             <AnimatePresence mode="wait">
               {copied ? (
                 <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                   <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">تم النسخ</span>
                 </motion.div>
               ) : (
                 <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                   <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                   <span className="text-[10px] font-black text-slate-400 group-hover:text-white tracking-widest uppercase">نسخ الملف</span>
                 </motion.div>
               )}
             </AnimatePresence>
           </button>

           <div className="text-right">
             <div className="flex items-center justify-end gap-3 mb-1">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: theme.primary }}>رصد الأدلة</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }} />
             </div>
             <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {evidence.title}
             </h3>
           </div>
        </div>

        {/* Narrative Summary */}
        <p className="text-2xl text-slate-300 font-medium leading-relaxed max-w-2xl">
          {evidence.summary}
        </p>

        {/* Evidence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
           {/* Left: Metrics */}
           <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="p-6 rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 blur-2xl pointer-events-none" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ثقة الملف</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{evidence.confidenceScore}</span>
                    <span className="text-sm font-bold text-slate-500">%</span>
                 </div>
                 <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${evidence.confidenceScore}%` }}
                      className="h-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                 </div>
              </div>

              <div className="p-6 rounded-[2.5rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">نافذة القرار</p>
                 <p className="text-md font-bold text-white leading-tight">{evidence.actionWindow}</p>
              </div>
           </div>

           {/* Right: Evidence List */}
           <div className="lg:col-span-2 p-8 rounded-[3rem] border border-white/10 bg-black/20 backdrop-blur-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 text-right">
                 <FileText className="w-4 h-4" />
                 الأدلة المرصودة
              </h4>
              
              <div className="space-y-5">
                 {evidence.items.map((item, idx) => (
                    <motion.div 
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-start gap-4 group"
                    >
                       <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 mt-0.5 group-hover:bg-white/10 transition-colors">
                          <Activity className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                       </div>
                       <span className="text-md font-bold text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                          {item}
                       </span>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>

        {/* Global Signal */}
        <div className="pt-6 flex items-center justify-center">
           <div className="px-6 py-3 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">الإشارة الأقوى:</span>
              <span className="text-xs font-black text-white">{evidence.strongestSignal}</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
