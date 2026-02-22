import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Activity,
  Sparkles
} from "lucide-react";
import {
  getAggregateStats,
  getSessionsWithProgress
} from "../../../../services/journeyTracking";
import {
  fetchOverviewStats,
  fetchOpsInsights,
  fetchSystemHealth,
  fetchExecutiveReport, // New Import
  fetchWeeklyReport,
  fetchSecuritySignals,
  fetchOwnerOpsReport
} from "../../../../services/adminApi";
import { isSupabaseReady } from "../../../../services/supabaseClient";
import {
  fetchFlowAuditLogs,
  saveFlowAuditLog,
  type FlowAuditLogEntry
} from "../../../../services/flowAudit";
import { SuccessIndexCard } from "./components/SuccessIndexCard";
import { PulseStabilityCard } from "./components/PulseStabilityCard";
import { OpsInsights } from "./components/OpsInsights";
import { SystemHealth } from "./components/SystemHealth";
import { ExecutiveReport } from "./components/ExecutiveReport"; // New Import
import { PhaseOneGoal } from "./components/PhaseOneGoal"; // New Import
import { ConversionDiagnosis } from "./components/ConversionDiagnosis"; // New Import
import { GrowthAndFriction } from "./components/GrowthAndFriction"; // New Import
import { FunnelAndEmergency } from "./components/FunnelAndEmergency"; // New Import
import { DeepAnalytics } from "./components/DeepAnalytics"; // New Import
import { AwarenessAndScenarios } from "./components/AwarenessAndScenarios"; // New Import
import { MarketingAndRetention } from "./components/MarketingAndRetention"; // New Import
import { AdminTools } from "./components/AdminTools"; // New Import
import { SecuritySentinel } from "./components/SecuritySentinel";
import { LiveFreezeGuard } from "./components/LiveFreezeGuard";
import { AIGuardrailCard } from "./components/AIGuardrailCard";
import { RecoveryWidget } from "./components/RecoveryWidget";
import { SocialFirewall } from "./components/SocialFirewall";
import { ConsciousnessMap } from "../Consciousness/ConsciousnessMap";
import {
  type WeeklyReport
} from "../../../../services/adminApi";
import type {
  OpsInsights as OpsInsightsType,
  SystemHealthReport,
  ExecutiveReport as ExecutiveReportType,
  SecuritySignalsReport
} from "../../../../types/admin.types";
import { RevenueEngineCard } from "./components/RevenueEngineCard";
import { EmotionalPricingCard } from "./components/EmotionalPricingCard";
import { RevenueCardBoundary } from "./components/RevenueCardBoundary";

// --- Helper Components & Functions ---

