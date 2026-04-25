"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap as Sparkles, X, ChevronRight, BookOpen, ScrollText } from "lucide-react";
import { useGamification } from "@/domains/gamification";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";

export function ChronicleOverlay() {
  const lastNewChronicle = useGamification().lastNewChronicle;
  const clearChronicleState = useGamification().clearChronicleState;
  const { setOverlay } = useAppOverlayState();

  if (!lastNewChronicle) return null;

  const handleClose = () => {
    clearChronicleState();
    setOverlay("sovereignChronicle", false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      {/* Cinematic Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Animated Light Streaks (Ambient Resonance) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-teal-500/10 blur-[120px] rounded-full"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div 
        className="relative w-full max-w-2xl bg-white/[0.02] border border-white/10 rounded-[4rem] p-12 md:p-20 text-center shadow-[0_64px_128px_rgba(0,0,0,0.8)] overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="relative z-10 space-y-12">
          <motion.div 
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center shadow-2xl"
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <ScrollText className="w-10 h-10 text-white/80" />
          </motion.div>

          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2"
            >
               <div className="h-px w-8 bg-white/10" />
               <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">سجل القيادة</span>
               <div className="h-px w-8 bg-white/10" />
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-5xl font-black text-white leading-[1.2] tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              مرحلة جديدة <br />
              في مدارك {lastNewChronicle.level}
            </motion.h2>

            <motion.p 
              className="text-xl md:text-2xl text-white/70 font-medium leading-relaxed italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2 }}
            >
              "{lastNewChronicle.text}"
            </motion.p>
          </div>

          <motion.div 
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <button 
              onClick={handleClose}
              className="group relative px-10 py-5 bg-white text-black rounded-full font-black text-sm flex items-center justify-center gap-3 mx-auto overflow-hidden hover:scale-105 active:scale-95 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">استمرار الرحلة</span>
              <ChevronRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute bottom-0 left-0 p-8 opacity-20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </motion.div>
    </div>
  );
}
