/**
 * مرآة — Mir'ah: مرآة الوعي الذاتي
 *
 * شوف نفسك بعيون البيانات:
 * - Personality Profile — built from real behavior
 * - Pattern Detection — energy, mood, consistency
 * - Growth Map — milestones achieved
 * - Self-Discovery Prompts — daily reflection
 * - Behavioral Radar Chart
 */

import type { FC } from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Sparkles, TrendingUp, Brain, Heart,
  Zap, Users, Compass, Check, ChevronDown,
  RefreshCw, Target,
} from "lucide-react";
import { useMirahState, type InsightCategory } from "./store/mirah.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useWirdState } from "@/modules/wird/store/wird.store";
import { useBawsalaState } from "@/modules/bawsala/store/bawsala.store";
import { useHafizState } from "@/modules/hafiz/store/hafiz.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "mirror" | "growth" | "reflect";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CAT_META: Record<InsightCategory, { label: string; emoji: string; color: string }> = {
  energy: { label: "طاقة", emoji: "⚡", color: "#fbbf24" },
  emotion: { label: "عاطفة", emoji: "💜", color: "#a855f7" },
  behavior: { label: "سلوك", emoji: "🔄", color: "#06b6d4" },
  growth: { label: "نمو", emoji: "🌱", color: "#10b981" },
  social: { label: "اجتماعي", emoji: "🤝", color: "#ec4899" },
  values: { label: "قيم", emoji: "💎", color: "#f97316" },
};

const REFLECTION_PROMPTS = [
  "ما أكثر شيء أنت فخور فيه هذا الأسبوع؟",
  "لو تقدر تغيّر شيء واحد في يومك — ما هو؟",
  "مين الشخص اللي أثّر فيك مؤخراً — وكيف؟",
  "ما الشيء اللي تتجنبه لكن تعرف أنه مهم؟",
  "لو تكتب رسالة لنفسك بعد سنة — ماذا ستقول؟",
  "ما اللحظة الأخيرة اللي حسيت فيها بسلام حقيقي؟",
  "ما القرار اللي أجّلته وتعرف أنه وقته؟",
  "ما أكثر قيمة تعيشها فعلاً — مش فقط تتكلم عنها؟",
];

/* ═══════════════════════════════════════════ */
/*         INSIGHT GENERATOR HOOK             */
/* ═══════════════════════════════════════════ */

