import { motion, AnimatePresence } from "framer-motion";

interface AnalysisOverlayProps {
  isAnalyzing: boolean;
}

export function AnalysisOverlay({ isAnalyzing }: AnalysisOverlayProps) {
  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-6" />
          <p className="text-teal-400 text-xs font-bold tracking-wide animate-pulse">
            بنحلّل حالتك...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

