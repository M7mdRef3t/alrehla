import { motion, AnimatePresence } from "framer-motion";

interface AnalysisOverlayProps {
  isAnalyzing: boolean;
}

export function AnalysisOverlay({ isAnalyzing }: AnalysisOverlayProps) {
  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-3xl overflow-hidden" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          {/* Scanning Line */}
          <motion.div 
            className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_20px_#22d3ee] z-10"
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Hexagon Core (CSS only placeholder for sci-fi feel) */}
          <div className="relative w-24 h-24 mb-8">
             <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-[20%] rotate-45 animate-[spin_10s_linear_infinite]" />
             <div className="absolute inset-0 border border-teal-500/40 rounded-[15%] -rotate-12 animate-[spin_6s_linear_infinite_reverse]" />
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee] animate-pulse" />
             </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-cyan-400 text-xs font-black tracking-[0.3em] uppercase mb-1">
              Deep Scan Initiated
            </p>
            <p className="text-white/40 text-[10px] font-bold">
              معايرة الحالة الذهنية والجسدية...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

