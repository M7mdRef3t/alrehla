import type { FC } from "react";
import { useEffect, useState } from "react";
import { Activity, LayoutDashboard, Target, Bot, Rocket, ArrowUpRight } from "lucide-react";
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
    fetchExecutiveReport,
    fetchSovereignExecutiveReport,
    type SovereignExecutiveReport
} from "@/services/adminApi";
import { fetchFlowAuditLogs, type FlowAuditLogEntry } from "@/services/flowAudit";
import type { ExecutiveReport as ExecutiveReportType } from "@/types/admin.types";
import { vercelService, type VercelPulse } from "@/services/vercelService";

export const ExecutiveDashboard: FC = () => {
    const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);
    const [executiveReport, setExecutiveReport] = useState<ExecutiveReportType | null>(null);
    const [sovereignReport, setSovereignReport] = useState<SovereignExecutiveReport | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [infrastructurePulse, setInfrastructurePulse] = useState<VercelPulse | null>(null);

    const [weeklyDecisionLogs, setWeeklyDecisionLogs] = useState<FlowAuditLogEntry[]>([]);
    const [weeklyDecisionLoading, setWeeklyDecisionLoading] = useState(true);

    const [decisionSaving] = useState(false);
    const [decisionMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchDecisions = async () => {
            setWeeklyDecisionLoading(true);
            try {
                const logs = await fetchFlowAuditLogs(20);
                if (mounted) {
                    setWeeklyDecisionLogs(logs?.filter((l) => l.action === "weekly_success_decision") ?? []);
                }
            } finally {
                if (mounted) setWeeklyDecisionLoading(false);
            }
        };

        const refresh = () => {
            Promise.all([
                fetchOverviewStats(),
                fetchExecutiveReport(),
                fetchSovereignExecutiveReport(),
                vercelService.getPulse()
            ])
                .then(([overviewData, execData, sovData, pulseData]) => {
                    if (!mounted) return;
                    setRemoteStats(overviewData ?? null);
                    setExecutiveReport(execData ?? null);
                    setSovereignReport(sovData ?? null);
                    setInfrastructurePulse(pulseData);
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
                    <p className="text-slate-500 text-sm font-bold">جاري تحميل المركز التنفيذي...</p>
                </div>
            </div>
        );
    }

    const totalUsers = remoteStats?.totalTravelers ?? 0;
    const marketingLeadsTotal = remoteStats?.potentialTravelers?.total ?? 0;
    const activeNowValue = remoteStats?.activeConsciousnessNow ?? 0;
    const avgMoodValue = remoteStats?.avgMood ?? null;
    const aiTokensUsed = remoteStats?.aiTokensUsed ?? 0;
    const verificationGapIndex = remoteStats?.verificationGapIndex ?? 0;
    const flowStats = remoteStats?.flowStats;

    const pulseCompletedCount = flowStats?.byStep?.pulse_completed ?? 0;
    const landingViewedCount = flowStats?.byStep?.landing_viewed ?? 0;
    const startClickedCount = flowStats?.byStep?.landing_clicked_start ?? 0;

    const authSuccessRateFromPulse =
        flowStats?.byStep?.auth_login_success && pulseCompletedCount > 0
            ? Math.round((flowStats.byStep.auth_login_success / pulseCompletedCount) * 100)
            : 0;
    const startClickRate = landingViewedCount > 0 ? Math.round((startClickedCount / landingViewedCount) * 100) : 0;
    const pulseCompletionRate = startClickedCount > 0 ? Math.round((pulseCompletedCount / startClickedCount) * 100) : 0;
    const retention7d = 15;

    const normalizedMetric = (val: number | null, target: number) => {
        if (val == null) return 0;
        return Math.min(val / target, 1.2);
    };

    const successIndex = Math.round(
        (
            normalizedMetric(startClickRate, 35) * 0.2 +
            normalizedMetric(pulseCompletionRate, 60) * 0.3 +
            normalizedMetric(authSuccessRateFromPulse, 40) * 0.3 +
            normalizedMetric(50, 45) * 0.1 +
            normalizedMetric(retention7d, 15) * 0.1
        ) * 100
    );

    const successSampleSize = Math.max(landingViewedCount, startClickedCount, pulseCompletedCount);
    const hasReliableSample = successSampleSize >= 30;
    const successDecision =
        !hasReliableSample ? "insufficient" : successIndex >= 75 ? "scale" : successIndex >= 50 ? "optimize" : "pivot";
    const successDecisionLabel =
        successDecision === "scale"
            ? "الإشارة واضحة: وسّع بثقة"
            : successDecision === "optimize"
              ? "المسار واعد: يحتاج تحسين"
              : successDecision === "pivot"
                ? "الفرضية ضعيفة: محتاجين تغيير اتجاه"
                : "القياس غير كافٍ";
    const successDecisionClass =
        successDecision === "scale"
            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            : successDecision === "optimize"
              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
              : successDecision === "pivot"
                ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                : "text-slate-500 border-white/5 bg-slate-900/50";

    const handleCommitDecision = async () => {};

    const navigateToTab = (tab: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.toString());
        window.dispatchEvent(new PopStateEvent("popstate"));
    };

    const renderSectionLink = (tab: string, label: string) => (
        <button
            onClick={(e) => {
                e.preventDefault();
                navigateToTab(tab);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-all shadow-sm"
        >
            {label}
            <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
    );

    return (
        <div className="space-y-6" dir="rtl">
            <header className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between relative overflow-hidden mb-8 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-500">
                        <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">المركز التنفيذي</h2>
                            <AdminTooltip
                                content="شاشة القيادة الرئيسية: ملخص سريع لأرقام المنصة، صحة النظام، ومؤشرات نجاح مرحلة الإطلاق الأولى."
                                position="bottom"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)] ${
                                infrastructurePulse?.status === "healthy" ? "bg-emerald-500" :
                                infrastructurePulse?.status === "degraded" ? "bg-amber-500" :
                                infrastructurePulse?.status === "down" ? "bg-rose-500" : "bg-slate-500"
                            }`} />
                            <p className={`text-sm font-medium ${
                                infrastructurePulse?.status === "healthy" ? "text-emerald-600 dark:text-emerald-400" :
                                infrastructurePulse?.status === "degraded" ? "text-amber-600 dark:text-amber-400" :
                                infrastructurePulse?.status === "down" ? "text-rose-600 dark:text-rose-400" : "text-slate-500"
                            }`}>
                                {infrastructurePulse?.status === "healthy" ? "البنية التحتية: مستقرة" :
                                 infrastructurePulse?.status === "degraded" ? "البنية التحتية: أداء متأثر" :
                                 infrastructurePulse?.status === "down" ? "البنية التحتية: متوقفة" : "تكامل Vercel غير معدّ"}
                            </p>
                            {infrastructurePulse?.lastDeployment && (
                                <>
                                    <span className="text-slate-400 dark:text-slate-600 mx-1">•</span>
                                    <p className="text-xs text-slate-500">
                                        آخر تحديث: {new Date(infrastructurePulse.lastDeployment.createdAt).toLocaleDateString("ar-EG")}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 space-y-6 min-w-0">
                    <CollapsibleSection
                        title="نظرة عامة سريعة"
                        icon={<LayoutDashboard className="w-4 h-4" />}
                        subtitle="إحصائيات شاملة في الوقت الفعلي"
                        defaultExpanded={true}
                        headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
                        headerAction={renderSectionLink("users-state", "رادار الأرواح")}
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                            <StatCard
                                title="إجمالي المسافرين"
                                value={formatNumber(totalUsers)}
                                hint="مزامنة موثقة"
                                tooltip="إجمالي عدد المسافرين السِياديين في المنصة حتى هذه اللحظة."
                                onClick={() => navigateToTab("users-state")}
                            />
                            <StatCard
                                title="المسافرين المحتملين"
                                value={formatNumber(marketingLeadsTotal)}
                                hint="فرص نمو"
                                tooltip="إجمالي الأرواح التي بدأت التواصل ولم تدخل الرحلة بالكامل بعد."
                                onClick={() => navigateToTab("marketing-ops")}
                            />
                            <StatCard
                                title="وعي نشط الآن"
                                value={formatNumber(activeNowValue)}
                                hint="حضور مداري"
                                tooltip="عدد الأرواح الحاضرة الآن في المدار وتتفاعل مع التجربة."
                                onClick={() => navigateToTab("flow-map")}
                            />
                            <StatCard
                                title="متوسط طاقة الروح"
                                value={avgMoodValue !== null ? avgMoodValue.toFixed(1) : "—"}
                                hint="تدفق المزاج"
                                glowColor="indigo"
                                tooltip="متوسط تردد الصفاء أو الاضطراب للأرواح النشطة حالياً."
                                onClick={() => navigateToTab("consciousness-atlas")}
                            />
                            <StatCard
                                title="مؤشر الفقد (VGI)"
                                value={verificationGapIndex + "%"}
                                hint="أرواح في الانتظار"
                                glowColor={verificationGapIndex > 30 ? "rose" : "amber"}
                                tooltip="نسبة الأشخاص الذين سجلوا بياناتهم لكن لم يقوموا بتفعيل حساباتهم بعد."
                                onClick={() => navigateToTab("marketing-ops")}
                            />
                            <StatCard
                                title="العمليات السِيادية"
                                value={formatNumber(aiTokensUsed)}
                                hint="استهلاك التفكير الاصطناعي"
                                glowColor="indigo"
                                tooltip="حجم الطاقة الحسابية المستهلكة في تشغيل البصيرة الذكية."
                                onClick={() => navigateToTab("ai-studio")}
                            />
                        </div>
                    </CollapsibleSection>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <CollapsibleSection
                            title="مؤشر نجاح المرحلة (Phase One)"
                            icon={<Target className="w-4 h-4" />}
                            subtitle="قياس وتقييم الفرضيات"
                            defaultExpanded={true}
                            headerColors="border-amber-500/20 bg-amber-500/5 text-amber-500"
                            headerAction={renderSectionLink("growth-revenue", "لوحة الإيرادات")}
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
                                        return {
                                            id: l.id,
                                            createdAt: l.createdAt,
                                            score: payload.successIndex ?? null,
                                            decisionLabel: payload.successDecisionLabel || "سجل قرار",
                                            sampleSize: payload.sampleSize ?? null
                                        };
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
                            headerAction={renderSectionLink("flow-map", "تحليل المسارات")}
                        >
                            <div className="pt-2">
                                <PhaseOneGoal data={remoteStats?.phaseOneGoal ?? null} loading={initialLoading} />
                            </div>
                        </CollapsibleSection>
                    </div>

                    {executiveReport && (
                        <CollapsibleSection
                            title="التقييم التنفيذي للذكاء الاصطناعي"
                            icon={<Bot className="w-4 h-4" />}
                            subtitle="تقرير آلي لتحليل حالة المنصة"
                            defaultExpanded={false}
                            headerColors="border-purple-500/20 bg-purple-500/5 text-purple-400"
                            headerAction={renderSectionLink("ai-studio", "استوديو الذكاء")}
                        >
                            <div className="pt-2">
                                <ExecutiveReport data={executiveReport} loading={initialLoading} />
                            </div>
                        </CollapsibleSection>
                    )}

                    <CollapsibleSection
                        title="جاهزية التوسع التجاري"
                        icon={<Rocket className="w-4 h-4" />}
                        subtitle="تحليل فرصة النمو العالمي"
                        defaultExpanded={successDecision === "scale"}
                        headerColors="border-rose-500/20 bg-rose-500/5 text-rose-400"
                        headerAction={renderSectionLink("expansion-hub", "بوابة التوسع")}
                    >
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-rose-500/5 rounded-3xl border border-rose-500/10">
                            <div>
                                <h4 className="text-sm font-black text-white mb-2">حالة السوق القادم</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center font-black text-rose-400">
                                        {sovereignReport ? Math.round(sovereignReport.revenue.regionalResonance["Riyadh"] * 100) : "92"}%
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold">
                                        رنين مرتفع في <span className="text-rose-300">الرياض</span>.
                                        {sovereignReport && ` معدل العائد (ARPU) يقترب من $${sovereignReport.revenue.arpu.toFixed(1)}.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => {
                                        const url = new URL(window.location.href);
                                        url.searchParams.set("tab", "expansion-hub");
                                        window.history.pushState({}, "", url.toString());
                                        window.dispatchEvent(new PopStateEvent("popstate"));
                                    }}
                                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                                >
                                    عرض استراتيجية التوسع الكاملة
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>

                <div className="w-full xl:w-[350px] shrink-0 xl:h-[calc(100vh-200px)] xl:sticky top-6">
                    <TimelineOfSouls />
                </div>
            </div>
        </div>
    );
};