function useInsightGenerator() {
  const { addInsight, lastAnalysisDate, setLastAnalysisDate, addMilestone, setReflections, reflections } = useMirahState();
  const logs = usePulseState((s) => s.logs) ?? [];
  const { badges, level, streak: gameStreak } = useGamificationState();
  const wirdState = useWirdState();
  const { decisions } = useBawsalaState();
  const { memories } = useHafizState();

  useEffect(() => {
    const key = todayKey();
    if (lastAnalysisDate === key) return;
    if (logs.length < 3) return; // Need minimum data

    const insights: Parameters<typeof addInsight>[0][] = [];

    // ── Energy Pattern ──
    const recent = logs.filter((l) => Date.now() - l.timestamp < 7 * 24 * 3600000);
    if (recent.length >= 3) {
      const avgEnergy = recent.reduce((s, l) => s + l.energy, 0) / recent.length;
      const trend = recent.length >= 5
        ? recent.slice(0, 3).reduce((s, l) => s + l.energy, 0) / 3 -
          recent.slice(-3).reduce((s, l) => s + l.energy, 0) / 3
        : 0;

      if (avgEnergy >= 7) {
        insights.push({
          category: "energy", emoji: "⚡",
          title: "طاقتك عالية",
          description: `متوسط طاقتك ${avgEnergy.toFixed(1)}/10 — أنت في فترة ذروة. استغلها في الأشياء المهمة.`,
          confidence: 85,
        });
      } else if (avgEnergy < 4) {
        insights.push({
          category: "energy", emoji: "🔋",
          title: "طاقتك تحتاج اهتمام",
          description: `متوسط طاقتك ${avgEnergy.toFixed(1)}/10 — جسمك يطلب استراحة. خذ وقت لنفسك.`,
          confidence: 90,
        });
      }

      if (trend > 2) {
        insights.push({
          category: "energy", emoji: "📈",
          title: "طاقتك في صعود",
          description: "مقارنة بالأيام الأولى — طاقتك تتحسن بوضوح. استمر!",
          confidence: 70,
        });
      }
    }

    // ── Emotion Pattern ──
    const moodCounts: Record<string, number> = {};
    recent.forEach((l) => { moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMood && topMood[1] >= 3) {
      insights.push({
        category: "emotion", emoji: "💜",
        title: `مزاجك الغالب: ${topMood[0]}`,
        description: `ظهر "${topMood[0]}" ${topMood[1]} مرات هالأسبوع — لاحظ هل ده نمط مستمر.`,
        confidence: 75,
      });
    }

    // ── Behavior (Consistency) ──
    if (wirdState.streak >= 7) {
      insights.push({
        category: "behavior", emoji: "🔥",
        title: "ثباتك مذهل",
        description: `${wirdState.streak} يوم streak — أنت من النوع اللي لما يبدأ — يكمل.`,
        confidence: 95,
      });
    } else if (wirdState.streak === 0 && wirdState.rituals.filter((r) => r.enabled).length > 0) {
      insights.push({
        category: "behavior", emoji: "🔄",
        title: "الثبات يحتاج عمل",
        description: "الـ streak توقف — مش مشكلة، كل يوم فرصة جديدة. ابدأ بطقس واحد بس.",
        confidence: 80,
      });
    }

    // ── Growth ──
    if (logs.length >= 20) {
      insights.push({
        category: "growth", emoji: "🌱",
        title: `${logs.length} نبضة — رحلة حقيقية`,
        description: "عدد النبضات يثبت إنك ملتزم بالمراقبة الذاتية. هذا أساس التغيير.",
        confidence: 90,
      });
    }

    if (decisions.length >= 3) {
      insights.push({
        category: "growth", emoji: "🧭",
        title: "متّخذ قرارات بوعي",
        description: `${decisions.length} قرار مدروس في البوصلة — أنت تاخذ حياتك بجدية.`,
        confidence: 85,
      });
    }

    // ── Social ──
    if (memories.length >= 5) {
      const gratMemories = memories.filter((m) => m.tags.includes("gratitude"));
      if (gratMemories.length >= 2) {
        insights.push({
          category: "social", emoji: "🙏",
          title: "شخص ممتن",
          description: `${gratMemories.length} ذكريات امتنان في حافظ — الامتنان سمة أصيلة فيك.`,
          confidence: 80,
        });
      }
    }

    // ── Values ──
    if (level >= 3) {
      insights.push({
        category: "values", emoji: "💎",
        title: `وصلت مستوى ${level}`,
        description: "كل مستوى يثبت إنك تستثمر في نفسك — هذا أغلى استثمار.",
        confidence: 85,
      });
    }

    // Milestones
    if (logs.length === 10 || logs.length === 25 || logs.length === 50 || logs.length === 100) {
      addMilestone({ label: `${logs.length} نبضة`, emoji: "💓", metric: `${logs.length} pulse logs` });
    }

    // Reflections (refresh weekly)
    if (reflections.length === 0 || reflections.every((r) => r.answeredAt !== null)) {
      const shuffled = [...REFLECTION_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3);
      setReflections(shuffled.map((q) => ({ question: q })));
    }

    if (insights.length > 0) {
      insights.forEach((i) => addInsight(i));
      setLastAnalysisDate(key);
    }
  }, [lastAnalysisDate, logs.length]);
}

/* ═══════════════════════════════════════════ */
/*            RADAR CHART (SVG)               */
/* ═══════════════════════════════════════════ */

const RadarChart: FC<{ scores: Record<InsightCategory, number> }> = ({ scores }) => {
  const categories = Object.keys(CAT_META) as InsightCategory[];
  const cx = 100, cy = 100, r = 70;
  const angleStep = (2 * Math.PI) / categories.length;

  const points = categories.map((cat, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = (scores[cat] || 0) / 100;
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
      lx: cx + (r + 16) * Math.cos(angle),
      ly: cy + (r + 16) * Math.sin(angle),
      cat,
    };
  });

  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"
          points={categories.map((_, i) => {
            const a = i * angleStep - Math.PI / 2;
            return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`;
          }).join(" ")}
        />
      ))}

      {/* Axes */}
      {categories.map((_, i) => {
        const a = i * angleStep - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />;
      })}

      {/* Data shape */}
      <motion.path d={pathData} fill="rgba(168,85,247,0.12)" stroke="#a855f7" strokeWidth="1.5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
      />

      {/* Data dots + labels */}
      {points.map((p) => (
        <g key={p.cat}>
          <circle cx={p.x} cy={p.y} r="3" fill="#a855f7" />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
            fill="#64748b" fontSize="7" fontWeight="bold"
          >{CAT_META[p.cat].emoji}</text>
        </g>
      ))}
    </svg>
  );
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const MirahScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("mirror");
  const {
    insights, milestones, reflections,
    acknowledgeInsight, answerReflection,
  } = useMirahState();

  useInsightGenerator();

  const logs = usePulseState((s) => s.logs) ?? [];
  const wirdState = useWirdState();
  const { level } = useGamificationState();

  // ── Radar Scores ──
  const radarScores = useMemo(() => {
    const recent = logs.filter((l) => Date.now() - l.timestamp < 14 * 24 * 3600000);
    const avgEnergy = recent.length > 0 ? (recent.reduce((s, l) => s + l.energy, 0) / recent.length) * 10 : 0;

    const positiveMoods = ["happy", "calm", "grateful", "excited", "peaceful"];
    const positiveRatio = recent.length > 0
      ? (recent.filter((l) => positiveMoods.includes(l.mood)).length / recent.length) * 100
      : 0;

    return {
      energy: Math.min(avgEnergy, 100),
      emotion: Math.min(positiveRatio, 100),
      behavior: Math.min(wirdState.streak * 5, 100),
      growth: Math.min(logs.length * 2, 100),
      social: Math.min(level * 15, 100),
      values: Math.min((insights.filter((i) => i.acknowledged).length) * 20, 100),
    } as Record<InsightCategory, number>;
  }, [logs, wirdState.streak, level, insights]);

  const overallScore = useMemo(() => {
    const vals = Object.values(radarScores);
    return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  }, [radarScores]);

  const unacknowledged = insights.filter((i) => !i.acknowledged).length;

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0c0616 0%, #140a22 40%, #0c0618 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}
            >
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">مرآة</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">شوف نفسك بعيون البيانات</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="w-14 h-14 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
              <motion.circle cx={50} cy={50} r={40} fill="none" stroke="#a855f7"
                strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 251} 251`}
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(overallScore / 100) * 251} 251` }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-purple-400">{overallScore}%</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "mirror", label: "المرآة", icon: "🪞" },
            { key: "growth", label: "النمو", icon: "🌱" },
            { key: "reflect", label: "تأمّل", icon: "💭" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: viewMode === tab.key ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.02)",
                color: viewMode === tab.key ? "#c084fc" : "#475569",
                border: `1px solid ${viewMode === tab.key ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ Mirror View ═══ */}
      {viewMode === "mirror" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-5">
          {/* Radar Chart */}
          <div className="p-4 rounded-2xl"
            style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.06)" }}
          >
            <p className="text-[10px] text-purple-400/50 font-bold flex items-center gap-1 mb-2">
              <Brain className="w-3 h-3" /> خريطة شخصيتك
            </p>
            <RadarChart scores={radarScores} />

            {/* Dimension scores */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(Object.keys(CAT_META) as InsightCategory[]).map((cat) => (
                <div key={cat} className="text-center">
                  <span className="text-xs">{CAT_META[cat].emoji}</span>
                  <p className="text-[9px] font-bold mt-0.5" style={{ color: CAT_META[cat].color }}>
                    {Math.round(radarScores[cat])}%
                  </p>
                  <p className="text-[7px] text-slate-600">{CAT_META[cat].label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Feed */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> رؤى عنك ({unacknowledged} جديد)
            </p>

            {insights.length === 0 ? (
              <div className="py-12 text-center">
                <Eye className="w-8 h-8 text-purple-400/10 mx-auto mb-2" />
                <p className="text-xs text-slate-600">سجّل 3 نبضات على الأقل عشان المرآة تبدأ تشتغل</p>
              </div>
            ) : (
              insights.slice(0, 8).map((insight) => (
                <motion.div key={insight.id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl relative"
                  style={{
                    background: `${CAT_META[insight.category].color}04`,
                    border: `1px solid ${CAT_META[insight.category].color}08`,
                    opacity: insight.acknowledged ? 0.5 : 1,
                  }}
                >
                  {!insight.acknowledged && (
                    <div className="absolute top-3 left-3 w-2 h-2 rounded-full"
                      style={{ background: CAT_META[insight.category].color, boxShadow: `0 0 4px ${CAT_META[insight.category].color}40` }}
                    />
                  )}

                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{insight.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{insight.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold"
                          style={{ background: `${CAT_META[insight.category].color}10`, color: CAT_META[insight.category].color }}
                        >{CAT_META[insight.category].label}</span>
                        <span className="text-[8px] text-slate-600">ثقة {insight.confidence}%</span>
                        {!insight.acknowledged && (
                          <button onClick={() => acknowledgeInsight(insight.id)}
                            className="mr-auto px-2 py-1 rounded text-[8px] font-bold opacity-40 hover:opacity-80 transition-all"
                            style={{ color: CAT_META[insight.category].color }}
                          >
                            <Check className="w-3 h-3 inline" /> فهمت
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ Growth View ═══ */}
      {viewMode === "growth" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          <p className="text-[10px] text-emerald-400/50 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> خريطة النمو
          </p>

          {/* Growth Summary */}
          <div className="p-4 rounded-xl"
            style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.08)" }}
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "نبضة", value: logs.length, emoji: "💓" },
                { label: "مستوى", value: level, emoji: "⭐" },
                { label: "streak", value: wirdState.streak, emoji: "🔥" },
              ].map((s) => (
                <div key={s.label}>
                  <span className="text-sm">{s.emoji}</span>
                  <p className="text-lg font-black text-white">{s.value}</p>
                  <p className="text-[8px] text-slate-500 font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
            <Target className="w-3 h-3" /> محطات الرحلة
          </p>

          {milestones.length === 0 ? (
            <div className="py-10 text-center">
              <Target className="w-8 h-8 text-emerald-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">المحطات تُسجّل تلقائياً مع تقدمك</p>
            </div>
          ) : (
            <div className="relative pr-4">
              <div className="absolute right-1 top-0 bottom-0 w-0.5 bg-emerald-500/10 rounded" />
              {milestones.map((ms, i) => (
                <motion.div key={ms.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pr-6 pb-4"
                >
                  <div className="absolute right-0 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-500/20" />
                  <div className="p-3 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.06)" }}
                  >
                    <p className="text-sm font-bold text-white">{ms.emoji} {ms.label}</p>
                    <p className="text-[8px] text-slate-500 mt-1">{new Date(ms.achievedAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ Reflect View ═══ */}
      {viewMode === "reflect" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          <p className="text-[10px] text-amber-400/50 font-bold flex items-center gap-1">
            <Heart className="w-3 h-3" /> أسئلة للتأمّل
          </p>

          {reflections.map((prompt) => (
            <div key={prompt.id} className="p-4 rounded-xl space-y-2"
              style={{
                background: prompt.answeredAt ? "rgba(16,185,129,0.03)" : "rgba(251,191,36,0.04)",
                border: `1px solid ${prompt.answeredAt ? "rgba(16,185,129,0.06)" : "rgba(251,191,36,0.08)"}`,
              }}
            >
              <p className="text-sm font-bold text-white leading-relaxed">
                {prompt.answeredAt ? "✅" : "💭"} {prompt.question}
              </p>

              {prompt.answeredAt ? (
                <p className="text-[11px] text-slate-400 leading-relaxed italic">"{prompt.answer}"</p>
              ) : (
                <div className="flex gap-2">
                  <input placeholder="إجابتك..."
                    className="flex-1 px-3 py-2 rounded-lg text-[11px] text-white placeholder-slate-600 outline-none"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                        answerReflection(prompt.id, (e.target as HTMLInputElement).value.trim());
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {reflections.length === 0 && (
            <div className="py-12 text-center">
              <Heart className="w-8 h-8 text-amber-400/10 mx-auto mb-2" />
              <p className="text-xs text-slate-600">سجّل نبضات عشان تظهر أسئلة التأمّل</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(168,85,247,0.03)", border: "1px solid rgba(168,85,247,0.06)" }}
      >
        <Eye className="w-5 h-5 text-purple-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          المرآة لا تحكم — تعكس.
          <br />
          كل رؤية مبنية على سلوكك الحقيقي — مش تخمين.
        </p>
      </motion.div>
    </div>
  );
};

export default MirahScreen;
