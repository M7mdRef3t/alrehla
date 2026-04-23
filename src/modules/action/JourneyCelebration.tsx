import type { FC } from "react";
import { motion } from "framer-motion";
import { Zap as Sparkles } from "lucide-react";
import { useJourneyProgress } from "@/domains/journey";

interface JourneyCelebrationProps {
  onFinish: () => void;
}

export const JourneyCelebration: FC<JourneyCelebrationProps> = ({ onFinish }) => {
  const { baselineScore, postStepScore } = useJourneyProgress();

  const baseline = baselineScore ?? 0;
  const after = postStepScore ?? 0;
  const diff = after - baseline;

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-100 text-teal-600 mb-6"
      >
        <Sparkles className="w-10 h-10" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-bold text-slate-900 mb-2"
      >
        أحسنت، خلصت أول خطوة في الرحلة
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-600 mb-8"
      >
        ده انعكاس لحالك قبل وبعد ما شفت العلاقة بوضوح.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-8 mb-8"
      >
        <div className="px-6 py-4 rounded-2xl bg-slate-100 min-w-[100px]">
          <span className="text-sm text-slate-500 block mb-1">قبل</span>
          <span className="text-2xl font-bold text-slate-700">{baseline}</span>
        </div>
        <div className="px-6 py-4 rounded-2xl bg-teal-50 min-w-[100px]">
          <span className="text-sm text-slate-500 block mb-1">بعد</span>
          <span className="text-2xl font-bold text-teal-700">{after}</span>
        </div>
      </motion.div>

      {diff > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-teal-700 font-medium mb-8"
        >
          فرق +{diff} — الصورة بقت أوضح عندك.
        </motion.p>
      )}

      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onFinish}
        className="px-8 py-3.5 rounded-full bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
      >
        تمام، إغلاق الرحلة
      </motion.button>
    </div>
  );
};
