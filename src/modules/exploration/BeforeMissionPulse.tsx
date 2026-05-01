/**
 * 🔬 Before Mission Pulse — تسجيل مستوى الضغط قبل بدء المهمة
 * ============================================================
 * سؤال واحد بسيط: "الموضوع ده مسبب ليك ضغط قد إيه؟"
 * الإجابة بتتسجل عشان نقارنها بعد إكمال المهمة
 */

import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge, ArrowLeft } from "lucide-react";
import type { Ring } from "@/modules/map/mapTypes";
import { recordBeforePulse } from "@/services/realityFeedbackEngine";

interface BeforeMissionPulseProps {
  nodeId: string;
  nodeLabel: string;
  currentRing: Ring;
  onComplete: (recordId: string) => void;
  onSkip: () => void;
}

const stressLabels: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: "مرتاح تماماً", emoji: "😌", color: "#10b981" },
  2: { label: "شبه مرتاح", emoji: "🙂", color: "#34d399" },
  3: { label: "عادي", emoji: "😐", color: "#a3e635" },
  4: { label: "قلق خفيف", emoji: "😕", color: "#fbbf24" },
  5: { label: "ضغط متوسط", emoji: "😟", color: "#f59e0b" },
  6: { label: "ضغط واضح", emoji: "😰", color: "#f97316" },
  7: { label: "ضغط شديد", emoji: "😤", color: "#ef4444" },
  8: { label: "مش قادر أركز", emoji: "🤯", color: "#dc2626" },
  9: { label: "ألم نفسي", emoji: "😢", color: "#b91c1c" },
  10: { label: "حالة طوارئ", emoji: "🆘", color: "#991b1b" },
};

export const BeforeMissionPulse: FC<BeforeMissionPulseProps> = ({
  nodeId,
  nodeLabel,
  currentRing,
  onComplete,
  onSkip,
}) => {
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [isRecording, setIsRecording] = useState(false);

  const currentStress = stressLabels[stressLevel];

  const handleRecord = () => {
    setIsRecording(true);
    const record = recordBeforePulse({
      nodeId,
      nodeLabel,
      stressBefore: stressLevel,
      currentRing,
    });
    setTimeout(() => {
      onComplete(record.id);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full p-6 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)" }}
        >
          <Gauge className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white font-tajawal">
            قبل ما تبدأ — قِس نفسك
          </h4>
          <p className="text-[11px] text-white/40 font-tajawal">
            عشان نعرف بعدين لو المسار حقق فرق فعلي
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-base font-bold text-white/80 mb-2 font-tajawal">
          الموضوع مع <span className="text-teal-400">{nodeLabel}</span> مسبب ليك ضغط قد إيه؟
        </p>
      </div>

      {/* Stress Level Indicator */}
      <div className="mb-6 text-center">
        <motion.div
          key={stressLevel}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-5xl">{currentStress.emoji}</span>
          <span className="text-lg font-black" style={{ color: currentStress.color }}>
            {stressLevel}/10
          </span>
          <span className="text-sm font-bold text-white/60 font-tajawal">
            {currentStress.label}
          </span>
        </motion.div>
      </div>

      {/* Slider */}
      <div className="mb-8 px-2">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={stressLevel}
          onChange={(e) => setStressLevel(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to left, ${currentStress.color} ${(stressLevel / 10) * 100}%, rgba(255,255,255,0.1) ${(stressLevel / 10) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-white/30 font-tajawal">مرتاح</span>
          <span className="text-[10px] text-white/30 font-tajawal">ضغط شديد</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          onClick={handleRecord}
          disabled={isRecording}
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-3.5 rounded-2xl text-sm font-black transition-all"
          style={{
            background: isRecording
              ? "rgba(45,212,191,0.3)"
              : "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(45,212,191,0.1))",
            border: "1px solid rgba(45,212,191,0.3)",
            color: "#5eead4",
          }}
        >
          {isRecording ? "✓ تم التسجيل" : "سجّل وابدأ المهمة"}
        </motion.button>
        <button
          onClick={onSkip}
          className="px-4 py-3.5 rounded-2xl text-sm font-bold text-white/40 hover:text-white/60 transition-colors bg-white/5"
        >
          تخطي
        </button>
      </div>
    </motion.div>
  );
};
