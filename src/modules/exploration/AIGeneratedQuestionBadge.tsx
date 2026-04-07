/**
 * AIGeneratedQuestionBadge — بادج يظهر لو السؤال من الـ AI
 * ============================================================
 * يستخدمه DailyPulseWidget عشان يوضح للمستخدم إن السؤال ده جديد
 */

import type { FC } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";

interface AIGeneratedQuestionBadgeProps {
  /** هل السؤال AI-generated؟ */
  isAIGenerated: boolean;
  /** Voice alignment score (0-10) — لو عايز توريه */
  voiceScore?: number;
  /** Compact mode (صغير) */
  compact?: boolean;
}

export const AIGeneratedQuestionBadge: FC<AIGeneratedQuestionBadgeProps> = ({
  isAIGenerated,
  voiceScore,
  compact = false,
}) => {
  if (!isAIGenerated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{
        background: "rgba(139,92,246,0.12)",
        border: "1px solid rgba(139,92,246,0.25)",
        color: "#a78bfa",
        fontSize: compact ? "10px" : "11px",
        fontWeight: 600,
      }}
      title={
        voiceScore
          ? `AI Generated • Voice Alignment: ${voiceScore}/10`
          : "سؤال جديد من الذكاء الاصطناعي"
      }
    >
      <Wand2 className="w-3 h-3" style={{ opacity: 0.8 }} />
      <span>{compact ? "AI" : "سؤال جديد"}</span>
      {!compact && <Sparkles className="w-2.5 h-2.5" style={{ opacity: 0.6 }} />}
    </motion.div>
  );
};

/**
 * AIGenerationButton — زر لتوليد سؤال جديد
 */
interface AIGenerationButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const AIGenerationButton: FC<AIGenerationButtonProps> = ({
  onClick,
  isGenerating,
  disabled = false,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="organic-tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all"
      style={{
        background: disabled ? "rgba(100,100,100,0.12)" : "rgba(139,92,246,0.15)",
        border: `1px solid ${disabled ? "rgba(100,100,100,0.2)" : "rgba(139,92,246,0.3)"}`,
        color: disabled ? "rgba(148,163,184,0.5)" : "#a78bfa",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: isGenerating ? 0.6 : 1,
      }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <motion.div
        animate={isGenerating ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Wand2 className="w-3.5 h-3.5" />
      </motion.div>
      <span>{isGenerating ? "جاري التوليد..." : "سؤال جديد من AI"}</span>
    </motion.button>
  );
};

/**
 * AIQualityIndicator — مؤشر جودة المحتوى المُولّد
 */
interface AIQualityIndicatorProps {
  voiceScore: number; // 0-10
  depthScore?: number; // 0-10
}

export const AIQualityIndicator: FC<AIQualityIndicatorProps> = ({
  voiceScore,
  depthScore,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 8) return "#34d399"; // green
    if (score >= 6) return "#fbbf24"; // yellow
    return "#f87171"; // red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 8) return "ممتاز";
    if (score >= 6) return "جيد";
    return "محتاج تحسين";
  };

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Voice Score */}
      <div className="flex items-center gap-1">
        <span style={{ color: "rgba(148,163,184,0.6)" }}>الصوت:</span>
        <span
          className="font-bold"
          style={{ color: getScoreColor(voiceScore) }}
        >
          {voiceScore}/10
        </span>
      </div>

      {/* Depth Score (optional) */}
      {depthScore !== undefined && (
        <>
          <span style={{ color: "rgba(148,163,184,0.3)" }}>|</span>
          <div className="flex items-center gap-1">
            <span style={{ color: "rgba(148,163,184,0.6)" }}>العمق:</span>
            <span
              className="font-bold"
              style={{ color: getScoreColor(depthScore) }}
            >
              {depthScore}/10
            </span>
          </div>
        </>
      )}

      {/* Label */}
      <span
        className="font-medium mr-1"
        style={{ color: getScoreColor(voiceScore) }}
      >
        {getScoreLabel(voiceScore)}
      </span>
    </div>
  );
};
