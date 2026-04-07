import type { FC } from "react";
import { motion } from "framer-motion";
import { setOnboardingSeen } from "@/utils/mapOnboarding";
import { X, Radar, Activity, Brain } from "lucide-react";

interface MapOnboardingOverlayProps {
  onClose: () => void;
}

export const MapOnboardingOverlay: FC<MapOnboardingOverlayProps> = ({ onClose }) => {
  const handleFinish = () => {
    setOnboardingSeen();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative glass-card border border-white/10 rounded-3xl max-w-sm w-full p-6 text-right overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,10,26,0.98) 100%)",
        }}
      >
        <button
          onClick={handleFinish}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-500 hover:text-white transition-colors hover:bg-white/5"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-bold text-white mb-6 pr-2">خريطة العلاقات</h2>

        <div className="space-y-5 mb-8">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              أضف أول شخص أو علاقة لتبدأ قراءة الصورة الحالية.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Radar className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              الدوائر بتوضح لك القرب، الضغط، ومساحة الأمان حولك.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              الخريطة تتبدل مع الوقت بحسب ما تضيفه وتراجعه.
            </p>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="w-full py-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-[0.98]"
        >
          ابدأ الاستكشاف
        </button>
      </motion.div>
    </div>
  );
};


