import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2 } from "lucide-react";
import type { PressureSentenceSnapshot } from "@/utils/pressureSentence";

interface PressureSentenceCardProps {
  snapshot: PressureSentenceSnapshot;
}

const toneTokens: Record<
  PressureSentenceSnapshot["tone"],
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
  steady: {
    primary: "var(--ds-color-accent-indigo)",
    glow: "rgba(124, 58, 237, 0.2)",
    text: "var(--ds-color-accent-indigo)",
    bgSoft: "rgba(124, 58, 237, 0.05)"
  }
};

export const PressureSentenceCard: FC<PressureSentenceCardProps> = ({ snapshot }) => {
  const [copied, setCopied] = useState(false);
  const theme = toneTokens[snapshot.tone];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snapshot.copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-12 relative overflow-hidden flex flex-col items-center"
      dir="rtl"
    >
      {/* Dynamic Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none opacity-20"
        style={{ background: `radial-gradient(circle, ${theme.primary}, transparent)` }}
      />
      
      <div className="w-full max-w-2xl relative z-10 flex flex-col gap-8">
        
        {/* Sovereign Header: Action | Title */}
        <div className="flex items-start justify-between w-full">
          {/* Action Left */}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 group"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400">تم النسخ</span>
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  <span className="text-xs font-black text-slate-400 group-hover:text-white">نسخ الجملة</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Title Right */}
          <div className="text-right">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] block mb-1">ترياق سيادي: {snapshot.sourceLabel}</span>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {snapshot.title}
            </h3>
          </div>
        </div>

        {/* Sovereign Logic & Reasoning */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/20" />
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              المنطق السيادي
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-bold">
              {snapshot.reasoning}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500/20" />
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
              سياق الاستخدام
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              استخدم الدرع ده في أي رسالة (WhatsApp) أو رد سريع على مكالمة عشان تفرض "قواعدك" قبل ما الطرف التاني يبدأ يسحب طاقك.
            </p>
          </div>
        </div>

        {/* Tactical Subtitle */}
        <p className="text-center text-lg sm:text-xl text-slate-300 font-medium leading-relaxed max-w-xl mx-auto opacity-80 decoration-teal-500/30">
          {snapshot.summary}
        </p>

        {/* The Instrument: Deep Glass Card */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="relative py-16 px-8 sm:px-16 rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center text-center"
          style={{ 
            background: "rgba(10, 12, 24, 0.6)",
            backdropFilter: "blur(40px)"
          }}
        >
          {/* Subtle Inner Glows */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 blur-3xl pointer-events-none" />
          
          <p className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight sm:leading-snug tracking-tight drop-shadow-2xl">
              "{snapshot.sentence}"
          </p>
        </motion.div>

        {/* Intelligence Tag */}
        <div className="flex justify-center mt-2">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] opacity-50">
            تم الاستنتاج بناءً على نمط الانحراف المرصود
          </p>
        </div>

      </div>
    </motion.div>
  );
};
