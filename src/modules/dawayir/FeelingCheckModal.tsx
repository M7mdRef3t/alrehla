import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Clock, Zap, Coins, Maximize, Heart, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMapState } from "@/state/mapState";
import { FeelingCheckAsset } from "../map/mapTypes";

interface AssetQuestion {
  id: FeelingCheckAsset;
  icon: any;
  label: string;
  question: string;
  lowLabel: string;
  highLabel: string;
}

const QUESTIONS: AssetQuestion[] = [
  {
    id: "body",
    icon: User,
    label: "صحتك وجسمك",
    question: "جسمك بيقولك إيه النهاردة؟",
    lowLabel: "تعبان/مجهد",
    highLabel: "مرتاح/نشيط",
  },
  {
    id: "time",
    icon: Clock,
    label: "وقتك",
    question: "يومك ملكك ولّا ملك الناس؟",
    lowLabel: "مبقوق/مضغوط",
    highLabel: "مرتب/كافي",
  },
  {
    id: "energy",
    icon: Zap,
    label: "طاقتك وشغفك",
    question: "بطاريتك فيها كام في المية؟",
    lowLabel: "فارغة",
    highLabel: "فل",
  },
  {
    id: "money",
    icon: Coins,
    label: "ميزانيتك",
    question: "الفلوس رايحة في مكانها الصح؟",
    lowLabel: "نزيف/ديون",
    highLabel: "أمان/استقرار",
  },
  {
    id: "space",
    icon: Maximize,
    label: "مساحتك الخاصة",
    question: "عندك مكان تهرب فيه من الدوشة؟",
    lowLabel: "مخنوق/مفيش",
    highLabel: "واسعة/هادية",
  },
];

interface Props {
  onClose: () => void;
}

export function FeelingCheckModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<Record<string, number>>({
    body: 50,
    time: 50,
    energy: 50,
    money: 50,
    space: 50,
  });
  
  const updateFeelingResults = useMapState((s) => s.updateFeelingResults);
  
  const currentQ = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      updateFeelingResults(results);
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-app-surface border border-app-border rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header/Progress */}
        <div className="absolute top-0 left-0 w-full h-1 bg-app-muted/10">
          <motion.div 
            className="h-full bg-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.3)]"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 pt-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <currentQ.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-sm font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">{currentQ.label}</span>
            </div>
            <span className="text-xs font-mono text-app-muted">{step + 1} / {QUESTIONS.length}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              <h2 className="text-2xl font-black text-app-primary leading-tight">
                {currentQ.question}
              </h2>

              <div className="space-y-6">
                <input
                  id={`feeling-check-${currentQ.id}`}
                  name={`feelingCheck${currentQ.id}`}
                  type="range"
                  min="0"
                  max="100"
                  value={results[currentQ.id]}
                  onChange={(e) => setResults(prev => ({ ...prev, [currentQ.id]: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-app-bg rounded-full appearance-none cursor-pointer accent-teal-500 slider-thumb-premium border border-app-border"
                />
                
                <div className="flex justify-between text-xs font-bold tracking-wide">
                  <span className="text-rose-600/70 dark:text-rose-400/70">{currentQ.lowLabel}</span>
                  <span className="text-teal-600/70 dark:text-teal-400/70">{currentQ.highLabel}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-4 mt-12">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-app-border text-app-muted hover:bg-app-bg transition-all text-sm font-bold"
              >
                <ArrowRight className="w-4 h-4" /> رجوع
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 hover:bg-teal-500 dark:hover:bg-teal-400 transition-all text-sm font-black shadow-lg shadow-teal-500/20"
            >
              {step === QUESTIONS.length - 1 ? (
                <>شوف خريطتك <Check className="w-4 h-4" /></>
              ) : (
                <>التالي <ArrowLeft className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-app-bg/50 p-6 flex items-center gap-3 border-t border-app-border">
          <Heart className="w-4 h-4 text-rose-500" />
          <p className="text-[10px] font-bold text-app-muted leading-relaxed uppercase tracking-widest">
            حُسّك هو أهم داتا. جاوب بصدق عشان تشوف صورتك الحقيقية.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
