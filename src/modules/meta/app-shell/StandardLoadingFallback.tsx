"use client";

import { AwarenessSkeleton } from "../AwarenessSkeleton";

interface StandardLoadingFallbackProps {
  color?: string;
  message?: string;
  fullScreen?: boolean;
  headerMode?: "standard" | "compact" | "none";
  className?: string;
}

import { motion } from "framer-motion";

export function StandardLoadingFallback({ 
  color = "teal", 
  message = "جاري استكشاف المسار...", 
  fullScreen = false,
  headerMode = "none",
  className = ""
}: StandardLoadingFallbackProps) {
  const colorClasses: Record<string, string> = {
    teal: "border-teal-500/30 border-t-teal-500",
    indigo: "border-indigo-500/30 border-t-indigo-500",
    violet: "border-violet-500/30 border-t-violet-500",
    cyan: "border-cyan-500/30 border-t-cyan-500",
    orange: "border-orange-500/30 border-t-orange-500",
    emerald: "border-emerald-500/30 border-t-emerald-500",
    pink: "border-pink-500/30 border-t-pink-500",
    red: "border-red-500/30 border-t-red-500",
    amber: "border-amber-500/30 border-t-amber-500",
    purple: "border-purple-500/30 border-t-purple-500",
    rose: "border-rose-500/30 border-t-rose-500",
    lime: "border-lime-500/30 border-t-lime-500",
  };

  const selectedColorClass = colorClasses[color] || colorClasses.teal;

  const getPaddingTop = () => {
    if (headerMode === "none") return "pt-0";
    return "pt-[64px] md:pt-[80px]";
  };

  const containerClasses = `
    ${fullScreen ? "fixed inset-0" : "flex-1 w-full h-full min-h-[500px]"} 
    flex flex-col items-center justify-center space-y-6 bg-[#02040a] z-[50]
    ${getPaddingTop()} ${className}
  `.trim();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={containerClasses}
      style={{ isolation: 'isolate' }}
    >
      <div className="relative">
        <div className={`w-16 h-16 rounded-full border-2 ${selectedColorClass} animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <AwarenessSkeleton className="scale-110" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          {message}
        </span>
      </div>
    </motion.div>
  );
}
