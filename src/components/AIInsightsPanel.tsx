/**
 * AIInsightsPanel — لوحة التحليل بالـ AI في ViewPersonModal
 * ============================================================
 * تعرض تحليل نفسي مُولّد بالـ AI لشخص معين
 */

import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertCircle, Target, Map } from "lucide-react";
import { useAIPersonInsights } from "@/hooks/useAIQuestionGenerator";

interface AIInsightsPanelProps {
  nodeId: string;
  /** اسم الشخص */
  personName: string;
}

export const AIInsightsPanel: FC<AIInsightsPanelProps> = ({ nodeId, personName }) => {
  const { insights, isGenerating, error, generateInsights } = useAIPersonInsights(nodeId);

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <h3 className="text-sm font-bold" style={{ color: "rgba(226,232,240,0.95)" }}>
            تحليل ذكي
          </h3>
          <Sparkles className="w-3 h-3" style={{ color: "#a78bfa", opacity: 0.6 }} />
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {!insights && !error ? (
          /* حالة: لم يُولّد التحليل بعد */
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-center p-6 rounded-xl"
            style={{
              background: "rgba(139,92,246,0.05)",
              border: "1px dashed rgba(139,92,246,0.2)",
            }}
          >
            <Brain
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "rgba(139,92,246,0.4)" }}
            />
            <p className="text-xs mb-4" style={{ color: "rgba(203,213,225,0.7)" }}>
              احصل على تحليل نفسي لعلاقتك بـ "{personName}"
            </p>
            <button
              type="button"
              onClick={generateInsights}
              disabled={isGenerating}
              className="organic-tap px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: isGenerating ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "#a78bfa",
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-3.5 h-3.5" />
                  </motion.div>
                  جاري التحليل...
                </span>
              ) : (
                "توليد التحليل"
              )}
            </button>
          </motion.div>
        ) : error ? (
          /* حالة: خطأ */
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} />
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#f87171" }}>
                  فشل التوليد
                </p>
                <p className="text-[11px]" style={{ color: "rgba(248,113,113,0.8)" }}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={generateInsights}
                  className="organic-tap text-[11px] font-medium mt-2"
                  style={{ color: "#f87171" }}
                >
                  حاول مرة تانية
                </button>
              </div>
            </div>
          </motion.div>
        ) : insights ? (
          /* حالة: تم التوليد بنجاح */
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            {/* التشخيص */}
            {insights.diagnosis && (
              <InsightCard
                icon={<Brain className="w-3.5 h-3.5" />}
                title="التشخيص"
                content={insights.diagnosis}
                color="#a78bfa"
              />
            )}

            {/* الأعراض */}
            {insights.symptoms && insights.symptoms.length > 0 && (
              <InsightCard
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                title="الأعراض"
                content={
                  <ul className="space-y-1.5">
                    {insights.symptoms.map((symptom: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span
                          className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                          style={{ background: "#fbbf24" }}
                        />
                        <span className="text-[11px] leading-relaxed">
                          {symptom}
                        </span>
                      </li>
                    ))}
                  </ul>
                }
                color="#fbbf24"
              />
            )}

            {/* الحل */}
            {insights.solution && (
              <InsightCard
                icon={<Target className="w-3.5 h-3.5" />}
                title="الحل المقترح"
                content={insights.solution}
                color="#34d399"
              />
            )}

            {/* خطة العمل */}
            {insights.planSuggestion && (
              <InsightCard
                icon={<Map className="w-3.5 h-3.5" />}
                title="الخطوة التالية"
                content={insights.planSuggestion}
                color="#2dd4bf"
              />
            )}

            {/* زر إعادة التوليد */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={generateInsights}
                disabled={isGenerating}
                className="organic-tap text-[10px] font-medium"
                style={{ color: "rgba(148,163,184,0.6)" }}
              >
                إعادة التحليل
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── تنبيه: هذا تحليل AI ── */}
      {insights && (
        <div
          className="p-2.5 rounded-lg text-[10px] text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            color: "rgba(148,163,184,0.5)",
          }}
        >
          ⚠️ هذا تحليل من ذكاء اصطناعي. للحصول على رعاية متخصصة، استشر معالج نفسي.
        </div>
      )}
    </div>
  );
};

/**
 * Insight Card — كارت معلومة واحدة
 */
interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  color: string;
}

const InsightCard: FC<InsightCardProps> = ({ icon, title, content, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="p-3 rounded-xl"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color }}>{icon}</div>
        <h4 className="text-xs font-bold" style={{ color }}>
          {title}
        </h4>
      </div>
      <div
        className="text-[11px] leading-relaxed"
        style={{ color: "rgba(203,213,225,0.8)" }}
      >
        {content}
      </div>
    </motion.div>
  );
};
