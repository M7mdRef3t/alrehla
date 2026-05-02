import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Zap } from "lucide-react";

interface TruthMeterProps {
  score: number; // 0-100
  size?: "sm" | "lg";
}

export const TruthMeter: React.FC<TruthMeterProps> = ({ score, size = "lg" }) => {
  const isHigh = score >= 70;
  const isLow = score <= 30;
  
  const getColor = () => {
    if (isHigh) return "from-emerald-400 to-teal-500";
    if (isLow) return "from-rose-400 to-orange-500";
    return "from-indigo-400 to-purple-500";
  };

  const getShadow = () => {
    if (isHigh) return "shadow-[0_0_20px_rgba(16,185,129,0.3)]";
    if (isLow) return "shadow-[0_0_20px_rgba(244,63,94,0.3)]";
    return "shadow-[0_0_20px_rgba(99,102,241,0.3)]";
  };

  const getLabel = () => {
    if (isHigh) return "إدراك حقيقي";
    if (isLow) return "وهم عاطفي";
    return "قيد التحقق";
  };

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            className={`h-full bg-gradient-to-r ${getColor()}`}
          />
        </div>
        <span className="text-[10px] font-bold text-white/50">{score}%</span>
      </div>
    );
  }

  return (
    <div className="relative p-6 bg-black/40 border border-white/5 rounded-3xl overflow-hidden group">
      {/* Background Pulse */}
      <motion.div 
        animate={{ 
          opacity: [0.05, 0.1, 0.05],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className={`absolute inset-0 bg-gradient-to-br ${getColor()} blur-3xl`}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${getShadow()}`}>
            {isHigh ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            ) : isLow ? (
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            ) : (
              <Zap className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">مقياس الحقيقة (Truth Score)</h4>
            <p className="text-lg font-black text-white">{getLabel()}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black text-white flex items-baseline gap-1">
            {score}
            <span className="text-sm text-white/30">%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute h-full bg-gradient-to-r ${getColor()} rounded-full`}
        >
          {/* Animated Highlight */}
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>

      <div className="mt-3 flex justify-between text-[10px] font-bold text-slate-500">
        <span>وهم (Illusion)</span>
        <span>حقيقة (Truth)</span>
      </div>
    </div>
  );
};
