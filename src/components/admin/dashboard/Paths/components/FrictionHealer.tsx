import { memo, useMemo } from "react";
import {
  Heart,
  Brain,
  ShieldAlert,
  Zap as Sparkles,
  Zap
} from "lucide-react";
import type { JourneyPath } from "@/domains/admin/store/admin.store";

interface FrictionHealerProps {
  path: JourneyPath;
  warnings: string[];
  onApplyHealing?: (suggestion: string) => void;
  auditData?: {
    scores: {
      emotionalResonance: number;
      cognitiveEfficiency: number;
      growthAlignment: number;
    };
    verdict: string;
    findings: Array<{ type: "warning" | "success" | "opportunity"; message: string; stepId?: string }>;
    architectAdvice: string;
    suggestedIntervention: string;
  } | null;
  isAuditing?: boolean;
  onRunAudit?: () => void;
}

const METRIC_STYLE = {
  teal: {
    chip: "bg-teal-500/10 text-teal-400",
    bar: "bg-gradient-to-r from-teal-600 to-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]",
    score: "text-teal-400"
  },
  indigo: {
    chip: "bg-indigo-500/10 text-indigo-400",
    bar: "bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
    score: "text-indigo-400"
  },
  rose: {
    chip: "bg-rose-500/10 text-rose-400",
    bar: "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
    score: "text-rose-400"
  },
  amber: {
    chip: "bg-amber-500/10 text-amber-400",
    bar: "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    score: "text-amber-400"
  }
} as const;

export const FrictionHealer = memo(function FrictionHealer({
  path,
  warnings,
  onApplyHealing,
  auditData,
  isAuditing,
  onRunAudit
}: FrictionHealerProps) {
  const metrics = useMemo(() => {
    const stepCount = path.steps.filter((step) => step.enabled).length;
    const cognitiveWarnings = warnings.filter((warning) => warning.includes("معرفي") || warning.includes("decision"));
    const emotionalWarnings = warnings.filter((warning) => warning.includes("عاطفي") || warning.includes("outcome"));

    const cognitiveScore = Math.max(0, 100 - cognitiveWarnings.length * 20 - (stepCount > 10 ? 10 : 0));
    const emotionalScore = Math.max(0, 100 - emotionalWarnings.length * 25);
    const securityScore = warnings.some((warning) => warning.includes("critical") || warning.includes("بداية")) ? 40 : 100;

    return {
      cognitive: cognitiveScore,
      emotional: emotionalScore,
      security: securityScore
    };
  }, [path.steps, warnings]);

  const metricCards = useMemo(
    () => [
      { label: "التناغم المعرفي", score: metrics.cognitive, icon: Brain, color: "teal" as const, desc: "مدى سهولة فهم المسار" },
      { label: "البعد العاطفي", score: metrics.emotional, icon: Sparkles, color: "indigo" as const, desc: "مدى التفاعل الوجداني" },
      { label: "سلامة التدفق", score: metrics.security, icon: ShieldAlert, color: "rose" as const, desc: "سلامة الروابط البرمجية" }
    ],
    [metrics]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-1200">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Heart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">مُعالج الاحتكاك (Friction Healer)</h3>
          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">تحليل التناغم المعرفي والعاطفي</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-800 bg-[#111827]/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${METRIC_STYLE[metric.color].chip}`}>
                <metric.icon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">{metric.score}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${METRIC_STYLE[metric.color].bar}`} style={{ width: `${metric.score}%` }} />
              </div>
              <p className="text-[9px] text-slate-500 font-bold">{metric.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-2">تشخيص العثرات البرمجية</h4>
        {warnings.length > 0 ? (
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={`${warning}-${index}`}
                className="flex gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 group hover:border-rose-500/30 transition-all"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-rose-200/90 leading-6">{warning}</div>
                  {onApplyHealing && (
                    <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onApplyHealing(warning)}
                        className="text-[9px] font-black uppercase tracking-wider text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        تطبيق الإصلاح المقترح (AI Healing)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-black text-white">المسار سليم تمامًا</div>
              <p className="text-[10px] text-slate-500 font-bold max-w-[200px]">لا توجد عوائق معرفية أو تقنية مرصودة حاليًا في هذا المسار.</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/50">
        {!auditData && !isAuditing && (
          <button
            onClick={onRunAudit}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-teal-600/20 to-indigo-600/20 border border-teal-500/30 text-teal-300 hover:from-teal-600/30 hover:to-indigo-600/30 transition-all font-black uppercase tracking-widest text-xs group"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            بدء تدقيق معماري عميق (Sovereign AI Audit)
          </button>
        )}

        {isAuditing && (
          <div className="w-full py-8 rounded-2xl bg-slate-900/50 border border-teal-500/20 flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-teal-400 rotate-12 transition-all duration-1000" />
            </div>
            <div className="text-center space-y-1">
              <div className="text-xs font-black text-teal-400 uppercase tracking-[0.2em]">جاري الغوص في اللاوعي الرقمي...</div>
              <p className="text-[10px] text-slate-500 font-bold italic">Gemini حلل البنية النفسية للمسار عبر</p>
            </div>
          </div>
        )}

        {auditData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400">تقرير السيادة الإدراكية</h4>
              </div>
              <button
                onClick={onRunAudit}
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-400 transition-colors"
                disabled={isAuditing}
              >
                إعادة التدقيق
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AuditMetric label="الرنين العاطفي" score={auditData.scores.emotionalResonance} color="teal" />
              <AuditMetric label="الكفاءة المعرفية" score={auditData.scores.cognitiveEfficiency} color="indigo" />
              <AuditMetric label="محاذاة النمو" score={auditData.scores.growthAlignment} color="amber" />
            </div>

            <div className="p-5 rounded-2xl bg-[#0B0F19] border border-teal-500/20 space-y-4 shadow-xl">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-teal-500 uppercase tracking-widest">الحكم المعماري (Verdict)</div>
                <p className="text-sm font-bold text-white leading-relaxed">{auditData.verdict}</p>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نتائج التدقيق (Findings)</div>
                <div className="space-y-2">
                  {auditData.findings.map((finding, index) => (
                    <div
                      key={`${finding.type}-${finding.message}-${index}`}
                      className={`flex items-start gap-3 p-3 rounded-xl border ${
                        finding.type === "success"
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                          : finding.type === "warning"
                            ? "bg-rose-500/5 border-rose-500/20 text-rose-400"
                            : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      <div className="mt-0.5">
                        {finding.type === "success" ? (
                          <Zap className="w-3 h-3" />
                        ) : finding.type === "warning" ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                      </div>
                      <p className="text-[11px] font-bold leading-5">{finding.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">نصيحة المهندس</div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{auditData.architectAdvice}"</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col gap-2">
                  <div className="text-[9px] font-black text-teal-400 uppercase tracking-widest">التدخل المقترح (Actionable)</div>
                  <div className="text-xs font-bold text-teal-100 flex items-center justify-between">
                    {auditData.suggestedIntervention}
                    <button
                      onClick={() => onApplyHealing?.(auditData.suggestedIntervention)}
                      className="p-1 px-3 rounded-lg bg-teal-500 text-slate-900 text-[10px] font-black"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

function AuditMetric({
  label,
  score,
  color
}: {
  label: string;
  score: number;
  color: keyof typeof METRIC_STYLE;
}) {
  const style = METRIC_STYLE[color];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B0F19]/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-[10px] font-black ${style.score}`}>{score}%</span>
      </div>
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${style.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
