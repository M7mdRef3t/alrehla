import React, { type FC, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Zap as Sparkles } from "lucide-react";

/**
 * v1_serenity_bridge 🧘‍♂️
 * Evolution: ADK Psychological Recovery (Analytical Rush Counter)
 * Decision: Subtle Pulse (نبض خفيف) to integrate with "Alrehla" rhythm.
 */

interface SerenityBridgeProps {
  onOpenNoise: () => void;
  pulseMode?: string;
}

const SerenityBridge: FC<SerenityBridgeProps> = ({ onOpenNoise, pulseMode }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-24 right-4 z-[100] pointer-events-auto"
    >
      <div className="relative group">
        {/* Subtle Pulse Rings - The "Serenity Echo" */}
        <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping duration-[3000ms]" />
        <div className="absolute inset-0 rounded-full bg-teal-400/10 animate-ping duration-[5000ms] delay-1000" />

        <button
          onClick={onOpenNoise}
          className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/60 backdrop-blur-3xl border border-teal-500/30 text-teal-300 hover:bg-teal-500/10 hover:border-teal-400/60 transition-all shadow-[0_0_20px_rgba(45,212,191,0.1)] group-hover:shadow-[0_0_30px_rgba(45,212,191,0.2)]"
        >
          <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500/20 transition-colors">
            <Wind size={18} className="animate-pulse" />
          </div>
          
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-400 opacity-60">جسر العودة</span>
            <span className="text-[11px] font-bold text-slate-200">استرجع سكينة الرحلة</span>
          </div>

          <Sparkles size={12} className="text-teal-400/40 group-hover:text-teal-400 transition-colors" />
        </button>

        {/* Narrative Context (Only visible on hover or ADK trigger) */}
        <div className="absolute bottom-full right-0 mb-4 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           <div className="p-3 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl">
              <p className="text-[10px] text-slate-400 leading-relaxed text-right" dir="rtl">
                رصدنا رنين عالي من التوتر التحليلي.. السكينة هي المركز اللي هتقدر تقرر منه بوضوح أكتر.
              </p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(SerenityBridge);
