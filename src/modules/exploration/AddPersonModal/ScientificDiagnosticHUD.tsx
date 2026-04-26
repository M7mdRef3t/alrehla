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
  const [statusText, setStatusText] = useState("بنجمع البيانات...");

  useEffect(() => {
    // Initial Radar Ping
    soundManager.playRadarPing();
    
    // Start Scanning Sound
    soundManager.playScanning();
    
    const duration = 1800; // 1.8 seconds — fast and purposeful
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const statuses = [
      `بنتعرف على ${personName}...`,
      "بنفهم طبيعة العلاقة...",
      "بنحلل مشاعرك...",
      "بنحسب مدى الأمان...",
      "بنجهزلك النتيجة..."
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
      
      {/* Subtle pulse effect */}
      <motion.div 
        className="absolute inset-x-0 h-[1px] bg-teal-400/10 z-10"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ 
          opacity: 0, 
          scale: 1.5,
          filter: "blur(20px)",
          transition: { duration: 0.5, ease: "easeIn" }
        }}
        className="text-center space-y-10 flex flex-col items-center relative z-20"
      >
        {/* Core HUD Element — simplified */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Outer Ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-teal-500/15 border-t-teal-400/50"
          />
          {/* Inner Ring */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-dashed border-teal-500/10"
          />
          {/* Pulse */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-10 rounded-full bg-teal-500/8 border border-teal-400/20"
          />
          {/* Percent */}
          <div className="relative z-10 font-alexandria text-4xl font-black text-teal-400">
            {Math.floor(scanProgress)}<span className="text-lg text-teal-600 ml-0.5">%</span>
          </div>
        </div>

        {/* Status Text Block */}
        <div className="space-y-4 w-64">
           <div className="flex justify-between text-xs font-bold text-teal-500 px-1 font-tajawal" dir="rtl">
             <span>جاري التحليل</span>
             <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-teal-400">✦</motion.span>
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
               className="text-sm text-[var(--consciousness-text-muted)] font-bold tracking-wide h-5"
             >
               {statusText}
             </motion.p>
           </AnimatePresence>

           <p className="text-xs text-zinc-500 font-tajawal pt-2" dir="rtl">
              بنجهزلك النتيجة...
           </p>
        </div>
      </motion.div>

    </div>
  );
};
