import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

interface MapTopNavProps {
  /** Number of completed journey milestones */
  currentStep: number;
  /** Total milestones in this journey */
  totalSteps: number;
  /** Optional: active breadcrumb label */
  breadcrumbLabel?: string;
  /** Optional: steps subtitle */
  stepsLabel?: string;
}

export function MapTopNav({ 
  currentStep, 
  totalSteps, 
  breadcrumbLabel = "خريطة العلاقات",
  stepsLabel
}: MapTopNavProps) {
  // Derive a meaningful steps label from progress
  const computedStepsLabel = stepsLabel ?? (
    currentStep === 0 ? "ابدأ رحلتك" :
    currentStep >= totalSteps ? "أكملت خطواتك ✨" :
    `${currentStep} من ${totalSteps} خطوات`
  );

  return (
    <div className="absolute top-[110px] left-6 right-6 h-16 z-40 flex items-center justify-between pointer-events-none" dir="rtl">
      {/* 🧭 Breadcrumbs */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl pointer-events-auto border border-white/10 shadow-xl"
        style={{
          background: "rgba(15,23,42,0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Home size={16} className="text-teal-400" />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
            <span>/map</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-white">{breadcrumbLabel}</span>
        </div>
      </motion.div>

      {/* 🪜 Steps Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-6 pointer-events-auto"
      >
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 tracking-wide">{computedStepsLabel}</span>
            <div className="flex gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div 
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i < currentStep ? 'w-8 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'w-1.5 bg-white/10'}`}
                    />
                ))}
            </div>
        </div>
      </motion.div>
    </div>
  );
}