const StatCard: FC<{ title: string; value: string; hint?: string; glowColor?: string }> = ({ title, value, hint, glowColor = "teal" }) => (
  <div className="relative group">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 to-slate-900/90 rounded-2xl" />
    <div className="relative admin-glass-card p-6 border-white/10 bg-slate-950/80 hover:bg-slate-900/80 transition-all overflow-hidden rounded-2xl">
      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${glowColor === 'teal' ? 'bg-teal-400' : 'bg-indigo-400'}`} />
      <div className="relative z-10">
        <p className="text-[11px] text-slate-400 uppercase tracking-[0.15em] font-bold group-hover:text-slate-300 transition-colors">{title}</p>
        <p className="text-4xl font-black text-white mt-3 tabular-nums group-hover:translate-x-0.5 transition-transform">{value}</p>
        {hint && <p className="text-[10px] text-slate-500 mt-3 italic truncate uppercase tracking-tight" title={hint}>{hint}</p>}
      </div>
    </div>
  </div>
);

const formatNumber = (value: number | null, fallback = "â€”") =>
  value == null || Number.isNaN(value) ? fallback : value.toLocaleString("ar-EG");

// --- OverviewPanel Component ---

export const OverviewPanel: FC = () => {
  const stats = getAggregateStats();
  const sessions = getSessionsWithProgress();
  // TODO: replace with a strict remote overview type after stabilizing the server payload contract.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [remoteStats, setRemoteStats] = useState<any>(null);
  const [opsInsights, setOpsInsights] = useState<OpsInsightsType | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthReport | null>(null);
  const [executiveReport, setExecutiveReport] = useState<ExecutiveReportType | null>(null); // New State
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [weeklyWindow, setWeeklyWindow] = useState<7 | 14 | 30>(7);
  const [securitySignals, setSecuritySignals] = useState<SecuritySignalsReport | null>(null);
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
    fetchDecisions();
    return () => { mounted = false; };
  }, []);

  const refreshRevenueReport = async (days: 7 | 14 | 30 = weeklyWindow) => {
    const weeklyData = await fetchWeeklyReport(days);
    setWeeklyReport(weeklyData ?? null);
    if (weeklyWindow !== days) setWeeklyWindow(days);
  };

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      Promise.all([
        fetchOverviewStats(),
        fetchOpsInsights(),
        fetchExecutiveReport(), // New Fetch
        fetchWeeklyReport(weeklyWindow),
        fetchOwnerOpsReport()
      ])
        .then(async ([overviewData, opsData, execData, weeklyData, ownerOps]) => {
          if (!mounted) return;
          let healthData = ownerOps?.systemHealth ?? null;
          let securityData = ownerOps?.securitySignals ?? null;
          if (!healthData || !securityData) {
            const [legacyHealth, legacySecurity] = await Promise.all([
              fetchSystemHealth(),
              fetchSecuritySignals()
            ]);
            healthData = healthData ?? legacyHealth;
            securityData = securityData ?? legacySecurity;
          }
          setRemoteStats(overviewData ?? null);
          setOpsInsights(opsData ?? null);
          setSystemHealth(healthData ?? null);
          setExecutiveReport(execData ?? null);
          setWeeklyReport(weeklyData ?? null);
          setSecuritySignals(securityData ?? null);
          setInitialLoading(false);
        })
        .catch((err) => {
          console.error("OverviewPanel refresh error", err);
          if (mounted) setInitialLoading(false);
        });
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [weeklyWindow]);

  const useRemoteAsSource = isSupabaseReady;
  const totalUsers = useRemoteAsSource ? (remoteStats?.totalUsers ?? 0) : sessions.length;
  const activeNowValue = useRemoteAsSource ? (remoteStats?.activeNow ?? 0) : 0;
  const avgMoodValue = useRemoteAsSource ? (remoteStats?.avgMood ?? null) : stats.avgMoodScore;
  const aiTokensUsed = useRemoteAsSource ? (remoteStats?.aiTokensUsed ?? 0) : stats.totalMoodLogged;

  const pulseEnergyWeekly = remoteStats?.pulseEnergyWeekly ?? null;
  const moodWeekly = remoteStats?.moodWeekly ?? null;
  const flowStats = remoteStats?.flowStats;
  const routingV2 = remoteStats?.routingV2 ?? null;
  const routingTelemetry = remoteStats?.routingTelemetry ?? null;
  const latencyQuality = routingTelemetry?.latencyQuality ?? null;
  const hasLowNoiseFilter =
    latencyQuality?.noiseFilteredPct != null && latencyQuality.noiseFilteredPct < 15;
  const hasLowLatencySample = (latencyQuality?.sampleCount ?? 0) < 30;
  const latencyQualityStatus: "healthy" | "warning" | "critical" =
    hasLowNoiseFilter && hasLowLatencySample
      ? "critical"
      : hasLowNoiseFilter || hasLowLatencySample
        ? "warning"
        : "healthy";
  const latencyQualityStatusLabel =
    latencyQualityStatus === "critical"
      ? "LATENCY TELEMETRY CRITICAL"
      : latencyQualityStatus === "warning"
        ? "LATENCY TELEMETRY WARNING"
        : "LATENCY TELEMETRY HEALTHY";

  const pulseCompletedCount = flowStats?.byStep?.pulse_completed ?? 0;
  const landingViewedCount = flowStats?.byStep?.landing_viewed ?? 0;
  const startClickedCount = flowStats?.byStep?.landing_clicked_start ?? 0;
  const authSuccessRateFromPulse = flowStats?.byStep?.auth_login_success && pulseCompletedCount > 0
    ? Math.round((flowStats.byStep.auth_login_success / pulseCompletedCount) * 100) : 0;
  const startClickRate = landingViewedCount > 0 ? Math.round((startClickedCount / landingViewedCount) * 100) : 0;
  const pulseCompletionRate = startClickedCount > 0 ? Math.round((pulseCompletedCount / startClickedCount) * 100) : 0;
  const retention7d = 15; // Placeholder

  const normalizedMetric = (val: number | null, target: number) => {
    if (val == null) return 0;
    return Math.min(val / target, 1.2);
  };
  const successIndex = Math.round(
    (normalizedMetric(startClickRate, 35) * 0.2 +
      normalizedMetric(pulseCompletionRate, 60) * 0.3 +
      normalizedMetric(authSuccessRateFromPulse, 40) * 0.3 +
      normalizedMetric(50, 45) * 0.1 + // Placeholder
      normalizedMetric(retention7d, 15) * 0.1) *
    100
  );

  const successSampleSize = Math.max(landingViewedCount, startClickedCount, pulseCompletedCount);
  const hasReliableSample = successSampleSize >= 30;
  const successDecision = !hasReliableSample ? "insufficient" : successIndex >= 75 ? "scale" : successIndex >= 50 ? "optimize" : "pivot";
  const successDecisionLabel = successDecision === "scale" ? "Ø§Ù„Ù…Ù‡Ù…Ø© ÙˆØ§Ø¶Ø­Ø©: Ù†Ø´Ø± Ø§Ù„ØªÙˆØ³Ø¹" : successDecision === "optimize" ? "ØªØ­Ø³ÙŠÙ† Ø§Ù„Ù…Ø³Ø§Ø±: Ù…Ø·Ù„ÙˆØ¨ ØªØ­Ø³ÙŠÙ†" : successDecision === "pivot" ? "ÙØ´Ù„ Ø§Ù„ÙØ±Ø¶ÙŠØ©: Ù…Ø­ÙˆØ±ÙŠ Ø­Ø±Ø¬" : "Ù‚ÙŠØ§Ø³ ØºÙŠØ± ÙƒØ§ÙÙ";
  const successDecisionClass = successDecision === "scale" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : successDecision === "optimize" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : successDecision === "pivot" ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : "text-slate-500 border-white/5 bg-slate-900/50";

  const handleCommitDecision = async () => {
    setDecisionSaving(true);
    setDecisionMessage(null);
    try {
      const entry = await saveFlowAuditLog({
        action: "weekly_success_decision",
        payload: {
          successIndex,
          successDecision,
          successDecisionLabel,
          sampleSize: successSampleSize,
          metrics: { startClickRate, pulseCompletionRate, authSuccessRateFromPulse },
          decidedAt: new Date().toISOString()
        }
      });
      setWeeklyDecisionLogs((prev) => [entry, ...prev].slice(0, 20));
      setDecisionMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ ÙÙŠ Ø§Ù„Ù†ÙˆØ§Ø© Ø§Ù„Ø¹ØµØ¨ÙŠØ©.");
    } catch {
      setDecisionMessage("ÙØ´Ù„ Ø§Ù„Ø­ÙØ¸.");
    } finally {
      setDecisionSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-10 h-10 text-teal-400 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-3">
          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Ø¬Ø§Ø±ÙŠ Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª</p>
          <p className="text-xs text-slate-600 uppercase font-mono">Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-teal-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(45,212,191,0.1),transparent)]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 p-10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-4xl font-black text-white uppercase tracking-tight">Ù…Ø±ÙƒØ² Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©</h2>
              <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)] animate-pulse" />
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Ù…ØªØµÙ„ Ù…Ø¨Ø§Ø´Ø±</span>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Ø¨Ø« Ù†Ø¨Ø¶ Ø§Ù„Ø±Ø­Ù„Ø©: Ù†Ø´Ø·</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-900/60 px-8 py-5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…</p>
              <p className="text-base font-bold text-emerald-400 uppercase">ØªØ´ØºÙŠÙ„ÙŠ</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ø§Ù„Ø¥ØµØ¯Ø§Ø±</p>
              <p className="text-base font-bold text-white uppercase">v2.1-Ù…Ø¯Ø§Ø±ÙŠ</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†" value={formatNumber(totalUsers)} hint={useRemoteAsSource ? "Ù…Ø²Ø§Ù…Ù†Ø© Ù…ÙˆØ«Ù‚Ø©" : "Ø¥Ø³Ù‚Ø§Ø· Ù…Ø­Ù„ÙŠ"} />
        <StatCard title="Ù†Ø´Ø· Ø§Ù„Ø¢Ù†" value={formatNumber(activeNowValue)} hint="Ø­Ø¶ÙˆØ± Ù…Ø¯Ø§Ø±ÙŠ" />
        <StatCard title="Ù…ØªÙˆØ³Ø· Ø§Ù„Ø·Ø§Ù‚Ø©" value={formatNumber(avgMoodValue)} hint="ØªØ¯ÙÙ‚ Ø§Ù„Ù…Ø²Ø§Ø¬" glowColor="indigo" />
        <StatCard title="Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø°ÙƒØ§Ø¡" value={formatNumber(aiTokensUsed)} hint="Ø£Ø­Ù…Ø§Ù„ Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø¹ØµØ¨ÙŠØ©" glowColor="indigo" />
      </div>

      <RecoveryWidget />

      {/* Social Topology Firewall (New) */}
      <SocialFirewall loading={initialLoading} />

      {routingV2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Routing V2 Decisions"
            value={formatNumber(routingV2.decisions ?? 0)}
            hint="حجم قرارات المحرك الديناميكي"
          />
          <StatCard
            title="Exploration Rate"
            value={routingV2.explorationRate != null ? `${routingV2.explorationRate}%` : "—"}
            hint="نسبة استكشاف مضادة لغرفة الصدى"
            glowColor="indigo"
          />
          <StatCard
            title="Completion Acted"
            value={routingV2.completionRateActedOnly != null ? `${routingV2.completionRateActedOnly}%` : "—"}
            hint="معدل إكمال الجلسات المتفاعلة"
          />
        </div>
      )}
      {routingTelemetry && (
        <>
          <div
            className={`rounded-2xl border px-4 py-3 text-xs font-bold tracking-wide ${latencyQualityStatus === "critical"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
              : latencyQualityStatus === "warning"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
          >
            {latencyQualityStatusLabel}
            {hasLowNoiseFilter ? " | noiseFilteredPct < 15%" : ""}
            {hasLowLatencySample ? " | sampleCount < 30" : ""}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Fallback Rate 24h"
              value={routingTelemetry.cacheHealth?.fallbackRatePct != null ? `${routingTelemetry.cacheHealth.fallbackRatePct}%` : "—"}
              hint="انخفاضها = اعتماد أعلى على V2 cache"
              glowColor="indigo"
            />
            <StatCard
              title="Exploration Share"
              value={routingTelemetry.explorationHealth?.explorationSharePct != null ? `${routingTelemetry.explorationHealth.explorationSharePct}%` : "—"}
              hint="النسبة الفعلية للاستكشاف مقابل الاستغلال"
            />
            <StatCard
              title="Explore Completion"
              value={routingTelemetry.explorationHealth?.explorationCompletionRatePct != null ? `${routingTelemetry.explorationHealth.explorationCompletionRatePct}%` : "—"}
              hint="إكمال المحتوى أثناء الاستكشاف"
            />
            <StatCard
              title="Exploit Completion"
              value={routingTelemetry.explorationHealth?.exploitationCompletionRatePct != null ? `${routingTelemetry.explorationHealth.exploitationCompletionRatePct}%` : "—"}
              hint="إكمال المحتوى أثناء الاستغلال"
              glowColor="indigo"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Noise Filtered %"
              value={routingTelemetry.latencyQuality?.noiseFilteredPct != null ? `${routingTelemetry.latencyQuality.noiseFilteredPct}%` : "—"}
              hint={
                hasLowNoiseFilter
                  ? "تحذير: التصفية أقل من الحد المطلوب (15%)"
                  : "الفرق بين الزمن الخام والزمن النشط"
              }
              glowColor={hasLowNoiseFilter ? "teal" : "indigo"}
            />
            <StatCard
              title="Avg Raw Sec"
              value={routingTelemetry.latencyQuality?.avgRawElapsedSec != null ? `${routingTelemetry.latencyQuality.avgRawElapsedSec}s` : "—"}
              hint="متوسط الزمن الخام قبل الفلترة"
            />
            <StatCard
              title="Avg Active Sec"
              value={routingTelemetry.latencyQuality?.avgActiveElapsedSec != null ? `${routingTelemetry.latencyQuality.avgActiveElapsedSec}s` : "—"}
              hint="متوسط الزمن النشط المعتمد"
            />
            <StatCard
              title="Avg Hesitation Sec"
              value={routingTelemetry.latencyQuality?.avgHesitationSec != null ? `${routingTelemetry.latencyQuality.avgHesitationSec}s` : "—"}
              hint={
                hasLowLatencySample
                  ? `تحذير: حجم العينة منخفض (${formatNumber(routingTelemetry.latencyQuality?.sampleCount ?? 0)})`
                  : `حجم العينة: ${formatNumber(routingTelemetry.latencyQuality?.sampleCount ?? 0)}`
              }
              glowColor="indigo"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Interventions 24h"
              value={formatNumber(routingTelemetry.interventionHealth?.totalInterventions ?? 0)}
              hint="عدد تدخلات الإنقاذ اللحظي"
            />
            <StatCard
              title="Intervention Rate"
              value={routingTelemetry.interventionHealth?.interventionRatePct != null ? `${routingTelemetry.interventionHealth.interventionRatePct}%` : "—"}
              hint="نسبة التدخل من إجمالي قرارات V2"
              glowColor="indigo"
            />
          </div>

          <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.15em] font-bold mb-4">Routing Cognitive Matrix</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right text-slate-300">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-2 px-2">Capacity</th>
                    <th className="py-2 px-2">Load Band</th>
                    <th className="py-2 px-2">Decisions</th>
                    <th className="py-2 px-2">Completed</th>
                    <th className="py-2 px-2">Completion %</th>
                  </tr>
                </thead>
                <tbody>
                  {(routingTelemetry.cognitiveEffectiveness?.completionMatrix ?? []).slice(0, 12).map((row: {
                    capacityBand?: string;
                    selectedLoadBand?: string;
                    decisions?: number;
                    completedCount?: number;
                    completionRatePct?: number;
                  }) => (
                    <tr key={`${row.capacityBand}-${row.selectedLoadBand}`} className="border-t border-white/5">
                      <td className="py-2 px-2">{row.capacityBand}</td>
                      <td className="py-2 px-2">{row.selectedLoadBand}</td>
                      <td className="py-2 px-2">{formatNumber(row.decisions ?? 0)}</td>
                      <td className="py-2 px-2">{formatNumber(row.completedCount ?? 0)}</td>
                      <td className="py-2 px-2">{row.completionRatePct != null ? `${row.completionRatePct}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.15em] font-bold mb-4">Interventions By Segment</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right text-slate-300">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-2 px-2">Segment</th>
                    <th className="py-2 px-2">Interventions</th>
                    <th className="py-2 px-2">Decisions</th>
                    <th className="py-2 px-2">Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {(routingTelemetry.interventionHealth?.bySegment ?? []).slice(0, 10).map((row: {
                    segmentKey?: string;
                    interventions?: number;
                    decisions?: number;
                    interventionRatePct?: number;
                  }) => (
                    <tr key={row.segmentKey} className="border-t border-white/5">
                      <td className="py-2 px-2">{row.segmentKey}</td>
                      <td className="py-2 px-2">{formatNumber(row.interventions ?? 0)}</td>
                      <td className="py-2 px-2">{formatNumber(row.decisions ?? 0)}</td>
                      <td className="py-2 px-2">{row.interventionRatePct != null ? `${row.interventionRatePct}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <LiveFreezeGuard />

      <SecuritySentinel data={securitySignals} loading={initialLoading} />

      <AIGuardrailCard />

      {/* Phase One Goal (New) */}
      <div className="admin-glass-card p-8 border-white/5 bg-slate-950/40 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <PhaseOneGoal data={remoteStats?.phaseOneGoal ?? null} loading={initialLoading} />
      </div>

      {/* Conversion Diagnosis (Restored) */}
      <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
        <ConversionDiagnosis data={remoteStats?.conversionHealth ?? null} loading={initialLoading} />
      </div>

      {/* Growth & Friction (New) */}
      <GrowthAndFriction
        growthData={remoteStats?.growthData ?? []}
        frictionData={remoteStats?.taskFriction ?? null}
        loading={initialLoading}
      />

      {/* Funnel & Emergency (New) */}
      <FunnelAndEmergency
        funnelData={remoteStats?.funnel}
        emergencyData={remoteStats?.emergencyLogs ?? []}
        loading={initialLoading}
      />

      {/* Deep Analytics (New) */}
      <DeepAnalytics
        flowStats={remoteStats?.flowStats}
        weeklyRhythm={remoteStats?.weeklyRhythm}
        loading={initialLoading}
      />

      {/* Awareness & Scenarios (New) */}
      <AwarenessAndScenarios
        zones={remoteStats?.zones ?? []}
        topScenarios={remoteStats?.topScenarios ?? null}
        awarenessGap={remoteStats?.awarenessGap ?? null}
        loading={initialLoading}
      />

      {/* Marketing & Retention (New) */}
      <MarketingAndRetention
        utmBreakdown={remoteStats?.utmBreakdown}
        retentionCohorts={remoteStats?.retentionCohorts}
        loading={initialLoading}
      />

      <RevenueCardBoundary>
        <RevenueEngineCard
          data={weeklyReport}
          loading={initialLoading}
          windowDays={weeklyWindow}
          onWindowChange={(days) => {
            void refreshRevenueReport(days);
          }}
          onRefresh={refreshRevenueReport}
        />
      </RevenueCardBoundary>

      <EmotionalPricingCard loading={initialLoading} />

      {/* Admin Tools (New) */}
      <AdminTools loading={initialLoading} />

      {/* Operational Insights (Promoted) */}
      {(opsInsights || initialLoading) && (
        <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
          <OpsInsights data={opsInsights} loading={initialLoading} />
        </div>
      )}

      {/* Executive Report (Restored) */}
      {(executiveReport || initialLoading) && (
        <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
          <ExecutiveReport data={executiveReport} loading={initialLoading} />
        </div>
      )}

      {/* System Health (Restored) */}
      {(systemHealth || initialLoading) && (
        <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
          <SystemHealth data={systemHealth} loading={initialLoading} />
        </div>
      )}

      {/* Consciousness Map */}
      <ConsciousnessMap />

      {/* Success Index */}
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
        weeklyDecisionLoading={weeklyDecisionLoading}
      />

      {/* Pulse Stability Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <PulseStabilityCard
          type="energy"
          unstableToCompletedPct={pulseEnergyWeekly?.unstableToCompletedPct ?? null}
          stabilityRate={pulseEnergyWeekly?.unstableToCompletedPct != null ? 100 - pulseEnergyWeekly.unstableToCompletedPct : null}
          isRisk={(pulseEnergyWeekly?.unstableToCompletedPct ?? 0) > 35}
          recommendationRate={null}
          points={pulseEnergyWeekly?.points ?? []}
        />
        <PulseStabilityCard
          type="mood"
          unstableToCompletedPct={moodWeekly?.unstableToCompletedPct ?? null}
          stabilityRate={moodWeekly?.unstableToCompletedPct != null ? 100 - moodWeekly.unstableToCompletedPct : null}
          isRisk={(moodWeekly?.unstableToCompletedPct ?? 0) > 35}
          recommendationRate={null}
          points={moodWeekly?.points ?? []}
        />
      </div>

      {/* Footer */}
      <div className="admin-glass-card p-8 border-white/5 bg-slate-950/20 text-center rounded-2xl">
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Ù†Ù‡Ø§ÙŠØ© Ø¨Ø« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</p>
      </div>
    </div>
  );
};



