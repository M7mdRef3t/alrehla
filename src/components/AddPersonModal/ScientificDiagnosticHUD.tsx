import React, { useEffect } from "react";
import { motion } from "framer-motion";

interface ScientificDiagnosticHUDProps {
  onComplete: (score: number) => void;
  personName: string;
  orbId: string;
  answers: Record<string, string>;
}

/**
 * ScientificDiagnosticHUD (Repurposed as Seamless Transition)
 * يوفر نقلة ناعمة وبسيطة جداً لمدة 1.5 ثانية فقط قبل إظهار النتيجة.
 * (تم إزالة الرادار المعقد بناءً على قرارات تجربة المستخدم للحفاظ على الاتصال العاطفي).
 */
export const ScientificDiagnosticHUD: React.FC<ScientificDiagnosticHUDProps> = ({
  onComplete,
  personName
}) => {
  useEffect(() => {
    // محاكاة سريعة للتحليل بدون تشتيت (وقت قصير جداً للحفاظ على سرعة تدفق الإضافة)
    const timer = setTimeout(() => {
      onComplete(100); // Score is mostly ignored in next step layout anyway
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="text-center space-y-6 flex flex-col items-center"
      >
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border border-dashed border-cyan-500/40 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full border border-indigo-500/20" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-cyan-400 rounded-full blur-md opacity-60 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">
            جاري استيعاب <span className="text-cyan-400">"{personName}"</span>
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            نُحلل مسافة الأمان المناسبة...
          </p>
        </div>
      </motion.div>
    </div>
  );
};

