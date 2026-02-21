/**
 * AIDecisionLog — عرض سجل قرارات الـ AI في Admin Dashboard
 * =============================================================
 * يعرض آخر 100 قرار اتخذهم الـ AI، مع إمكانية الموافقة/الرفض
 */

import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { decisionEngine } from "../../ai/decision-framework";
import type { AIDecision, DecisionType } from "../../ai/decision-framework";

interface AIDecisionLogProps {
  maxDecisions?: number;
}

export const AIDecisionLog: FC<AIDecisionLogProps> = ({ maxDecisions = 50 }) => {
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(null);
  const [filter, setFilter] = useState<"all" | "executed" | "pending" | "rejected">("all");

  // تحميل القرارات من localStorage
  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = () => {
    const recent = decisionEngine.getRecentDecisions(maxDecisions);
    setDecisions(recent);
  };

  // فلترة القرارات
  const filteredDecisions = decisions.filter((d) => {
    if (filter === "all") return true;
    return d.outcome === filter;
  });

  // عدد كل نوع
  const counts = {
    executed: decisions.filter((d) => d.outcome === "executed").length,
    pending: decisions.filter((d) => d.outcome === "pending_approval").length,
    rejected: decisions.filter((d) => d.outcome === "rejected").length,
    forbidden: decisions.filter((d) => d.outcome === "forbidden").length,
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: "#a78bfa" }} />
          <h2 className="text-lg font-bold" style={{ color: "rgba(226,232,240,0.95)" }}>
            سجل قرارات الـ AI
          </h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
          >
            {decisions.length} قرار
          </span>
        </div>

        <button
          type="button"
          onClick={loadDecisions}
          className="organic-tap text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(148,163,184,0.9)",
          }}
        >
          تحديث
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="تم التنفيذ"
          count={counts.executed}
          icon={<CheckCircle className="w-4 h-4" />}
          color="#34d399"
          active={filter === "executed"}
          onClick={() => setFilter(filter === "executed" ? "all" : "executed")}
        />
        <StatCard
          label="قيد المراجعة"
          count={counts.pending}
          icon={<Clock className="w-4 h-4" />}
          color="#fbbf24"
          active={filter === "pending"}
          onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
        />
        <StatCard
          label="مرفوض"
          count={counts.rejected}
          icon={<XCircle className="w-4 h-4" />}
          color="#f87171"
          active={filter === "rejected"}
          onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}
        />
        <StatCard
          label="ممنوع"
          count={counts.forbidden}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="#ef4444"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
      </div>

      {/* ── Decision List ── */}
      <div className="space-y-2">
        {filteredDecisions.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            <Brain className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(148,163,184,0.3)" }} />
            <p style={{ color: "rgba(148,163,184,0.6)" }}>
              لا توجد قرارات بعد
            </p>
          </div>
        ) : (
          filteredDecisions.map((decision) => (
            <DecisionCard
              key={`${decision.type}-${decision.timestamp}`}
              decision={decision}
              isSelected={selectedDecision === decision}
              onClick={() =>
                setSelectedDecision(selectedDecision === decision ? null : decision)
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Stat Card — كارت إحصائية
 */
interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  onClick: () => void;
}

const StatCard: FC<StatCardProps> = ({ label, count, icon, color, active, onClick }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="organic-tap text-right p-3 rounded-xl transition-all"
      style={{
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? `${color}30` : "rgba(255,255,255,0.06)"}`,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl font-bold" style={{ color }}>
          {count}
        </span>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="text-xs" style={{ color: "rgba(148,163,184,0.7)" }}>
        {label}
      </p>
    </motion.button>
  );
};

/**
 * Decision Card — كارت قرار واحد
 */
interface DecisionCardProps {
  decision: AIDecision;
  isSelected: boolean;
  onClick: () => void;
}

const DecisionCard: FC<DecisionCardProps> = ({ decision, isSelected, onClick }) => {
  const outcomeConfig = getOutcomeConfig(decision.outcome);

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden"
      style={{
        background: isSelected ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${outcomeConfig.borderColor}`,
      }}
    >
      {/* ── Header ── */}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-right p-4 flex items-start justify-between gap-3 organic-tap"
      >
        <div className="flex-1">
          {/* Type */}
          <div className="flex items-center gap-2 mb-1.5">
            <DecisionTypeLabel type={decision.type} />
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: outcomeConfig.bgColor,
                color: outcomeConfig.color,
              }}
            >
              {outcomeConfig.label}
            </span>
          </div>

          {/* Reasoning */}
          <p className="text-xs leading-relaxed" style={{ color: "rgba(203,213,225,0.75)" }}>
            {decision.reasoning}
          </p>

          {/* Timestamp */}
          <p className="text-[10px] mt-2" style={{ color: "rgba(148,163,184,0.5)" }}>
            {new Date(decision.timestamp).toLocaleString("ar-EG")}
          </p>
        </div>

        {/* Icon */}
        <motion.div
          animate={{ rotate: isSelected ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isSelected ? (
            <ChevronUp className="w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: "rgba(148,163,184,0.6)" }} />
          )}
        </motion.div>
      </button>

      {/* ── Expanded Details ── */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div className="p-4 space-y-3">
              {/* Payload */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "rgba(148,163,184,0.7)" }}>
                  البيانات:
                </p>
                <pre
                  className="text-[11px] leading-relaxed p-3 rounded-lg overflow-x-auto"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    color: "rgba(203,213,225,0.8)",
                    fontFamily: "monospace",
                  }}
                >
                  {JSON.stringify(decision.payload, null, 2)}
                </pre>
              </div>

              {/* Actions (لو pending) */}
              {decision.outcome === "pending_approval" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="organic-tap flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(52,211,153,0.15)",
                      border: "1px solid rgba(52,211,153,0.3)",
                      color: "#34d399",
                    }}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    موافقة
                  </button>
                  <button
                    type="button"
                    className="organic-tap flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold"
                    style={{
                      background: "rgba(248,113,113,0.15)",
                      border: "1px solid rgba(248,113,113,0.3)",
                      color: "#f87171",
                    }}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    رفض
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Decision Type Label
 */
