/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "@/services/soundManager";

interface ScientificDiagnosticHUDProps {
  onComplete: (score: number) => void;
  personName: string;
  orbId: string;
  answers: Record<string, string>;
}

export const ScientificDiagnosticHUD: React.FC<ScientificDiagnosticHUDProps> = ({
  onComplete,
  personName
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [statusText, setStatusText] = useState("بدء الربط العصبي...");

  useEffect(() => {
    // Initial Radar Ping
    soundManager.playRadarPing();
    
    // Start Scanning Sound
    soundManager.playScanning();
    
    const duration = 2800; // 2.8 seconds of cinematic glory
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const statuses = [
      `رصد نواة ${personName}...`,
      "مسح البنية العلائقية...",
      "تحليل البصمة الشعورية...",
      "حساب مدى الأمان...",
      "مزامنة بيانات السيادة..."
    ];

    const timer = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setScanProgress(progress);
      
      const statusIndex = Math.floor((progress / 100) * statuses.length);
      if (statuses[statusIndex]) setStatusText(statuses[statusIndex]);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => onComplete(100), 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col h-full bg-[var(--consciousness-background)] text-[var(--ds-theme-text-primary)] overflow-hidden font-sans select-none relative items-center justify-center p-8">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      
      {/* Scan Beam */}
      <motion.div 
        className="absolute inset-x-0 h-[2px] bg-[var(--consciousness-primary)] opacity-30 z-10 shadow-[0_0_20px_var(--consciousness-primary)]"
        animate={{ top: ["20%", "80%", "20%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="text-center space-y-10 flex flex-col items-center relative z-20"
      >
        {/* Core HUD Element */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Outer Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-teal-500/10 border-t-[var(--consciousness-primary)]"
          />
          {/* Middle Dotted Ring */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-dashed border-teal-500/20"
          />
          {/* Inner Pulse */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-10 rounded-full bg-[var(--ds-color-primary-glow)] border border-teal-500/30 shadow-[0_0_40px_var(--ds-color-primary-glow)]"
          />
          
          {/* Percent Text */}
          <div className="relative z-10 font-mono text-4xl font-black tracking-tighter text-[var(--consciousness-primary)]">
            {Math.floor(scanProgress)}<span className="text-xl opacity-50">%</span>
          </div>
        </div>

        {/* Status Text Block */}
        <div className="space-y-4 w-64">
           <div className="flex justify-between text-[10px] uppercase font-black tracking-[0.1em] text-[var(--consciousness-primary)]/40 px-1" dir="rtl">
             <span>قيد المسح الفحصي</span>
             <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>نشط</motion.span>
           </div>
           
           {/* Progress Bar Container */}
           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className="h-full bg-[var(--consciousness-primary)] shadow-[0_0_10px_var(--consciousness-primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
              />
           </div>

           <AnimatePresence mode="wait">
             <motion.p 
               key={statusText}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -5 }}
               className="text-sm text-white/70 font-bold tracking-wide h-5"
             >
               {statusText}
             </motion.p>
           </AnimatePresence>

           <p className="text-[10px] text-slate-500 font-mono tracking-widest pt-2" dir="ltr">
              سلامة الإشارة: 0.984_NX
           </p>
        </div>
      </motion.div>

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/10 rounded-tl-xl" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/10 rounded-tr-xl" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/10 rounded-bl-xl" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/10 rounded-br-xl" />
    </div>
  );
};


