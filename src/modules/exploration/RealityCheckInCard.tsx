/**
 * 🔬 Reality Check-In Card — بطاقة تسجيل التغيير الفعلي
 * ======================================================
 * بعد إكمال المهمة وبعد مرور 7 أيام:
 * "هل حصل تغيير فعلي في تعاملك مع هذا الشخص؟"
 * 
 * + خانة حرة + مؤشر الأثر (Before/After)
 */

import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, TrendingUp, TrendingDown, Minus, AlertTriangle, MessageSquare } from "lucide-react";
import type { RealityCheckAnswer, RealityFeedbackRecord } from "@/services/realityFeedbackEngine";
import { recordAfterPulse, recordRealityCheckIn } from "@/services/realityFeedbackEngine";
import type { Ring } from "@/modules/map/mapTypes";

interface RealityCheckInCardProps {
  record: RealityFeedbackRecord;
  currentRing: Ring;
  onComplete: () => void;
  onDismiss: () => void;
}

const answerOptions: Array<{
  value: RealityCheckAnswer;
  label: string;
  emoji: string;
  color: string;
  description: string;
}> = [
  {
    value: "yes_real_change",
    label: "لمست فرق حقيقي",
    emoji: "✅",
    color: "#10b981",
    description: "العلاقة اتحسنت أو الضغط قل بشكل واضح",
  },
  {
    value: "started_not_clear",
    label: "بدأت بس لسه مش واضح",
    emoji: "🔄",
    color: "#fbbf24",
    description: "في تغييرات بسيطة لكن محتاج وقت أكتر",
  },
  {
    value: "no_change",
    label: "لا، مفيش فرق",
    emoji: "❌",
    color: "#94a3b8",
    description: "نفّذت الخطوات لكن الوضع زي ما هو",
  },
  {
    value: "got_worse",
    label: "الوضع ساء أكتر",
    emoji: "⚠️",
    color: "#ef4444",
    description: "المسار ده مكنش مناسب للحالة دي",
  },
];

const stressLabels: Record<number, { emoji: string; color: string }> = {
  1: { emoji: "😌", color: "#10b981" },
  2: { emoji: "🙂", color: "#34d399" },
  3: { emoji: "😐", color: "#a3e635" },
  4: { emoji: "😕", color: "#fbbf24" },
  5: { emoji: "😟", color: "#f59e0b" },
  6: { emoji: "😰", color: "#f97316" },
  7: { emoji: "😤", color: "#ef4444" },
  8: { emoji: "🤯", color: "#dc2626" },
  9: { emoji: "😢", color: "#b91c1c" },
  10: { emoji: "🆘", color: "#991b1b" },
};

