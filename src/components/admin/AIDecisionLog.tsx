/**
 * AIDecisionLog — عرض سجل قرارات الـ AI في Admin Dashboard (Supreme Court Hologram)
 * =============================================================
 * يعرض آخر 100 قرار اتخذهم الـ AI، مع إمكانية الموافقة/الرفض
 */

import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminTooltip } from "./dashboard/Overview/components/AdminTooltip";
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Gavel,
  ShieldAlert,
  Zap,
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

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = () => {
    const recent = decisionEngine.getRecentDecisions(maxDecisions);
    setDecisions(recent);
  };

  const filteredDecisions = decisions.filter((d) => {
    if (filter === "all") return true;
    return d.outcome === filter;
  });

  const counts = {
    executed: decisions.filter((d) => d.outcome === "executed").length,
    pending: decisions.filter((d) => d.outcome === "pending_approval").length,
    rejected: decisions.filter((d) => d.outcome === "rejected").length,
    forbidden: decisions.filter((d) => d.outcome === "forbidden").length,
  };

  return (
    <div className="space-y-6 relative rounded-3xl p-6 md:p-8 overflow-hidden bg-[#02040A] border border-slate-800/80 shadow-2xl group min-h-[600px]">
      {/* Hologram Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cyber-grid.png')] opacity-10 pointer-events-none" />
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <Gavel className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
              المحكمة العليا للذكاء
              <AdminTooltip content="هنا تقف لتحاسب، تراقب، وتقر قرارات الذكاء الاصطناعي التي تعمل كمراقب على السيادة." position="bottom" />
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <p className="text-xs font-bold text-purple-400/80 uppercase tracking-widest">
                God Mode Hologram
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDecisions}
          className="organic-tap text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          طلب سجلات حديثة
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <StatCard
          label="حُكم نافذ"
          count={counts.executed}
          icon={<CheckCircle className="w-5 h-5" />}
          color="#34d399"
          active={filter === "executed"}
          onClick={() => setFilter(filter === "executed" ? "all" : "executed")}
        />
        <StatCard
          label="استئناف القرار"
          count={counts.pending}
          icon={<Clock className="w-5 h-5" />}
          color="#fbbf24"
          active={filter === "pending"}
          onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
        />
        <StatCard
          label="حكم مرفوض"
          count={counts.rejected}
          icon={<XCircle className="w-5 h-5" />}
          color="#f87171"
          active={filter === "rejected"}
          onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}
        />
        <StatCard
          label="محظور دستورياً"
          count={counts.forbidden}
          icon={<ShieldAlert className="w-5 h-5" />}
          color="#ef4444"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
      </div>

      {/* ── Decision List ── */}
      <div className="space-y-3 relative z-10">
        {filteredDecisions.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800">
            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 mb-4 shadow-inner">
              <Zap className="w-8 h-8 text-slate-600 opacity-50" />
            </div>
            <p className="text-slate-500 font-bold tracking-widest uppercase">
              لا توجد قضايا مطروحة حالياً
            </p>
          </div>
        ) : (
          filteredDecisions.map((decision, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={`${decision.type}-${decision.timestamp}`}
            >
              <DecisionCard
                decision={decision}
                isSelected={selectedDecision === decision}
                onClick={() =>
                  setSelectedDecision(selectedDecision === decision ? null : decision)
                }
                onResolve={(approved) => {
                  if (decision.id) {
                    decisionEngine.resolveApproval(decision.id, approved);
                    loadDecisions();
                  }
                }}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Stat Card — كارت إحصائية هولوجرامي
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
      className={`relative organic-tap text-right p-4 rounded-2xl transition-all overflow-hidden border ${active ? 'shadow-lg' : ''}`}
      style={{
        background: active ? `${color}15` : "rgba(15,23,42,0.6)",
        border: `1px solid ${active ? `${color}50` : "rgba(255,255,255,0.05)"}`,
        boxShadow: active ? `0 0 20px ${color}30` : "none"
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {active && <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="text-3xl font-black font-mono tracking-tighter" style={{ color: active ? '#fff' : color }}>
          {count}
        </span>
        <div className="p-2 rounded-xl bg-black/20 backdrop-blur-sm" style={{ color }}>{icon}</div>
      </div>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: active ? color : "rgba(148,163,184,0.7)" }}>
          {label}
        </p>
      </div>
    </motion.button>
  );
};

/**
 * Decision Card — ملف القضية
 */
interface DecisionCardProps {
  decision: AIDecision;
  isSelected: boolean;
  onClick: () => void;
  onResolve: (approved: boolean) => void;
}

const DecisionCard: FC<DecisionCardProps> = ({ decision, isSelected, onClick, onResolve }) => {
  const outcomeConfig = getOutcomeConfig(decision.outcome);

  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-md ${isSelected ? "shadow-2xl translate-x-[-4px]" : "hover:translate-x-[-2px]"}`}
      style={{
        background: isSelected ? "rgba(15,23,42,0.9)" : "rgba(11,15,25,0.8)",
        border: `1px solid ${isSelected ? outcomeConfig.color : "rgba(255,255,255,0.05)"}`,
        borderRightWidth: "4px",
        borderRightColor: outcomeConfig.color,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-right p-5 flex items-start justify-between gap-4 organic-tap relative overflow-hidden"
      >
        {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 pointer-events-none" />}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm"
              style={{ background: outcomeConfig.bgColor, color: outcomeConfig.color, border: `1px solid ${outcomeConfig.borderColor}` }}
            >
              {outcomeConfig.label}
            </span>
            <DecisionTypeLabel type={decision.type} />
          </div>

          <p className="text-sm font-medium leading-relaxed truncate text-slate-300">
            {decision.reasoning}
          </p>

          <div className="flex items-center gap-2 mt-3 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
            <Clock className="w-3 h-3" />
            <span>{new Date(decision.timestamp).toLocaleString("ar-EG")}</span>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isSelected ? 180 : 0 }}
          className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 mt-2 shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.4)",
            }}
          >
            <div className="p-6 space-y-5">
              
              {/* Reasoning Expanded */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
                <p className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" />
                  حجة الذكاء الاصطناعي (Reasoning)
                </p>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {decision.reasoning}
                </p>
              </div>

              {/* Payload Data */}
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  الحمولة البيانية (Payload)
                </p>
                <div className="relative group">
                  <div className="absolute inset-0 bg-teal-500/10 blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <pre
                    className="text-[11px] leading-relaxed p-4 rounded-xl overflow-x-auto relative z-10 shadow-inner"
                    style={{
                      background: "#030712",
                      color: "#94a3b8",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    {JSON.stringify(decision.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Override Actions */}
              {decision.outcome === "pending_approval" && (
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => onResolve(true)}
                    className="organic-tap flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all group"
                    style={{
                      background: "rgba(16,185,129,0.05)",
                      borderColor: "rgba(16,185,129,0.2)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">التصديق على القرار</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => onResolve(false)}
                    className="organic-tap flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all group"
                    style={{
                      background: "rgba(225,29,72,0.05)",
                      borderColor: "rgba(225,29,72,0.2)",
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">نقض (Override)</span>
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

const DecisionTypeLabel: FC<{ type: DecisionType }> = ({ type }) => {
  const labels: Record<DecisionType, string> = {
    generate_daily_question: "سؤال يومي",
    generate_content_packet: "توليد محتوى",
    generate_recovery_script: "نص تعافي",
    filter_community_content: "فلترة مجتمع",
    content_generated: "توليد محتوى",
    campaign_created: "حملة تسويق",
    analyze_user_state: "تحليل سيكولوجي",
    calculate_tei: "حساب وعي TEI",
    detect_shadow_pulse: "استشعار الظل",
    recommend_action: "اقتراح إجراء",
    add_node: "إضافة كيان",
    move_node_to_ring: "تحريك طبقة",
    archive_node: "أرشفة صدمة",
    delete_node: "حذف نهائي",
    update_insights: "تحديث رؤى",
    send_notification: "تنبيه مداري",
    trigger_breathing_exercise: "تدخل تنفسي",
    escalate_crisis: "إعلان طوارئ",
    adjust_pricing: "تسعير ديناميكي",
    pricing_change: "تحديث سعر",
    ab_test_started: "اختبار A/B مباشر",
    ab_test_ended: "ختام A/B test",
    emotional_pricing_triggered: "خصم عاطفي",
    send_marketing_email: "بث تسويقي",
    process_payment: "حركة مالية",
    grant_discount: "منحة تسعيرية",
    subscription_activated: "تجديد سيادة",
    subscription_cancelled: "إلغاء سيادة",
    optimize_performance: "تحسين مداري",
    fix_bug: "ترميم تقني",
    a_b_test_ui: "تحليل واجهة",
    update_dependency: "تحديث جذر",
    change_core_principles: "تعديل مبدأ جوهري",
    pivot_business_model: "مناورة عمل",
    remove_major_feature: "أسقاط ميزة",
    legal_decision: "تدخل قانوني",
  };

  return (
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
      {labels[type] || type}
    </span>
  );
};

function getOutcomeConfig(outcome?: AIDecision["outcome"]) {
  switch (outcome) {
    case "executed":
      return { label: "حكم نافذ", color: "#34d399", bgColor: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.3)" };
    case "pending_approval":
      return { label: "مطلوب تصديق", color: "#fbbf24", bgColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.3)" };
    case "rejected":
      return { label: "تم النقض", color: "#f87171", bgColor: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.3)" };
    case "forbidden":
      return { label: "محظور دستورياً", color: "#ef4444", bgColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" };
    default:
      return { label: "غامض", color: "#64748b", bgColor: "rgba(100,116,139,0.1)", borderColor: "rgba(100,116,139,0.3)" };
  }
}