const DecisionTypeLabel: FC<{ type: DecisionType }> = ({ type }) => {
  const labels: Record<DecisionType, string> = {
    generate_daily_question: "توليد سؤال يومي",
    generate_content_packet: "توليد محتوى",
    generate_recovery_script: "توليد نص تعافي",
    filter_community_content: "فلترة محتوى المجتمع",
    content_generated: "توليد محتوى",
    campaign_created: "إنشاء حملة",
    analyze_user_state: "تحليل حالة المستخدم",
    calculate_tei: "حساب TEI",
    detect_shadow_pulse: "كشف Shadow Pulse",
    recommend_action: "اقتراح إجراء",
    add_node: "إضافة شخص",
    move_node_to_ring: "نقل شخص لدائرة",
    archive_node: "أرشفة شخص",
    delete_node: "حذف شخص",
    update_insights: "تحديث Insights",
    send_notification: "إرسال تنبيه",
    trigger_breathing_exercise: "تفعيل تمرين تنفس",
    escalate_crisis: "تصعيد أزمة",
    adjust_pricing: "تعديل السعر",
    pricing_change: "تغيير السعر",
    ab_test_started: "بدء اختبار A/B",
    ab_test_ended: "إنهاء اختبار A/B",
    emotional_pricing_triggered: "تفعيل التسعير العاطفي",
    send_marketing_email: "إرسال email تسويقي",
    process_payment: "معالجة دفع",
    grant_discount: "منح خصم",
    subscription_activated: "تفعيل اشتراك",
    subscription_cancelled: "إلغاء اشتراك",
    optimize_performance: "تحسين الأداء",
    fix_bug: "إصلاح bug",
    a_b_test_ui: "اختبار A/B للواجهة",
    update_dependency: "تحديث dependency",
    change_core_principles: "تغيير المبادئ الأساسية",
    pivot_business_model: "تغيير نموذج العمل",
    remove_major_feature: "إزالة feature رئيسية",
    legal_decision: "قرار قانوني",
  };

  return (
    <span className="text-xs font-bold" style={{ color: "rgba(226,232,240,0.9)" }}>
      {labels[type] || type}
    </span>
  );
};

/**
 * Outcome Config
 */
function getOutcomeConfig(outcome?: AIDecision["outcome"]) {
  switch (outcome) {
    case "executed":
      return {
        label: "تم التنفيذ",
        color: "#34d399",
        bgColor: "rgba(52,211,153,0.15)",
        borderColor: "rgba(52,211,153,0.2)",
      };
    case "pending_approval":
      return {
        label: "قيد المراجعة",
        color: "#fbbf24",
        bgColor: "rgba(251,191,36,0.15)",
        borderColor: "rgba(251,191,36,0.2)",
      };
    case "rejected":
      return {
        label: "مرفوض",
        color: "#f87171",
        bgColor: "rgba(248,113,113,0.15)",
        borderColor: "rgba(248,113,113,0.2)",
      };
    case "forbidden":
      return {
        label: "ممنوع",
        color: "#ef4444",
        bgColor: "rgba(239,68,68,0.15)",
        borderColor: "rgba(239,68,68,0.2)",
      };
    default:
      return {
        label: "غير معروف",
        color: "rgba(148,163,184,0.7)",
        bgColor: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.1)",
      };
  }
}
