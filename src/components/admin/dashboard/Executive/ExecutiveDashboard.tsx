import type { FC } from "react";
import { useEffect, useState } from "react";
import { Activity, LayoutDashboard, Target, Bot } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { TimelineOfSouls } from "./components/TimelineOfSouls";

import { StatCard, formatNumber } from "./components/StatCard";
import { PhaseOneGoal } from "../Overview/components/PhaseOneGoal";
import { SuccessIndexCard } from "../Overview/components/SuccessIndexCard";
import { ExecutiveReport } from "../Overview/components/ExecutiveReport";

import {
  fetchOverviewStats,
  type OverviewStats,
  fetchExecutiveReport
} from "../../../../services/adminApi";
import { fetchFlowAuditLogs, type FlowAuditLogEntry } from "../../../../services/flowAudit";
import type { ExecutiveReport as ExecutiveReportType } from "../../../../types/admin.types";

export const ExecutiveDashboard: FC = () => {
    const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);
    const [executiveReport, setExecutiveReport] = useState<ExecutiveReportType | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    const [weeklyDecisionLogs, setWeeklyDecisionLogs] = useState<FlowAuditLogEntry[]>([]);
    const [weeklyDecisionLoading, setWeeklyDecisionLoading] = useState(true);

    const [decisionSaving, setDecisionSaving] = useState(false);
    const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
    useEffect(() => {
        let mounted = true;
        
        const fetchDecisions = async () => {
          setWeeklyDecisionLoading(true);
          try {
            const logs = await fetchFlowAuditLogs(20);
            if (mounted) setWeeklyDecisionLogs(logs?.filter(l => l.action === 'weekly_success_decision') ?? []);
          } finally {
            if (mounted) setWeeklyDecisionLoading(false);
          }
        };

        const refresh = () => {
          Promise.all([fetchOverviewStats(), fetchExecutiveReport()])
            .then(([overviewData, execData]) => {
              if (!mounted) return;
              setRemoteStats(overviewData ?? null);
              setExecutiveReport(execData ?? null);
              setInitialLoading(false);
            })
            .catch(() => {
              if (mounted) setInitialLoading(false);
            });
        };

        fetchDecisions();
        refresh();
        
        const timer = window.setInterval(refresh, 60_000);
        return () => {
          mounted = false;
          window.clearInterval(timer);
        };
    }, []);

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-slate-500 animate-pulse" />
                    <p className="text-slate-500 text-sm font-bold">جاري تشفير المركز التنفيذي...</p>
                </div>
            </div>
        );
    }

    const totalUsers = remoteStats?.totalUsers ?? 0;
    const activeNowValue = remoteStats?.activeNow ?? 0;
    const avgMoodValue = remoteStats?.avgMood ?? null;
    const aiTokensUsed = remoteStats?.aiTokensUsed ?? 0;
    const flowStats = remoteStats?.flowStats;
    
    // Derived Flow Stats
    const pulseCompletedCount = flowStats?.byStep?.pulse_completed ?? 0;
    const landingViewedCount = flowStats?.byStep?.landing_viewed ?? 0;
    const startClickedCount = flowStats?.byStep?.landing_clicked_start ?? 0;
    
    const authSuccessRateFromPulse = flowStats?.byStep?.auth_login_success && pulseCompletedCount > 0
      ? Math.round((flowStats.byStep.auth_login_success / pulseCompletedCount) * 100) : 0;
    const startClickRate = landingViewedCount > 0 ? Math.round((startClickedCount / landingViewedCount) * 100) : 0;
    const pulseCompletionRate = startClickedCount > 0 ? Math.round((pulseCompletedCount / startClickedCount) * 100) : 0;
    const retention7d = 15; // Example Placeholder

    const normalizedMetric = (val: number | null, target: number) => {
        if (val == null) return 0;
        return Math.min(val / target, 1.2);
    };

    const successIndex = Math.round(
        (normalizedMetric(startClickRate, 35) * 0.2 +
        normalizedMetric(pulseCompletionRate, 60) * 0.3 +
        normalizedMetric(authSuccessRateFromPulse, 40) * 0.3 +
        normalizedMetric(50, 45) * 0.1 +
        normalizedMetric(retention7d, 15) * 0.1) *
        100
    );

    const successSampleSize = Math.max(landingViewedCount, startClickedCount, pulseCompletedCount);
    const hasReliableSample = successSampleSize >= 30;
    const successDecision = !hasReliableSample ? "insufficient" : successIndex >= 75 ? "scale" : successIndex >= 50 ? "optimize" : "pivot";
    const successDecisionLabel = successDecision === "scale" ? "المهمة واضحة: نشر التوسع" : successDecision === "optimize" ? "تحسين المسار: مطلوب تحسين" : successDecision === "pivot" ? "فشل الفرضية: محوري حرج" : "قياس غير كافٍ";
    const successDecisionClass = successDecision === "scale" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : successDecision === "optimize" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : successDecision === "pivot" ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : "text-slate-500 border-white/5 bg-slate-900/50";

    const handleCommitDecision = async () => {};

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <header className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <Activity className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">المركز التنفيذي</h2>
                            <AdminTooltip content="شاشة القيادة الرئيسية. بتعرض ملخص سريع لكل أرقام المنصة وصحة النظام، وتقارير تخص نجاح مرحلة الإطلاق (Phase One)." position="bottom" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <p className="text-sm font-medium text-emerald-400">متصل مباشر</p>
                            <span className="text-slate-600 mx-1">•</span>
                            <p className="text-xs text-slate-500">نظرة عامة سيادية</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 space-y-6 min-w-0">
                    {/* Quick Stats Grid */}
                    <CollapsibleSection
                        title="نظرة عامة سريعة"
                        icon={<LayoutDashboard className="w-4 h-4" />}
                        subtitle="إحصائيات شاملة في الوقت الفعلي"
                        defaultExpanded={true}
                        headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                            <StatCard title="إجمالي المسافرين" value={formatNumber(totalUsers)} hint="مزامنة موثقة" tooltip="إجمالي عدد المستخدمين المسجلين في المنصة من البداية وحتى اللحظة." />
                            <StatCard title="نشط الآن" value={formatNumber(activeNowValue)} hint="حضور مداري" tooltip="عدد الأعضاء الموجودين أونلاين وبيستخدموا المنصة حالياً." />
                            <StatCard title="متوسط الطاقة" value={avgMoodValue !== null ? avgMoodValue.toFixed(1) : "—"} hint="تدفق المزاج" glowColor="indigo" tooltip="متوسط الحالة المزاجية أو الصفاء لكل الزوار النشطين." />
                            <StatCard title="عمليات الذكاء" value={formatNumber(aiTokensUsed)} hint="احتمال التفكير الاصطناعي" glowColor="indigo" tooltip="حجم الأوامر أو الكلمات (Tokens) اللي جارفيس استهلكها في مساعدة المستخدمين النهارده." />
                        </div>
                    </CollapsibleSection>

                    {/* Executive Success */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CollapsibleSection
                            title="مؤشر نجاح المرحلة (Phase One)"
                            icon={<Target className="w-4 h-4" />}
                            subtitle="قياس وتقييم الفرضيات"
                            defaultExpanded={true}
                            headerColors="border-amber-500/20 bg-amber-500/5 text-amber-500"
                        >
                            <div className="pt-2">
                                <SuccessIndexCard
                                    successIndex={successIndex}
                                    successSampleSize={successSampleSize}
                                    hasReliableSample={hasReliableSample}
                                    successDecisionLabel={successDecisionLabel}
                                    successDecisionClass={successDecisionClass}
                                    startClickRate={startClickRate}
                                    pulseCompletionRate={pulseCompletionRate}
                                    authSuccessRateFromPulse={authSuccessRateFromPulse}
                                    addPersonCompletionRatio={0}
                                    retention7d={retention7d}
                                    successRecommendations={[]}
                                    onCommitDecision={handleCommitDecision}
                                    decisionSaving={decisionSaving}
                                    decisionMessage={decisionMessage}
                                    weeklyDecisionLoading={weeklyDecisionLoading}
                                    weeklyDecisionEntries={weeklyDecisionLogs.map((l) => {
                                        const payload = (l.payload ?? {}) as {
                                            successIndex?: number;
                                            successDecisionLabel?: string;
                                            sampleSize?: number;
                                        };
                                        return ({
                                            id: l.id,
                                            createdAt: l.createdAt,
                                            score: payload.successIndex ?? null,
                                            decisionLabel: payload.successDecisionLabel || "سجل قرار",
                                            sampleSize: payload.sampleSize ?? null
                                        });
                                    })}
                                />
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection
                            title="أهداف الرحلة الحالية"
                            icon={<Activity className="w-4 h-4" />}
                            subtitle="مؤشرات الأداء"
                            defaultExpanded={true}
                            headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                        >
                            <div className="pt-2">
                                <PhaseOneGoal
                                    data={remoteStats?.phaseOneGoal ?? null} loading={initialLoading}
                                />
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* AI Executive Report */}
                    {executiveReport && (
                        <CollapsibleSection
                            title="التقييم التنفيذي للذكاء الاصطناعي"
                            icon={<Bot className="w-4 h-4" />}
                            subtitle="تقرير آلي لتحليل حالة المنصة"
                            defaultExpanded={false}
                            headerColors="border-purple-500/20 bg-purple-500/5 text-purple-400"
                        >
                            <div className="pt-2">
                                <ExecutiveReport data={executiveReport} loading={initialLoading} />
                            </div>
                        </CollapsibleSection>
                    )}
                </div>

                {/* The Timeline of Souls Sidebar */}
                <div className="w-full xl:w-[350px] shrink-0 xl:h-[calc(100vh-200px)] xl:sticky top-6">
                    <TimelineOfSouls />
                </div>
            </div>
        </div>
    );
};
