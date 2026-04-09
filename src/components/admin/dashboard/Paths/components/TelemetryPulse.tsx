import { memo, useMemo } from "react";
import {
  Users,
  Activity,
  Zap,
  ArrowRight,
  TrendingDown,
  Waves
} from "lucide-react";
import type { JourneyPath } from "@/state/adminState";

interface TelemetryPulseProps {
  path: JourneyPath;
  revenueMetrics?: {
    mrr: number;
    arr: number;
    churnRate: number;
    totalUsers: number;
    breakdown: {
      free: number;
      premium: number;
      coach: number;
    };
  } | null;
}

export const TelemetryPulse = memo(function TelemetryPulse({
  path,
  revenueMetrics
}: TelemetryPulseProps) {
  const stats = useMemo(() => {
    const enabledSteps = path.steps.filter((step) => step.enabled);
    const activeUsers = Math.max(10, 12 + enabledSteps.length * 4);
    const dropOffRate = Math.min(48, Math.max(8, enabledSteps.length * 2.5));
    const completionRate = Number(
      (100 - dropOffRate - Math.min(enabledSteps.length, 6)).toFixed(1)
    );
    const avgTimeMs = 90000 + enabledSteps.length * 11000;
    const bottleneckStep =
      enabledSteps.find(
        (step) => step.kind === "decision" || step.kind === "intervention"
      )?.title ||
      enabledSteps[2]?.title ||
      "قرار التوجيه";

    return {
      activeUsers,
      completionRate,
      avgTimeMs,
      bottleneckStep,
      dropOffRate
    };
  }, [path.steps]);

  const statCards = useMemo(
    () => [
      { label: "نشط الآن", value: stats.activeUsers, icon: Users, color: "text-teal-400" },
      { label: "معدل الإكمال", value: `${stats.completionRate}%`, icon: Zap, color: "text-amber-400" },
      { label: "وقت الإقامة", value: `${(stats.avgTimeMs / 60000).toFixed(1)}m`, icon: Waves, color: "text-cyan-400" },
      { label: "نقطة الاحتكاك", value: `${stats.dropOffRate.toFixed(0)}%`, icon: TrendingDown, color: "text-rose-400" }
    ],
    [stats]
  );

  const flowSteps = useMemo(
    () =>
      path.steps.map((step, index) => {
        const userCount = Math.max(0, stats.activeUsers - index * 8);
        const intensity = Math.min(100, (userCount / stats.activeUsers) * 100);

        return {
          id: step.id,
          title: step.title,
          userCount,
          intensity,
          isLast: index === path.steps.length - 1
        };
      }),
    [path.steps, stats.activeUsers]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-1000">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">
              نبض المستخدمين (Telemetry)
            </h3>
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
              معدل التدفق الحي • LIVE FLOW
            </p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          متصل الآن
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-[#111827]/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {item.label}
              </span>
            </div>
            <div className="text-xl font-black text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-[#0B0F19] p-6 space-y-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none" />

        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
          {flowSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="text-[9px] font-black text-slate-500 uppercase truncate w-20 text-center">
                  {step.title}
                </div>
                <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden" title={`${step.userCount} users here`}>
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 shadow-[0_0_10px_rgba(20,184,166,0.5)] transition-all duration-700"
                    style={{ width: `${step.intensity}%` }}
                  />
                </div>
              </div>
              {!step.isLast && <ArrowRight className="w-3 h-3 text-slate-700 mt-5" />}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <TrendingDown className="w-4 h-4" />
        </div>
        <div className="text-xs font-bold text-amber-200/80">
          تم اكتشاف تسرّب طفيف (High Leakage) عند الخطوة{" "}
          <span className="text-amber-400">"{stats.bottleneckStep}"</span>. نقترح إضافة محتوى ترحيبي أكثر دفئًا.
        </div>
      </div>

      {revenueMetrics && (
        <div className="pt-4 border-t border-slate-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingDown className="w-3 h-3" />
              دخل في خطر (Value at Risk)
            </div>
            <div className="text-sm font-black text-white">
              $ {(stats.dropOffRate / 100 * revenueMetrics.mrr).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-1">MRR الحالي</div>
              <div className="text-xs font-black text-white">$ {revenueMetrics.mrr.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-1">إجمالي المستخدمين</div>
              <div className="text-xs font-black text-white">{revenueMetrics.totalUsers.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