export const RealityCheckInCard: FC<RealityCheckInCardProps> = ({
  record,
  currentRing,
  onComplete,
  onDismiss,
}) => {
  const [phase, setPhase] = useState<"after_pulse" | "check_in" | "done">(
    record.status === "awaiting_after" ? "after_pulse" : "check_in"
  );
  const [stressAfter, setStressAfter] = useState<number>(5);
  const [selectedAnswer, setSelectedAnswer] = useState<RealityCheckAnswer | null>(null);
  const [freeText, setFreeText] = useState("");
  const [impactDelta, setImpactDelta] = useState<number | null>(null);

  const handleAfterPulse = () => {
    const updated = recordAfterPulse(record.id, stressAfter, currentRing);
    if (updated) {
      setImpactDelta(updated.impactScore);
      setPhase("check_in");
    }
  };

  const handleCheckIn = () => {
    if (!selectedAnswer) return;
    recordRealityCheckIn(record.id, selectedAnswer, freeText);
    setPhase("done");
    setTimeout(onComplete, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full p-6 rounded-3xl border border-teal-500/20 bg-black/40 backdrop-blur-2xl relative overflow-hidden"
      dir="rtl"
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.3), transparent)" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white font-tajawal">
            {phase === "after_pulse"
              ? "حان وقت القياس — إيه اللي اتغير؟"
              : phase === "check_in"
              ? "تأكيد التغيير الفعلي"
              : "✓ تم التسجيل"}
          </h4>
          <p className="text-[11px] text-white/40 font-tajawal">
            {record.nodeLabel} — بعد تنفيذ المهمة
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Phase 1: After Pulse — measure stress again */}
        {phase === "after_pulse" && (
          <motion.div
            key="after"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Before indicator */}
            <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[11px] text-white/40 font-tajawal mb-1">
                قبل المهمة كنت سجّلت:
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {stressLabels[record.pulse.stressBefore]?.emoji}
                </span>
                <span
                  className="text-lg font-black"
                  style={{ color: stressLabels[record.pulse.stressBefore]?.color }}
                >
                  {record.pulse.stressBefore}/10
                </span>
              </div>
            </div>

            <p className="text-sm font-bold text-white/70 mb-4 font-tajawal">
              دلوقتي — الضغط مع{" "}
              <span className="text-teal-400">{record.nodeLabel}</span> قد إيه؟
            </p>

            {/* After stress slider */}
            <div className="text-center mb-4">
              <span className="text-4xl">{stressLabels[stressAfter]?.emoji}</span>
              <span
                className="block text-lg font-black mt-1"
                style={{ color: stressLabels[stressAfter]?.color }}
              >
                {stressAfter}/10
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={stressAfter}
              onChange={(e) => setStressAfter(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-6"
              style={{
                background: `linear-gradient(to left, ${stressLabels[stressAfter]?.color} ${(stressAfter / 10) * 100}%, rgba(255,255,255,0.1) ${(stressAfter / 10) * 100}%)`,
              }}
            />

            <button
              onClick={handleAfterPulse}
              className="w-full py-3.5 rounded-2xl text-sm font-black bg-teal-500/15 border border-teal-500/25 text-teal-400 hover:bg-teal-500/25 transition-all"
            >
              سجّل وكمّل
            </button>
          </motion.div>
        )}

        {/* Phase 2: Reality Check-In */}
        {phase === "check_in" && (
          <motion.div
            key="checkin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Impact Delta Display */}
            {impactDelta !== null && (
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                {impactDelta > 0 ? (
                  <TrendingDown className="w-6 h-6 text-emerald-400" />
                ) : impactDelta < 0 ? (
                  <TrendingUp className="w-6 h-6 text-rose-400" />
                ) : (
                  <Minus className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <p
                    className="text-base font-black"
                    style={{
                      color:
                        impactDelta > 0
                          ? "#10b981"
                          : impactDelta < 0
                          ? "#ef4444"
                          : "#94a3b8",
                    }}
                  >
                    {impactDelta > 0
                      ? `الضغط قل بـ ${impactDelta} نقاط 🎉`
                      : impactDelta < 0
                      ? `الضغط زاد بـ ${Math.abs(impactDelta)} نقاط`
                      : "الضغط زي ما هو — لسه ما اتغيرش"}
                  </p>
                  <p className="text-[11px] text-white/40 font-tajawal">
                    من {record.pulse.stressBefore}/10 → {record.pulse.stressAfter}/10
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm font-bold text-white/70 mb-4 font-tajawal">
              بعيداً عن الأرقام — هل لمست فرق حقيقي في حياتك؟
            </p>

            {/* Answer options */}
            <div className="flex flex-col gap-2 mb-5">
              {answerOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedAnswer(opt.value)}
                  className={`w-full p-3.5 rounded-xl text-right transition-all flex items-center gap-3 ${
                    selectedAnswer === opt.value
                      ? "border-2"
                      : "border border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                  style={
                    selectedAnswer === opt.value
                      ? {
                          borderColor: opt.color,
                          background: `${opt.color}12`,
                        }
                      : undefined
                  }
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <span
                      className="text-sm font-black block"
                      style={{
                        color:
                          selectedAnswer === opt.value ? opt.color : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-white/40 font-tajawal">
                      {opt.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Free text */}
            <div className="relative mb-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[11px] text-white/30 font-tajawal">
                  لو حابب توضّح أكتر (اختياري)
                </span>
              </div>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="إيه اللي اتغير فعلاً... أو ليه مش حاسس بفرق..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/40 resize-none min-h-[80px] transition-colors font-tajawal"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleCheckIn}
              disabled={!selectedAnswer}
              className="w-full py-3.5 rounded-2xl text-sm font-black transition-all"
              style={{
                background: selectedAnswer
                  ? "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(45,212,191,0.1))"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${selectedAnswer ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: selectedAnswer ? "#5eead4" : "rgba(255,255,255,0.3)",
              }}
            >
              تأكيد التقييم
            </button>
          </motion.div>
        )}

        {/* Phase 3: Done */}
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.span
              className="text-5xl block mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              🔬
            </motion.span>
            <p className="text-lg font-black text-teal-400 font-tajawal mb-1">
              تم تسجيل أثر الرحلة
            </p>
            <p className="text-[12px] text-white/40 font-tajawal">
              كلامك النهارده هيساعدنا نحسّن المسار عشانك
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismiss */}
      {phase !== "done" && (
        <button
          onClick={onDismiss}
          className="w-full mt-3 py-2 text-[11px] text-white/30 hover:text-white/50 transition-colors font-tajawal"
        >
          مش دلوقتي — فكرني بعدين
        </button>
      )}
    </motion.div>
  );
};
