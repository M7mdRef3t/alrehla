import type { FC } from "react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, TrendingUp, Users, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { surveyCopy } from "@/copy/survey";

/* ═══════════════════════════════
   Survey Results Panel — Hypothesis Dashboard
   Admin tab for analyzing user research survey data
   ═══════════════════════════════ */

type SurveyRow = {
  id: string;
  answers: Record<string, string | number>;
  device_type: string | null;
  completed_at: string;
};

type AggregatedData = {
  total: number;
  deviceBreakdown: Record<string, number>;
  questionStats: Record<string, {
    type: "scale" | "mc" | "open";
    responses: (string | number)[];
    average?: number;
    distribution?: Record<string, number>;
  }>;
};

function aggregateResponses(rows: SurveyRow[]): AggregatedData {
  const total = rows.length;
  const deviceBreakdown: Record<string, number> = {};
  const questionStats: AggregatedData["questionStats"] = {};

  // Initialize from survey questions
  for (const q of surveyCopy.questions) {
    questionStats[q.id] = {
      type: q.type,
      responses: [],
      ...(q.type === "scale" ? { average: 0 } : {}),
      ...(q.type === "mc" ? { distribution: {} } : {}),
    };
  }

  for (const row of rows) {
    // Device breakdown
    const device = row.device_type || "unknown";
    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

    // Aggregate answers
    for (const [qId, value] of Object.entries(row.answers)) {
      if (!questionStats[qId]) continue;
      questionStats[qId].responses.push(value);

      if (questionStats[qId].type === "mc" && typeof value === "string") {
        const dist = questionStats[qId].distribution!;
        dist[value] = (dist[value] || 0) + 1;
      }
    }
  }

  // Calculate averages for scale questions
  for (const stat of Object.values(questionStats)) {
    if (stat.type === "scale" && stat.responses.length > 0) {
      const nums = stat.responses.filter((v): v is number => typeof v === "number");
      stat.average = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    }
  }

  return { total, deviceBreakdown, questionStats };
}

