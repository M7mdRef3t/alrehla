"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShieldCheck, Timer } from "lucide-react";

interface ActivationPulseProps {
  isChecking: boolean;
  status: "pending" | "activated";
  method?: string;
}

export function ActivationPulse({ isChecking, status, method }: ActivationPulseProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isChecking) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isChecking]);

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-background/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Background Pulse Effect */}
      <AnimatePresence>
        {isChecking && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-primary rounded-full pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
           animate={isChecking ? { 
             scale: [1, 1.1, 1],
             rotate: [0, 5, -5, 0]
           } : {}}
           transition={{ repeat: Infinity, duration: 3 }}
           className={`p-5 rounded-2xl mb-6 ${status === 'activated' ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'}`}
        >
          {status === 'activated' ? (
            <ShieldCheck className="w-12 h-12" />
          ) : (
            <Zap className="w-12 h-12 fill-current" />
          )}
        </motion.div>

        <h3 className="text-2xl font-bold mb-2 transition-all duration-300">
          {status === 'activated' ? 'تم التفعيل بنجاح! 🎉' : 'جاري تأكيد الدفع...'}
        </h3>
        
        <p className="text-muted-foreground max-w-[280px] text-sm leading-relaxed">
          {status === 'activated' 
            ? 'مبروك، رحلتك الكاملة بدأت الآن. استعد لاكتشاف دوائر حياتك.' 
            : `بنراجع التحويل اللي عملته عبر ${method || 'الوسيلة المختارة'}. الخطوة دي بتتم يدويًا لضمان الأمان.`}
        </p>

        {isChecking && (
          <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 font-mono text-xs text-primary/80">
            <Timer className="w-3 h-3 animate-spin-slow" />
            <span>نظام النبض نشط{dots}</span>
          </div>
        )}
      </div>
    </div>
  );
}
