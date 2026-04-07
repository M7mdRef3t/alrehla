import type { FC } from "react";
import { useEffect, useState, useCallback } from "react";
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
  const statusColor = status === "validated"
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : status === "invalidated"
    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
    : "text-amber-400 bg-amber-500/10 border-amber-500/20";

  const levelBadge = level === "high"
    ? "bg-rose-500/20 text-rose-300"
    : level === "medium"
    ? "bg-amber-500/20 text-amber-300"
    : "bg-emerald-500/20 text-emerald-300";

  const StatusIcon = status === "validated" ? CheckCircle2 : status === "invalidated" ? AlertTriangle : BarChart3;

  return (
    <div className={`rounded-2xl border p-5 ${statusColor}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4" />
          <h4 className="text-sm font-bold">{title}</h4>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadge}`}>
          {level === "high" ? "خطورة عالية" : level === "medium" ? "متوسطة" : "منخفضة"}
        </span>
      </div>
      <p className="text-xs text-white/70 mb-2 leading-relaxed">{hypothesis}</p>
      <p className="text-xs font-medium">{metric}</p>
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
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-white mb-3 text-right leading-relaxed">{questionText}</p>
      <p className="text-[10px] text-white/40 mb-2">{responseCount} إجابة</p>

      {stat.type === "scale" && stat.average !== undefined && (
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-teal-400">{stat.average.toFixed(1)}</div>
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
              style={{ width: `${(stat.average / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {stat.type === "mc" && stat.distribution && (
        <div className="space-y-1.5">
          {Object.entries(stat.distribution)
            .sort(([, a], [, b]) => b - a)
            .map(([value, count]) => {
              const pct = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;
              return (
                <div key={value} className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg bg-teal-500/20"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative px-2 text-[11px] text-white/80 leading-6">{value}</span>
                  </div>
                  <span className="text-[11px] text-white/50 w-10 text-right font-mono">{pct}%</span>
                </div>
              );
            })}
        </div>
      )}

      {stat.type === "open" && (
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
          {stat.responses.slice(0, 5).map((r, i) => (
            <p key={i} className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2 text-right">
              {String(r)}
            </p>
          ))}
          {stat.responses.length > 5 && (
            <p className="text-[10px] text-white/30 text-center">+{stat.responses.length - 5} إجابة أخرى</p>
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
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
          <ClipboardList className="w-6 h-6 text-teal-400 mx-auto mb-2" />
          <p className="text-3xl font-black text-white">{agg.total}</p>
          <p className="text-[11px] text-white/50 mt-1">إجمالي الردود</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
          <Users className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
          <p className="text-3xl font-black text-white">{agg.deviceBreakdown["mobile"] || 0}</p>
          <p className="text-[11px] text-white/50 mt-1">موبايل</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-3xl font-black text-white">{agg.deviceBreakdown["desktop"] || 0}</p>
          <p className="text-[11px] text-white/50 mt-1">ديسكتوب</p>
        </div>
      </div>

      {/* Hypothesis Cards */}
      <div>
        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">Hypothesis Validation</h3>
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
      <div>
        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">Question Breakdown</h3>
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