// ─── Hypothesis Status Card ─────────────────────────────────
const HypothesisCard: FC<{
  title: string;
  hypothesis: string;
  status: "validated" | "invalidated" | "insufficient";
  metric: string;
  level: "high" | "medium" | "low";
}> = ({ title, hypothesis, status, metric, level }) => {
  const statusConfig = {
    validated: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      icon: CheckCircle2
    },
    invalidated: {
      color: "text-rose-400",
      bg: "bg-rose-500/5",
      border: "border-rose-500/20",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.1)]",
      icon: AlertTriangle
    },
    insufficient: {
      color: "text-amber-400",
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
      icon: BarChart3
    }
  };

  const cfg = statusConfig[status];

  const levelBadge = level === "high"
    ? "bg-rose-500/20 text-rose-300"
    : level === "medium"
    ? "bg-amber-500/20 text-amber-300"
    : "bg-emerald-500/20 text-emerald-300";

  const StatusIcon = cfg.icon;

  return (
    <div className={`rounded-3xl border p-6 transition-all duration-500 hover:scale-[1.02] ${cfg.bg} ${cfg.border} ${cfg.glow}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-slate-900 border ${cfg.border}`}>
            <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <h4 className="text-sm font-black text-white tracking-tight uppercase">{title}</h4>
        </div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${levelBadge}`}>
          {level === "high" ? "خطورة عالية" : level === "medium" ? "متوسطة" : "منخفضة"}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed font-medium">{hypothesis}</p>
      <div className={`text-[10px] font-black uppercase tracking-widest p-2 rounded-lg bg-black/20 border border-white/5 ${cfg.color}`}>
        {metric}
      </div>
    </div>
  );
};

// ─── Question Summary Card ──────────────────────────────────
const QuestionSummary: FC<{
  questionText: string;
  stat: AggregatedData["questionStats"][string];
}> = ({ questionText, stat }) => {
  const responseCount = stat.responses.length;

  return (
    <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:bg-slate-900/60 group">
      <p className="text-sm font-black text-white mb-4 text-right leading-relaxed group-hover:text-sky-400 transition-colors">{questionText}</p>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 flex-1 bg-white/5 rounded-full" />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{responseCount} RESPONSES</p>
      </div>

      {stat.type === "scale" && stat.average !== undefined && (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="text-4xl font-black text-sky-400 tracking-tighter">{stat.average.toFixed(1)}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">Score Index</div>
          </div>
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stat.average / 10) * 100}%` }}
              className="h-full rounded-full bg-gradient-to-r from-sky-600 via-sky-400 to-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.5)]"
            />
          </div>
        </div>
      )}

      {stat.type === "mc" && stat.distribution && (
        <div className="space-y-2">
          {Object.entries(stat.distribution)
            .sort(([, a], [, b]) => b - a)
            .map(([value, count], i) => {
              const pct = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;
              return (
                <div key={value} className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-300">{value}</span>
                    <span className="text-[10px] font-mono text-sky-500/80">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1 }}
                      className="h-full rounded-full bg-sky-500/40"
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {stat.type === "open" && (
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
          {stat.responses.slice(0, 8).map((r, i) => (
            <p key={i} className="text-[11px] text-slate-400 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-right leading-relaxed hover:bg-white/5 transition-colors italic">
              " {String(r)} "
            </p>
          ))}
          {stat.responses.length > 8 && (
            <p className="text-[9px] font-black text-slate-600 text-center uppercase tracking-widest pt-2">+{stat.responses.length - 8} additional voices</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Panel ─────────────────────────────────────────────
export const SurveyResultsPanel: FC = () => {
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseReady || !supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from("research_survey_responses")
        .select("*")
        .order("completed_at", { ascending: false });

      if (err) throw err;
      setRows(data || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <p className="text-sm text-rose-300">{error}</p>
      </div>
    );
  }

  const agg = aggregateResponses(rows);

  // ─── Hypothesis evaluation based on data ──────────────────
  const q4Avg = agg.questionStats["q4_awareness_level"]?.average ?? 0;
  const q7Avg = agg.questionStats["q7_app_trust"]?.average ?? 0;
  const q5Dist = agg.questionStats["q5_boundary_attempt"]?.distribution ?? {};
  const q5Wanted = (q5Dist["wanted_but_no"] || 0) + (q5Dist["yes_failed"] || 0);
  const q5Total = Object.values(q5Dist).reduce((a, b) => a + b, 0);
  const insufficient = agg.total < 10;

  return (
    <div className="space-y-8">
      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-8 text-center backdrop-blur-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[40px] pointer-events-none rounded-full group-hover:bg-sky-500/20 transition-all duration-700" />
          <ClipboardList className="w-8 h-8 text-sky-400 mx-auto mb-4" />
          <p className="text-5xl font-black text-white tracking-tighter">{agg.total}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">إجمالي الردود</p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-8 text-center backdrop-blur-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] pointer-events-none rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
          <Users className="w-8 h-8 text-indigo-400 mx-auto mb-4" />
          <p className="text-5xl font-black text-white tracking-tighter">{agg.deviceBreakdown["mobile"] || 0}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">موبايل</p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-8 text-center backdrop-blur-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] pointer-events-none rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
          <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
          <p className="text-5xl font-black text-white tracking-tighter">{agg.deviceBreakdown["desktop"] || 0}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">ديسكتوب</p>
        </div>
      </div>

      {/* Hypothesis Cards */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white uppercase tracking-[0.3em]">Hypothesis Validation</h3>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HypothesisCard
            title="H1: الخريطة البصرية أقوى من النص"
            hypothesis="المستخدم محتاج يشوف مش يقرأ — الخريطة البصرية أقوى من النص."
            status={insufficient ? "insufficient" : q4Avg > 6 ? "validated" : "invalidated"}
            metric={insufficient ? `${agg.total}/10 ردود — محتاج بيانات أكتر` : `متوسط الوعي: ${q4Avg.toFixed(1)}/10 — ${q4Avg > 6 ? "المشكلة مش وعي = المشكلة أدوات ✓" : "المشكلة وعي = لازم نركز على الشرح"}`}
            level="high"
          />
          <HypothesisCard
            title="H2: المستخدم هيحط حدود"
            hypothesis="المستخدم عايز يحط حدود بس مش قادر — ده جمهورنا."
            status={insufficient ? "insufficient" : q5Total > 0 && (q5Wanted / q5Total) > 0.4 ? "validated" : "invalidated"}
            metric={insufficient ? `${agg.total}/10 ردود — محتاج بيانات أكتر` : `${q5Total > 0 ? Math.round((q5Wanted / q5Total) * 100) : 0}% عايزين يحطوا حدود بس فشلوا أو مقدروش`}
            level="high"
          />
          <HypothesisCard
            title="H3: الثقة في التطبيقات"
            hypothesis="المستخدم يثق إن تطبيق يقدر يساعده في العلاقات."
            status={insufficient ? "insufficient" : q7Avg >= 5 ? "validated" : "invalidated"}
            metric={insufficient ? `${agg.total}/10 ردود — محتاج بيانات أكتر` : `متوسط الثقة: ${q7Avg.toFixed(1)}/10 — ${q7Avg >= 5 ? "ثقة كافية ✓" : "محتاج social proof أقوى"}`}
            level="medium"
          />
          <HypothesisCard
            title="H5: العامية أفضل من الفصحى"
            hypothesis="النبرة المصرية العامية أفضل من الفصحى للجمهور المستهدف."
            status="insufficient"
            metric="A/B test مطلوب — مش قابل للقياس من الاستبيان"
            level="low"
          />
        </div>
      </div>

      {/* Question-by-Question Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-white uppercase tracking-[0.3em]">Deep Signal Analysis</h3>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surveyCopy.questions.map((q) => {
            const stat = agg.questionStats[q.id];
            if (!stat) return null;
            return <QuestionSummary key={q.id} questionText={q.text} stat={stat} />;
          })}
        </div>
      </div>

      {/* Refresh */}
      <div className="text-center pt-4">
        <button
          onClick={() => { setLoading(true); void fetchData(); }}
          className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          تحديث البيانات
        </button>
      </div>
    </div>
  );
};
