import { motion, AnimatePresence } from "framer-motion";

interface AnalysisOverlayProps {
  isAnalyzing: boolean;
}

export function AnalysisOverlay({ isAnalyzing }: AnalysisOverlayProps) {
  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-app/95 backdrop-blur-3xl" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          style={{ background: "color-mix(in srgb, var(--ds-color-space-void) 92%, transparent)" }}
        >
          <div className="relative w-24 h-24 mb-8">
            <motion.div
              className="absolute inset-0 rounded-full border border-teal-500/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border-2 border-teal-500/40 border-t-teal-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-8 rounded-full bg-teal-500/10 flex items-center justify-center"
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <p className="text-teal-400 text-xs font-black tracking-[0.2em] uppercase">
              جاري تحليل النبض...
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Quantum Calculation Active
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

