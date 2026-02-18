import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mapCopy } from "../copy/map";
import { setOnboardingSeen } from "../utils/mapOnboarding";
import { EditableText } from "./EditableText";

interface MapOnboardingOverlayProps {
  onClose: () => void;
}

export const MapOnboardingOverlay: FC<MapOnboardingOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);

  const handleFinish = () => {
    setOnboardingSeen();
    onClose();
  };

  const steps = [
    {
      id: 1,
      title: "أهلاً بك في غرفة العمليات",
      text: "دي مش مجرد خريطة.. دي أرض المعركة الخاصة بيك. كل دايرة بتمثل 'جبهة' في حياتك محتاج تأمنها."
    },
    {
      id: 2,
      title: "توزيع القوات",
      text: "الأخضر: مناطق آمنة (شحن طاقة).\nالأصفر: مناطق حذر (استنزاف محتمل).\nالأحمر: مناطق خطر (استنزاف عالي).\nالرمادي: أرشيف (معارك انتهت)."
    }
  ];

  const current = steps.find((s) => s.id === step)!;
  const isLast = step === steps.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-8 text-right overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Tactical Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-teal-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            {current.title}
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-slate-300 text-lg leading-relaxed mb-8 whitespace-pre-line"
            >
              {current.text}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-4 justify-end">
            <button
              onClick={handleFinish}
              className="px-6 py-2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              تجاوز الشرح
            </button>

            <motion.button
              onClick={isLast ? handleFinish : () => setStep(step + 1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-900/20 flex items-center gap-2"
            >
              {isLast ? "استلم القيادة" : "التالي"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
