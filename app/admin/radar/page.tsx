"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { downloadBlobFile } from "../../../src/services/clientDom";
import { safeGetSession, supabase } from "../../../src/services/supabaseClient";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { runtimeEnv } from "@/config/runtimeEnv";
import styles from "./radar.module.css";

type RadarPulse = {
  global_phoenix_avg: number;
  kinetic_distribution: Record<string, number>;
  healing_velocity: number;
  ai_workload_avg: number;
  generated_at: string;
};

// --- Ref-based Progress Bar to avoid Inline Styles hint ---
const RefProgressBar: React.FC<{ width: string; className?: string }> = ({ width, className }) => {
  const barRef = useRef<HTMLDivElement>(null);
  
  useLayoutEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty("--progress-width", width);
    }
  }, [width]);

  return <div ref={barRef} className={className} />;
};

type RadarResponse = {
  pulse?: RadarPulse | null;
  source?: string;
  is_live?: boolean;
  error?: string;
};

type RadarContentResponse = {
  ideas?: string[];
  insight?: string;
  model?: string;
  source?: string;
  is_live?: boolean;
  usedFallback?: boolean;
  error?: string;
};

type WeeklyDecision = {
  code: string;
  title: string;
  action: string;
  metric: string;
};

type FunnelDailyPoint = {
  date: string;
  landingViewed: number;
  ctaFreeClicked: number;
  ctaActivationClicked: number;
  activationPageViewed: number;
  paymentSuccess: number;
  paymentFailed: number;
  paymentSuccessRatePct: number;
};

type WeeklyReportResponse = {
  oneDecision?: WeeklyDecision;
  funnelDailySeries?: FunnelDailyPoint[];
};

type GateFunnelStats = {
  summary: {
    total_impressions: number;
    lead_count: number;
    qualified_count: number;
    activation_count: number;
    rates: {
      impression_to_lead: number;
      lead_to_qualified: number;
      qualified_to_activated: number;
      overall_conversion: number;
    };
  };
  question_telemetry_last_7d: {
    q1_view: number;
    q1_answer: number;
    q2_view: number;
    q2_answer: number;
    q3_view: number;
    q3_answer: number;
  };
  payment_telemetry_last_7d: {
    checkout_init: number;
    method_selected: number;
    number_copied: number;
    support_clicked: number;
  };
  diagnosis_funnel_last_7d?: {
    view: number;
    step1: number;
    step2: number;
    step3: number;
    step4: number;
    step5: number;
    result_view: number;
  };
  onboarding_funnel_last_7d?: {
    opened: number;
    noise_check: number;
    pain_dump: number;
    inventory: number;
    mapping: number;
    insight: number;
    contact: number;
    results: number;
    completed: number;
  };
  onboarding_avg_durations?: Record<string, number>;
  engagement_telemetry_last_7d?: {
    mizan_view: number;
    wird_view: number;
    ritual_complete: number;
    offer_view: number;
    offer_click: number;
  };
  sources: Record<string, {
    total: number;
    leads: number;
    qualified: number;
    activated: number;
  }>;
  timestamp: string;
};

type OpsAlert = {
  level: "warning" | "critical";
  code: string;
  message: string;
  value: number;
  threshold: number;
};

type AiFailure = {
  id: string;
  created_at: string;
  feature: string | null;
  model: string | null;
  failure_reason: string;
  error_message: string | null;
};

type SystemHealthResponse = {
  status: "healthy" | "warning" | "degraded";
  generatedAt: string;
  alerts?: OpsAlert[];
  probe?: {
    supabaseReachable: boolean;
    supabaseProbeMs: number;
  };
  api?: {
    uptimeSec: number;
    requests: number;
    errors: number;
    errorRate: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    lastErrorAt: string | null;
  };
  telemetry?: {
    api5xx24h?: number;
    llmLatencyP95Ms?: number;
    tokenUsage24h?: number;
    recentAiFailures?: AiFailure[];
  };
  observability?: {
    errorPulse24h?: number;
    ahaMomentPulse24h?: number;
  };
};

type SupportTicketResponse = {
  tickets?: Array<Record<string, unknown>>;
  error?: string;
};

type SupportTicket = {
  id: string;
  title: string;
  message: string;
  source: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  metadata: Record<string, unknown> | null;
};

type PaymentProofMeta = {
  name: string | null;
  type: string | null;
  bytes: number | null;
  previewUrl: string | null;
  storagePath: string | null;
};

type TicketVisibilityFilter = "all" | "open" | "linked";
type TicketSortMode = "newest" | "oldest" | "priority";

const KINETIC_KEYS = [
  "impulsive_aggressive",
  "hesitant_anxious",
  "scattered_unsettled",
  "grounded_deliberate",
  "unknown"
] as const;

function formatSigned(value: number): string {
  const rounded = Number.isFinite(value) ? value.toFixed(2) : "0.00";
  return value > 0 ? `+${rounded}` : rounded;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function toTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function toSupportTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    source: String(row.source ?? "manual"),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "normal"),
    category: row.category ? String(row.category) : null,
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null
  };
}

function getProofImage(metadata: Record<string, unknown> | null): PaymentProofMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = metadata.proof_image;
  if (!raw || typeof raw !== "object") return null;
  const proof = raw as Record<string, unknown>;
  const signedUrl = typeof proof.signed_url === "string" && proof.signed_url.trim() ? proof.signed_url.trim() : null;
  const dataUrl = typeof proof.data_url === "string" && proof.data_url.trim() ? proof.data_url.trim() : null;

  return {
    name: proof.name ? String(proof.name) : null,
    type: proof.type ? String(proof.type) : null,
    bytes: Number.isFinite(Number(proof.bytes)) ? Math.round(Number(proof.bytes)) : null,
    previewUrl: signedUrl ?? dataUrl,
    storagePath: proof.storage_path ? String(proof.storage_path) : null
  };
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPriorityWeight(priority: string): number {
  if (priority === "high") return 0;
  if (priority === "normal") return 1;
  return 2;
}

function getTicketUserId(metadata: Record<string, unknown> | null): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const userId = String(metadata.user_id ?? "").trim();
  return userId || null;
}

function getSupportTicketLabel(ticket: SupportTicket): string {
  if (ticket.source === "activation_manual_proof" || ticket.category === "payment_activation") {
    return "Revenue access unlock";
  }
  if (ticket.source === "manual") {
    return "Manual review";
  }
  return "Support ticket";
}

function escapeCsvCell(value: unknown): string {
  const normalized = String(value ?? "").replace(/"/g, "\"\"");
  return `"${normalized}"`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function copyTextValue(value: string, onDone: (message: string) => void) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  await navigator.clipboard.writeText(value);
  onDone(`Copied: ${value}`);
}

const GateFunnelRadar: React.FC<{ stats: GateFunnelStats | null }> = ({ stats }) => {
  if (!stats) return <p className="text-sm text-[var(--color-text-muted)]">Gate telemetry warming up...</p>;

  const { total_impressions, lead_count, qualified_count, activation_count, rates } = stats.summary;
  const qStats = stats.question_telemetry_last_7d;

  const steps = [
    { label: "Impressions", value: total_impressions, rate: 100, color: "var(--color-text-muted)" },
    { label: "Leads", value: lead_count, rate: rates.impression_to_lead, color: "var(--soft-teal)" },
    { label: "Qualified", value: qualified_count, rate: rates.lead_to_qualified, color: "var(--vibrant-blue)" },
    { label: "Activated", value: activation_count, rate: rates.overall_conversion, color: "#fcd34d" }
  ];

  const qSteps = [
    { label: "Q1", view: qStats?.q1_view || 0, ans: qStats?.q1_answer || 0 },
    { label: "Q2", view: qStats?.q2_view || 0, ans: qStats?.q2_answer || 0 },
    { label: "Q3", view: qStats?.q3_view || 0, ans: qStats?.q3_answer || 0 }
  ].filter(q => q.view > 0);

  return (
    <div className="space-y-6">
      {/* Main Funnel */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.label} className="relative">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{step.label}</span>
              <span className="text-xs font-bold">{step.value}</span>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
              <div 
                className="h-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${Math.max(step.rate, 2)}%`, 
                  backgroundColor: step.color,
                  boxShadow: `0 0 15px ${step.color}44`
                }}
              />
            </div>
            {idx > 0 && (
              <div className="absolute -top-3 right-0 text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
                {step.rate.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Question Dropout Micro-Funnel */}
      {qSteps.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Qualifier Retention (Last 7d)</p>
          <div className="grid grid-cols-3 gap-2">
            {qSteps.map((q) => {
              const retention = q.view > 0 ? (q.ans / q.view) * 100 : 0;
              const isLeaky = retention < 70;
              return (
                <div key={q.label} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-black text-[var(--color-text-muted)] mb-1">{q.label}</span>
                  <p className={`text-sm font-black ${isLeaky ? "text-rose-400" : "text-emerald-400"}`}>
                    {retention.toFixed(0)}%
                  </p>
                  <span className="text-[8px] opacity-60 mt-1">{q.ans}/{q.view}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Rates */}
      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[9px] text-[var(--color-text-muted)] uppercase">L1 -{">"} L2 Drop</p>
          <p className="text-sm font-bold text-rose-300">{(100 - rates.lead_to_qualified).toFixed(1)}%</p>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[9px] text-[var(--color-text-muted)] uppercase">Overall Conv</p>
          <p className="text-sm font-bold text-emerald-300">{rates.overall_conversion.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

const RevenueFunnelRadar: React.FC<{ stats: GateFunnelStats | null }> = ({ stats }) => {
  if (!stats?.payment_telemetry_last_7d) return <p className="text-sm text-[var(--color-text-muted)]">Revenue telemetry warming up...</p>;

  const pStats = stats.payment_telemetry_last_7d;
  
  const steps = [
    { label: "Checkout Init", value: pStats.checkout_init, color: "var(--soft-teal)" },
    { label: "Method Selected", value: pStats.method_selected, color: "var(--vibrant-blue)" },
    { label: "Number Copied", value: pStats.number_copied, color: "#fcd34d" },
  ];

  const getRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (current / previous) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Funnel */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const rate = idx === 0 ? 100 : getRate(step.value, steps[idx-1].value);
          const overallRate = idx === 0 ? 100 : (step.value / (steps[0].value || 1)) * 100;

          return (
            <div key={step.label} className="relative">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{step.label}</span>
                <span className="text-xs font-bold">{step.value}</span>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${Math.max(overallRate, 2)}%`, 
                    backgroundColor: step.color,
                    boxShadow: `0 0 15px ${step.color}44`
                  }}
                />
              </div>
              {idx > 0 && (
                <div className="absolute -top-3 right-0 text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
                  {rate.toFixed(1)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Health Metrics */}
      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-[var(--color-text-muted)] mb-1">Support Contact</span>
          <p className="text-lg font-black text-emerald-400">{pStats.support_clicked}</p>
          <span className="text-[8px] opacity-60 mt-1">Friction Alerts</span>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-[var(--color-text-muted)] mb-1">Intent vs Exit</span>
          <p className="text-lg font-black text-rose-300">
            {getRate(pStats.checkout_init - pStats.number_copied, pStats.checkout_init).toFixed(0)}%
          </p>
          <span className="text-[8px] opacity-60 mt-1">Drop-off Rate</span>
        </div>
      </div>
    </div>
  );
};

const DiagnosisFunnelRadar: React.FC<{ stats: GateFunnelStats | null }> = ({ stats }) => {
  if (!stats?.diagnosis_funnel_last_7d) return <p className="text-sm text-[var(--color-text-muted)]">Diagnosis telemetry warming up...</p>;

  const d = stats.diagnosis_funnel_last_7d;
  const steps = [
    { label: "Viewed", value: d.view, color: "var(--color-text-muted)" },
    { label: "Step 1", value: d.step1, color: "var(--soft-teal)" },
    { label: "Step 3", value: d.step3, color: "var(--vibrant-blue)" },
    { label: "Step 5", value: d.step5, color: "#a78bfa" },
    { label: "Results", value: d.result_view, color: "#fcd34d" },
  ];

  const getRate = (current: number, previous: number) => (previous === 0 ? 0 : (current / previous) * 100);

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const rate = idx === 0 ? 100 : getRate(step.value, steps[idx - 1].value);
        const overallRate = idx === 0 ? 100 : (step.value / (steps[0].value || 1)) * 100;

        return (
          <div key={step.label} className="relative">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{step.label}</span>
              <span className="text-xs font-bold">{step.value}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.max(overallRate, 2)}%`,
                  backgroundColor: step.color,
                }}
              />
            </div>
            {idx > 0 && (
              <div className="absolute -top-3 right-0 text-[10px] font-black text-emerald-400">
                {rate.toFixed(1)}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const OnboardingFunnelRadar: React.FC<{ stats: GateFunnelStats | null }> = ({ stats }) => {
  if (!stats?.onboarding_funnel_last_7d) return <p className="text-sm text-[var(--color-text-muted)]">Onboarding telemetry warming up...</p>;

  const o = stats.onboarding_funnel_last_7d;
  const durs = stats.onboarding_avg_durations || {};
  
  const steps = [
    { label: "Opened", value: o.opened, key: "opened", color: "var(--color-text-muted)" },
    { label: "Noise", value: o.noise_check, key: "noise_check", color: "#94a3b8" },
    { label: "Pain", value: o.pain_dump, key: "pain_dump", color: "#f87171" },
    { label: "Inv", value: o.inventory, key: "inventory", color: "#fb923c" },
    { label: "Map", value: o.mapping, key: "mapping", color: "#38bdf8" },
    { label: "Insight", value: o.insight, key: "insight", color: "#818cf8" },
    { label: "Contact", value: o.contact, key: "contact", color: "#c084fc" },
    { label: "Results", value: o.results, key: "results", color: "#4ade80" },
    { label: "Done", value: o.completed, key: "completed", color: "#22c55e" },
  ];

  const getRate = (current: number, previous: number) => (previous === 0 ? 0 : (current / previous) * 100);
  
  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  const getFrictionLevel = (key: string, ms?: number) => {
    if (!ms) return "normal";
    const sec = ms / 1000;
    if (key === "mapping" && sec > 120) return "high";
    if (key === "pain_dump" && sec > 90) return "high";
    if (sec > 60) return "high";
    return "normal";
  };

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const rate = idx === 0 ? 100 : getRate(step.value, steps[idx - 1].value);
        const overallRate = idx === 0 ? 100 : (step.value / (steps[0].value || 1)) * 100;
        const duration = durs[step.key];
        const friction = getFrictionLevel(step.key, duration);

        return (
          <div key={step.label} className="relative group">
            <div className="flex items-center justify-between mb-0.5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-tighter text-[var(--color-text-muted)] font-medium">{step.label}</span>
                {duration && (
                  <span className={`text-[8px] font-black px-1 rounded ${friction === "high" ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-[var(--color-text-muted)]"}`}>
                    {formatDuration(duration)}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">{step.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5 relative">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.max(overallRate, 2)}%`,
                  backgroundColor: step.color,
                  opacity: friction === "high" ? 0.8 : 1
                }}
              />
            </div>
            {idx > 0 && step.value > 0 && (
              <div className="absolute -top-3 right-0 text-[9px] font-black text-emerald-400">
                {rate.toFixed(0)}%
              </div>
            )}
            
            {/* Friction Tooltip Area */}
            {friction === "high" && (
                <div className="absolute -right-1 top-1 w-1 h-1 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            )}
          </div>
        );
      })}
    </div>
  );
};

const EngagementRadar: React.FC<{ stats: GateFunnelStats | null }> = ({ stats }) => {
  if (!stats?.engagement_telemetry_last_7d) return <p className="text-sm text-[var(--color-text-muted)]">Engagement telemetry warming up...</p>;

  const e = stats.engagement_telemetry_last_7d;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
        <p className="text-[10px] uppercase text-[var(--color-text-muted)]">Mizan Awareness</p>
        <p className="text-xl font-black text-violet-400">{e.mizan_view}</p>
      </div>
      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
        <p className="text-[10px] uppercase text-[var(--color-text-muted)]">Rituals Completed</p>
        <p className="text-xl font-black text-teal-400">{e.ritual_complete}</p>
      </div>
    </div>
  );
};

const VariantPerformanceRadar: React.FC<{ stats: GateFunnelStats | null }> = ({ stats }) => {
  if (!stats?.sources) return <p className="text-sm text-[var(--color-text-muted)]">A/B data warming up...</p>;

  return (
    <div className="space-y-3">
      {Object.entries(stats.sources).sort((a, b) => b[1].total - a[1].total).map(([source, s]) => {
        const conv = s.total > 0 ? (s.activated / s.total) * 100 : 0;
        const ctr = s.total > 0 ? (s.leads / s.total) * 100 : 0;
        const isWinning = conv > 1.5; // Example threshold

        return (
          <div key={source} className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isWinning ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400"}`}>
                {source}
              </span>
              <span className="text-[10px] font-bold text-slate-500">{s.total} users</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8px] uppercase text-slate-500">Funnel Entry (CTR)</p>
                <p className="text-sm font-black text-sky-400">{ctr.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[8px] uppercase text-slate-500">Conv (ROAS Focus)</p>
                <p className="text-sm font-black text-amber-400">{conv.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AiStabilityRadar: React.FC<{ failures: AiFailure[] }> = ({ failures }) => {
  if (failures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest">Sovereign Awareness Stable</p>
        <p className="text-[10px] text-emerald-200/40 mt-1">No AI failures detected in recent cycles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Recent Awareness Failures</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300">{failures.length} Anomalies</span>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {failures.map((fail) => (
          <div key={fail.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/20 transition-all group">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-vibrant-blue/20 text-vibrant-blue border border-vibrant-blue/10">
                    {fail.feature || "global"}
                  </span>
                  <span className="text-[9px] font-medium text-[var(--color-text-muted)]">
                    {fail.model?.split("/").pop()}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-rose-200 leading-tight">
                  {fail.failure_reason.replace(/_/g, " ")}
                </p>
              </div>
              <span className="text-[8px] text-[var(--color-text-muted)] whitespace-nowrap">
                {new Date(fail.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {fail.error_message && (
              <p className="mt-2 text-[9px] text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all">
                {fail.error_message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemHealthRadar: React.FC<{
  api: SystemHealthResponse["api"] | null;
  probe: SystemHealthResponse["probe"] | null;
  status: SystemHealthResponse["status"];
}> = ({ api, probe, status }) => {
  if (!api || !probe) return <p className="text-sm text-[var(--color-text-muted)]">System vitals warming up...</p>;

  const statusColor = status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : "text-rose-400";
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Global Health</span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${statusColor}`}>{status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[8px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">DB Probe</p>
          <p className="text-sm font-black text-emerald-400">{probe.supabaseProbeMs}ms</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[8px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">API Uptime</p>
          <p className="text-sm font-black text-vibrant-blue">{(api.uptimeSec / 3600).toFixed(1)}h</p>
        </div>
      </div>

      <div className="space-y-3 px-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
             <span className="text-[var(--color-text-muted)] uppercase tracking-tighter">P95 Response</span>
             <span className="font-bold">{api.p95LatencyMs}ms</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
            <div 
               className="h-full bg-vibrant-blue transition-all duration-1000" 
               style={{ width: `${Math.min((api.p95LatencyMs / 1000) * 100, 100)}%` }} 
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
             <span className="text-[var(--color-text-muted)] uppercase tracking-tighter">Error Flux</span>
             <span className={`font-bold ${api.errorRate > 2 ? "text-rose-400" : "text-emerald-400"}`}>{api.errorRate.toFixed(2)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
            <div 
               className="h-full bg-rose-400 transition-all duration-1000" 
               style={{ width: `${Math.min(api.errorRate * 5, 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {api.lastErrorAt && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-rose-300/50 text-center italic">
            Last anomaly: {new Date(api.lastErrorAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

import { MarkazScreen } from "@/modules/markaz/MarkazScreen";

export default function AdminRadarPage() {
  const [activeTab, setActiveTab] = useState<"radar" | "ops" | "horus">("radar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState<RadarPulse | null>(null);
  const [trendHistory, setTrendHistory] = useState<number[]>([]);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [contentInsight, setContentInsight] = useState<string>("");
  const [contentLoading, setContentLoading] = useState(false);
  const [contentMeta, setContentMeta] = useState<{ model: string; usedFallback: boolean } | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState<string | null>(null);
  const [oneDecision, setOneDecision] = useState<WeeklyDecision | null>(null);
  const [dailyFunnel, setDailyFunnel] = useState<FunnelDailyPoint[]>([]);
  const [opsAlerts, setOpsAlerts] = useState<OpsAlert[]>([]);
  const [opsTelemetry, setOpsTelemetry] = useState<SystemHealthResponse["telemetry"] | null>(null);
  const [apiStats, setApiStats] = useState<SystemHealthResponse["api"] | null>(null);
  const [probeStatus, setProbeStatus] = useState<SystemHealthResponse["probe"] | null>(null);
  const [healthStatus, setHealthStatus] = useState<SystemHealthResponse["status"]>("healthy");
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketActionId, setTicketActionId] = useState<string | null>(null);
  const [ticketVisibility, setTicketVisibility] = useState<TicketVisibilityFilter>("open");
  const [ticketSort, setTicketSort] = useState<TicketSortMode>("newest");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [gateFunnel, setGateFunnel] = useState<GateFunnelStats | null>(null);
  const [observability, setObservability] = useState<SystemHealthResponse["observability"] | null>(null);

  const getSecureProofUrl = async (path: string) => {
    if (!supabase) return;
    try {
      setTicketNotice("Generating secure preview link...");
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(path, 3600);
      
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        setTicketNotice("Secure preview opened in new tab.");
      }
    } catch (err) {
      console.error("Signed URL error:", err);
      setTicketNotice("Error generating secure preview.");
    }
  };

  const getAdminAccessToken = useCallback(async (): Promise<string> => {
    const session = await safeGetSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw new Error("Unauthorized");
    return accessToken;
  }, []);

  const loadRadar = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      const accessToken = await getAdminAccessToken();

      const [radarResponse, weeklyResponse, healthResponse, supportResponse, gateResponse] = await Promise.all([
        fetch("/api/admin?path=radar", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store"
        }),
        fetch("/api/admin?path=overview&kind=weekly-report&days=7", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store"
        }),
        fetch("/api/admin?path=overview&kind=system-health", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store"
        }),
        fetch("/api/admin?path=overview&kind=support-tickets&limit=12", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store"
        }),
        fetch("/api/admin/analytics/gate-dropout", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store"
        })
      ]);
      const radarBody = (await radarResponse.json()) as RadarResponse;
      const weeklyBody = (await weeklyResponse.json()) as WeeklyReportResponse;
      const healthBody = (await healthResponse.json()) as SystemHealthResponse;
      const supportBody = (await supportResponse.json()) as SupportTicketResponse;
      const gateBody = (await gateResponse.json()) as GateFunnelStats;

      if (!radarResponse.ok || radarBody?.is_live !== true || !radarBody?.pulse) {
        throw new Error(radarBody?.error || "Failed to load radar pulse");
      }

      setPulse(radarBody.pulse);
      setTrendHistory((prev) => [...prev.slice(-19), Number(radarBody.pulse?.global_phoenix_avg ?? 0)]);
      setOneDecision(weeklyBody?.oneDecision ?? null);
      setDailyFunnel(Array.isArray(weeklyBody?.funnelDailySeries) ? weeklyBody.funnelDailySeries : []);
      
      // Health mappings with explicit status checks
      if (healthResponse.ok) {
        setOpsAlerts(Array.isArray(healthBody?.alerts) ? healthBody.alerts : []);
        setOpsTelemetry(healthBody?.telemetry ?? null);
        setObservability(healthBody?.observability ?? null);
        setApiStats(healthBody?.api ?? null);
        setProbeStatus(healthBody?.probe ?? null);
        setHealthStatus(healthBody?.status || "healthy");
      } else {
        console.error("[Radar] System health probe failed", healthBody);
      }

      setSupportTickets(
        Array.isArray(supportBody?.tickets)
          ? supportBody.tickets
            .map(toSupportTicket)
            .filter((ticket) => ticket.source === "activation_manual_proof" || ticket.category === "payment_activation")
          : []
      );
      if (gateBody?.summary) {
        setGateFunnel(gateBody);
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to load radar pulse"));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [getAdminAccessToken]);

  useEffect(() => {
    void loadRadar(true);
    const timer = setInterval(() => {
      void loadRadar(false);
    }, 60_000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loadRadar]);

  useEffect(() => {
    setSelectedTicketIds((current) => current.filter((ticketId) => supportTickets.some((ticket) => ticket.id === ticketId)));
  }, [supportTickets]);

  const kineticBars = useMemo(() => {
    const distribution = pulse?.kinetic_distribution ?? {};
    const total = KINETIC_KEYS.reduce((sum, key) => sum + Number(distribution[key] ?? 0), 0);
    return KINETIC_KEYS.map((key) => {
      const value = Number(distribution[key] ?? 0);
      const percent = total > 0 ? (value / total) * 100 : 0;
      return { key, value, percent };
    });
  }, [pulse]);

  const trendPath = useMemo(() => {
    if (trendHistory.length < 2) return "";
    const w = 220;
    const h = 64;
    const min = Math.min(...trendHistory);
    const max = Math.max(...trendHistory);
    const range = Math.max(max - min, 0.0001);
    return trendHistory
      .map((v, i) => {
        const x = (i / (trendHistory.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [trendHistory]);

  const showAnomaly = Number(pulse?.healing_velocity ?? 0) <= -5;
  const funnelPeak = useMemo(
    () => Math.max(1, ...dailyFunnel.map((point) => Number(point.landingViewed ?? 0))),
    [dailyFunnel]
  );
  const visibleSupportTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase();
    const filtered = supportTickets.filter((ticket) => {
      if (ticketVisibility === "open" && ticket.status !== "open") return false;
      if (ticketVisibility === "linked" && !getTicketUserId(ticket.metadata)) return false;
      if (!query) return true;
      const email = ticket.metadata?.email ? String(ticket.metadata.email) : "";
      const reference = ticket.metadata?.reference ? String(ticket.metadata.reference) : "";
      const blob = `${ticket.title} ${ticket.message} ${email} ${reference}`.toLowerCase();
      return blob.includes(query);
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const aTime = a.createdAt ?? 0;
      const bTime = b.createdAt ?? 0;
      if (ticketSort === "oldest") return aTime - bTime;
      if (ticketSort === "priority") {
        const priorityDelta = getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
      }
      return bTime - aTime;
    });
    return sorted;
  }, [supportTickets, ticketVisibility, ticketSort, ticketSearch]);
  const openSupportTicketCount = useMemo(
    () => supportTickets.filter((ticket) => ticket.status === "open").length,
    [supportTickets]
  );
  const linkedSupportTicketCount = useMemo(
    () => supportTickets.filter((ticket) => Boolean(getTicketUserId(ticket.metadata))).length,
    [supportTickets]
  );
  const visibleSupportTicketIds = useMemo(
    () => visibleSupportTickets.map((ticket) => ticket.id),
    [visibleSupportTickets]
  );
  const visibleOpenTicketIds = useMemo(
    () => visibleSupportTickets.filter((ticket) => ticket.status === "open").map((ticket) => ticket.id),
    [visibleSupportTickets]
  );
  const visibleLinkedTicketIds = useMemo(
    () => visibleSupportTickets.filter((ticket) => Boolean(getTicketUserId(ticket.metadata))).map((ticket) => ticket.id),
    [visibleSupportTickets]
  );
  const selectedVisibleTicketCount = useMemo(
    () => visibleSupportTicketIds.filter((ticketId) => selectedTicketIds.includes(ticketId)).length,
    [selectedTicketIds, visibleSupportTicketIds]
  );
  const selectedTickets = useMemo(
    () => supportTickets.filter((ticket) => selectedTicketIds.includes(ticket.id)),
    [supportTickets, selectedTicketIds]
  );

  function toggleTicketSelection(ticketId: string) {
    setSelectedTicketIds((current) =>
      current.includes(ticketId) ? current.filter((value) => value !== ticketId) : [...current, ticketId]
    );
  }

  function selectVisibleTickets() {
    setSelectedTicketIds(visibleSupportTicketIds);
  }

  function selectVisibleOpenTickets() {
    setSelectedTicketIds(visibleOpenTicketIds);
  }

  function selectVisibleLinkedTickets() {
    setSelectedTicketIds(visibleLinkedTicketIds);
  }

  function clearSelectedTickets() {
    setSelectedTicketIds([]);
  }

  function applyTicketUpdates(updatedTickets: SupportTicket[]) {
    const updatesById = new Map(updatedTickets.map((ticket) => [ticket.id, ticket]));
    setSupportTickets((current) =>
      current.map((ticket) => {
        const updated = updatesById.get(ticket.id);
        return updated
          ? {
            ...ticket,
            ...updated,
            metadata: ticket.metadata ?? updated.metadata
          }
          : ticket;
      })
    );
    setSelectedTicketIds((current) => current.filter((ticketId) => !updatesById.has(ticketId)));
  }

  async function generateContentFromPulse() {
    try {
      if (!pulse) return;
      setContentLoading(true);
      const accessToken = await getAdminAccessToken();

      const response = await fetch("/api/admin?path=radar-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ pulse })
      });

      const body = (await response.json()) as RadarContentResponse;
      if (!response.ok || body?.is_live !== true) {
        throw new Error(body?.error || "Content oracle is currently unavailable");
      }

      const ideas = Array.isArray(body?.ideas) ? body.ideas : [];
      setContentIdeas(ideas.slice(0, 3));
      setContentInsight(typeof body?.insight === "string" ? body.insight : "");
      setContentMeta({
        model: typeof body?.model === "string" ? body.model : "unknown",
        usedFallback: Boolean(body?.usedFallback)
      });
      console.warn("[RadarContentOracle] ideas_generated", { ideas, model: body?.model, usedFallback: body?.usedFallback });
    } catch (err: unknown) {
      setContentIdeas([]);
      setContentInsight("");
      setContentMeta(null);
      setError(toErrorMessage(err, "Failed to generate content ideas"));
    } finally {
      setContentLoading(false);
    }
  }

  async function requestPremiumGrant(userId: string, accessToken: string) {
    const response = await fetch("/api/admin?path=radar-grants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ userId })
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.error || "Grant failed");
    }
    return body;
  }

  async function requestTicketStatusUpdate(
    ticketId: string,
    status: "open" | "in_progress" | "resolved",
    accessToken: string
  ): Promise<SupportTicket> {
    const response = await fetch("/api/admin?path=overview&kind=support-tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        action: "update-status",
        id: ticketId,
        status
      })
    });

    const body = await response.json();
    if (!response.ok || !body?.ticket) {
      throw new Error(body?.error || "Ticket update failed");
    }

    return toSupportTicket(body.ticket as Record<string, unknown>);
  }

  async function grantPremiumAccess() {
    try {
      const userId = grantUserId.trim();
      if (!userId) {
        setGrantResult("userId is required.");
        return;
      }

      setGrantLoading(true);
      setGrantResult(null);
      const accessToken = await getAdminAccessToken();
      const body = await requestPremiumGrant(userId, accessToken);

      setGrantResult(`Premium granted successfully for user: ${userId}`);
      console.warn("[AdminRadar] manual_premium_grant_success", { userId, body });
    } catch (err: unknown) {
      const message = toErrorMessage(err, "Grant failed");
      setGrantResult(`Grant failed: ${message}`);
    } finally {
      setGrantLoading(false);
    }
  }

  async function updateTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved") {
    try {
      setTicketActionId(ticketId);
      setTicketNotice(null);
      const accessToken = await getAdminAccessToken();
      const updatedTicket = await requestTicketStatusUpdate(ticketId, status, accessToken);
      applyTicketUpdates([updatedTicket]);
      setTicketNotice(`Updated 1 ticket to ${status}.`);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to update payment proof status"));
    } finally {
      setTicketActionId(null);
    }
  }

  async function grantAndResolveTicket(ticket: SupportTicket) {
    const userId = getTicketUserId(ticket.metadata);
    if (!userId) {
      setError("This payment proof is not linked to an authenticated user yet.");
      return;
    }

    try {
      setTicketActionId(ticket.id);
      setGrantResult(null);
      setTicketNotice(null);
      const accessToken = await getAdminAccessToken();
      await requestPremiumGrant(userId, accessToken);
      const updatedTicket = await requestTicketStatusUpdate(ticket.id, "resolved", accessToken);
      applyTicketUpdates([updatedTicket]);
      setTicketNotice(`Granted premium and resolved 1 ticket.`);
      setGrantResult(`Premium granted and ticket resolved for user: ${userId}`);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to grant premium and resolve ticket"));
    } finally {
      setTicketActionId(null);
    }
  }

  async function bulkUpdateTicketStatus(status: "open" | "in_progress" | "resolved") {
    if (selectedTicketIds.length === 0) {
      setTicketNotice("Select at least one ticket first.");
      return;
    }

    try {
      setBulkActionLoading(true);
      setTicketNotice(null);
      const accessToken = await getAdminAccessToken();
      const results = await Promise.allSettled(
        selectedTicketIds.map((ticketId) => requestTicketStatusUpdate(ticketId, status, accessToken))
      );
      const updatedTickets = results
        .filter((result): result is PromiseFulfilledResult<SupportTicket> => result.status === "fulfilled")
        .map((result) => result.value);
      const failedCount = results.length - updatedTickets.length;

      if (updatedTickets.length > 0) applyTicketUpdates(updatedTickets);
      setTicketNotice(`Updated ${updatedTickets.length} ticket(s) to ${status}.${failedCount ? ` Failed: ${failedCount}.` : ""}`);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to bulk update payment proof status"));
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function bulkGrantAndResolve() {
    const tickets = supportTickets.filter((ticket) => selectedTicketIds.includes(ticket.id));
    const actionableTickets = tickets.filter((ticket) => {
      const userId = getTicketUserId(ticket.metadata);
      return Boolean(userId) && ticket.status !== "resolved";
    });

    if (actionableTickets.length === 0) {
      setTicketNotice("No linked unresolved tickets selected.");
      return;
    }

    try {
      setBulkActionLoading(true);
      setTicketNotice(null);
      const accessToken = await getAdminAccessToken();
      const results = await Promise.allSettled(
        actionableTickets.map(async (ticket) => {
          const userId = getTicketUserId(ticket.metadata);
          if (!userId) throw new Error("Missing user id");
          await requestPremiumGrant(userId, accessToken);
          return await requestTicketStatusUpdate(ticket.id, "resolved", accessToken);
        })
      );
      const updatedTickets = results
        .filter((result): result is PromiseFulfilledResult<SupportTicket> => result.status === "fulfilled")
        .map((result) => result.value);
      const failedCount = results.length - updatedTickets.length;

      if (updatedTickets.length > 0) applyTicketUpdates(updatedTickets);
      setTicketNotice(
        `Granted premium and resolved ${updatedTickets.length} ticket(s).${failedCount ? ` Failed: ${failedCount}.` : ""}`
      );
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to bulk grant premium and resolve tickets"));
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function bulkCopySelectedEmails() {
    const emails = Array.from(
      new Set(
        selectedTickets
          .map((ticket) => (ticket.metadata?.email ? String(ticket.metadata.email).trim() : ""))
          .filter(Boolean)
      )
    );

    if (emails.length === 0) {
      setTicketNotice("No emails found in the selected tickets.");
      return;
    }

    await copyTextValue(emails.join("\n"), setTicketNotice);
    setTicketNotice(`Copied ${emails.length} email(s).`);
  }

  async function bulkCopySelectedUserIds() {
    const userIds = Array.from(
      new Set(
        selectedTickets
          .map((ticket) => getTicketUserId(ticket.metadata) ?? "")
          .filter(Boolean)
      )
    );

    if (userIds.length === 0) {
      setTicketNotice("No linked user ids found in the selected tickets.");
      return;
    }

    await copyTextValue(userIds.join("\n"), setTicketNotice);
    setTicketNotice(`Copied ${userIds.length} user id(s).`);
  }

  async function bulkCopySelectedReferences() {
    const references = Array.from(
      new Set(
        selectedTickets
          .map((ticket) => (ticket.metadata?.reference ? String(ticket.metadata.reference).trim() : ""))
          .filter(Boolean)
      )
    );

    if (references.length === 0) {
      setTicketNotice("No references found in the selected tickets.");
      return;
    }

    await copyTextValue(references.join("\n"), setTicketNotice);
    setTicketNotice(`Copied ${references.length} reference(s).`);
  }

  function exportSelectedTicketsCsv() {
    if (selectedTickets.length === 0) {
      setTicketNotice("Select at least one ticket first.");
      return;
    }

    const header = [
      "ticket_id",
      "title",
      "status",
      "priority",
      "created_at",
      "updated_at",
      "email",
      "user_id",
      "method",
      "amount",
      "reference",
      "proof_name",
      "proof_size_bytes"
    ];

    const rows = selectedTickets.map((ticket) => {
      const proofImage = getProofImage(ticket.metadata);
      return [
        ticket.id,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.createdAt ? new Date(ticket.createdAt).toISOString() : "",
        ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : "",
        ticket.metadata?.email ? String(ticket.metadata.email) : "",
        getTicketUserId(ticket.metadata) ?? "",
        ticket.metadata?.method ? String(ticket.metadata.method) : "",
        ticket.metadata?.amount ? String(ticket.metadata.amount) : "",
        ticket.metadata?.reference ? String(ticket.metadata.reference) : "",
        proofImage?.name ?? "",
        proofImage?.bytes ?? ""
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");

    downloadBlobFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), `payment-proofs-${Date.now()}.csv`);
    setTicketNotice(`Exported ${selectedTickets.length} selected ticket(s) to CSV.`);
  }

  function exportSelectedTicketsJson() {
    if (selectedTickets.length === 0) {
      setTicketNotice("Select at least one ticket first.");
      return;
    }

    const payload = selectedTickets.map((ticket) => {
      const proofImage = getProofImage(ticket.metadata);
      const rawProofImage =
        ticket.metadata?.proof_image && typeof ticket.metadata.proof_image === "object"
          ? (ticket.metadata.proof_image as Record<string, unknown>)
          : null;

      return {
        ticket_id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : null,
        updated_at: ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : null,
        email: ticket.metadata?.email ? String(ticket.metadata.email) : null,
        user_id: getTicketUserId(ticket.metadata),
        method: ticket.metadata?.method ? String(ticket.metadata.method) : null,
        amount: ticket.metadata?.amount ? String(ticket.metadata.amount) : null,
        reference: ticket.metadata?.reference ? String(ticket.metadata.reference) : null,
        proof: {
          name: proofImage?.name ?? null,
          type: proofImage?.type ?? null,
          bytes: proofImage?.bytes ?? null,
          storage_path: proofImage?.storagePath ?? null,
          signed_url:
            rawProofImage?.signed_url && typeof rawProofImage.signed_url === "string"
              ? rawProofImage.signed_url
              : null,
          preview_url: proofImage?.previewUrl ?? null
        }
      };
    });

    downloadBlobFile(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }),
      `payment-proofs-${Date.now()}.json`
    );
    setTicketNotice(`Exported ${selectedTickets.length} selected ticket(s) to JSON.`);
  }

  function exportSelectedTicketsHtml() {
    if (selectedTickets.length === 0) {
      setTicketNotice("Select at least one ticket first.");
      return;
    }

    const cards = selectedTickets.map((ticket) => {
      const proofImage = getProofImage(ticket.metadata);
      const email = ticket.metadata?.email ? String(ticket.metadata.email) : "";
      const reference = ticket.metadata?.reference ? String(ticket.metadata.reference) : "";
      const method = ticket.metadata?.method ? String(ticket.metadata.method).replace(/_/g, " ") : "";
      const amount = ticket.metadata?.amount ? String(ticket.metadata.amount) : "";
      const userId = getTicketUserId(ticket.metadata) ?? "";
      const proofMarkup = proofImage?.previewUrl
        ? `
          <div class="proof">
            <img src="${escapeHtml(proofImage.previewUrl)}" alt="Proof for ${escapeHtml(ticket.title)}" />
            <div class="proof-meta">
              <span>${escapeHtml(proofImage.name ?? "proof image")}</span>
              <span>${escapeHtml(formatBytes(proofImage.bytes))}</span>
            </div>
          </div>
        `
        : '<div class="proof-empty">No proof preview available.</div>';

      return `
        <article class="card">
          <div class="card-head">
            <div>
              <h2>${escapeHtml(ticket.title)}</h2>
              <p>Created: ${escapeHtml(ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Unknown")}</p>
              <p>Updated: ${escapeHtml(ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "Unknown")}</p>
            </div>
            <div class="badges">
              <span>${escapeHtml(ticket.status)}</span>
              <span>${escapeHtml(ticket.priority)}</span>
              <span>${userId ? "linked" : "unlinked"}</span>
            </div>
          </div>
          <dl class="meta">
            <div><dt>Email</dt><dd>${escapeHtml(email || "unknown")}</dd></div>
            <div><dt>User</dt><dd>${escapeHtml(userId || "not linked")}</dd></div>
            <div><dt>Method</dt><dd>${escapeHtml(method || "unknown")}</dd></div>
            <div><dt>Amount</dt><dd>${escapeHtml(amount || "not provided")}</dd></div>
            <div><dt>Reference</dt><dd>${escapeHtml(reference || "screenshot only")}</dd></div>
          </dl>
          <pre>${escapeHtml(ticket.message)}</pre>
          ${proofMarkup}
        </article>
      `;
    }).join("\n");

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment Proof Review Sheet</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; padding: 24px; background: #07111f; color: #e5eef5; font: 14px/1.6 system-ui, sans-serif; }
      h1 { margin: 0 0 8px; font-size: 28px; }
      p.lead { margin: 0 0 24px; color: #9fb1c1; }
      .grid { display: grid; gap: 16px; }
      .card { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); border-radius: 20px; padding: 18px; break-inside: avoid; }
      .card-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
      .card h2 { margin: 0 0 8px; font-size: 20px; }
      .card p { margin: 0; color: #9fb1c1; }
      .badges { display: flex; gap: 8px; flex-wrap: wrap; }
      .badges span { border: 1px solid rgba(45,212,191,0.25); background: rgba(45,212,191,0.1); color: #b8fff2; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
      .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin: 16px 0; }
      .meta div { border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.18); border-radius: 14px; padding: 10px; }
      .meta dt { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #8aa0b5; margin-bottom: 4px; }
      .meta dd { margin: 0; word-break: break-word; }
      pre { margin: 0 0 16px; padding: 14px; border-radius: 14px; background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.08); white-space: pre-wrap; word-break: break-word; font: 12px/1.6 ui-monospace, monospace; }
      .proof { border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; background: rgba(0,0,0,0.22); }
      .proof img { display: block; width: 100%; max-height: 360px; object-fit: contain; background: #02060d; }
      .proof-meta { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; font-size: 12px; color: #9fb1c1; }
      .proof-empty { padding: 14px; border-radius: 14px; background: rgba(0,0,0,0.18); color: #9fb1c1; }
      @media print {
        body { background: white; color: black; }
        .card { background: white; border-color: #d0d7de; }
        .meta div, pre, .proof, .proof-empty { background: #f8fafc; border-color: #d0d7de; color: black; }
        .badges span { color: black; border-color: #9fb1c1; background: #eef2f7; }
      }
    </style>
  </head>
  <body>
    <h1>Payment Proof Review Sheet</h1>
    <p class="lead">Generated ${escapeHtml(new Date().toLocaleString())}  ${escapeHtml(String(selectedTickets.length))} selected ticket(s)</p>
    <section class="grid">
      ${cards}
    </section>
  </body>
</html>`;

    downloadBlobFile(
      new Blob([html], { type: "text/html;charset=utf-8" }),
      `payment-proofs-review-${Date.now()}.html`
    );
    setTicketNotice(`Exported ${selectedTickets.length} selected ticket(s) to HTML review sheet.`);
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Admin</p>
            <h1 className="text-2xl md:text-3xl font-black">Architect&apos;s Radar</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Aggregated awareness telemetry only. No chat/message text.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-white/5 p-1 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("radar")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "radar"
                  ? "bg-[var(--vibrant-blue)] text-white shadow-lg shadow-blue-500/20"
                  : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              الرادار
            </button>
            <button
              onClick={() => setActiveTab("ops")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "ops"
                  ? "bg-[var(--soft-teal)] text-white shadow-lg shadow-teal-500/20"
                  : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              العمليات
            </button>
            <button
              onClick={() => setActiveTab("horus")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "horus"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              برج حورس
            </button>
            
            <div className="mx-2 h-4 w-px bg-white/10" />

            <button 
              onClick={() => loadRadar()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-black text-[var(--vibrant-blue)] transition-all hover:bg-white/10 active:scale-95 disabled:opacity-40"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "تزامن..." : "تحديث"}
            </button>
          </div>
        </header>

        {!loading && !error && showAnomaly && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <strong>اتبا:</strong> احدار جاع ف طاة اتعاف (Anomaly Detected). استعد تدخ.
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-[var(--color-text-muted)]">
            Loading awareness pulse...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && pulse && (
          <div className="space-y-6">
            {activeTab === "radar" && (
              <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Global Phoenix Index</p>
              <p className="mt-3 text-4xl font-black">{Number(pulse.global_phoenix_avg).toFixed(2)}</p>
              <p className={`mt-2 text-sm ${pulse.healing_velocity >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {pulse.healing_velocity >= 0 ? "" : ""} {formatSigned(pulse.healing_velocity)} / day
              </p>
              <div className="mt-3">
                {trendPath ? (
                  <svg viewBox="0 0 220 64" className="w-full h-16">
                    <path d={trendPath} fill="none" stroke="var(--soft-teal)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">Trend builds after next refresh.</p>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Kinetic Heatmap</p>
              <div className="mt-4 space-y-3">
                {kineticBars.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>{item.key}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <RefProgressBar
                        className={styles.dynamicBar}
                        width={`${item.percent}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">System Empathy Load</p>
              <p className="mt-3 text-4xl font-black">{Number(pulse.ai_workload_avg).toFixed(0)}ms</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Generated: {new Date(pulse.generated_at).toLocaleString()}
              </p>
            </article>
          </section>
        )}

        {activeTab === "ops" && (
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[var(--vibrant-blue)]/20 bg-[var(--vibrant-blue)]/5 p-5 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--vibrant-blue)] font-bold">System Vitals</p>
              <div className="mt-4">
                <SystemHealthRadar api={apiStats} probe={probeStatus} status={healthStatus} />
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Gate Drop-off Radar</p>
              <div className="mt-4">
                <GateFunnelRadar stats={gateFunnel} />
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Revenue Diagnostics</p>
              <div className="mt-4">
                <RevenueFunnelRadar stats={gateFunnel} />
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Diagnosis Funnel</p>
              <div className="mt-4">
                <DiagnosisFunnelRadar stats={gateFunnel} />
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Onboarding Journey</p>
              <div className="mt-4">
                <OnboardingFunnelRadar stats={gateFunnel} />
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Deep Engagement</p>
              <div className="mt-4">
                <EngagementRadar stats={gateFunnel} />
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--soft-teal)]/20 bg-[var(--soft-teal)]/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--soft-teal)] font-bold">A/B Variant Comparison</p>
              <div className="mt-4">
                <VariantPerformanceRadar stats={gateFunnel} />
              </div>
            </article>

            <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 md:col-span-1 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold">Behavioral Analysis</p>
                <p className="mt-2 text-sm text-emerald-200/60 leading-relaxed">
                  Deep-dive into visual session recordings and heatmaps via Microsoft Clarity.
                </p>
              </div>
              <a 
                href="https://clarity.microsoft.com/projects" 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Open Clarity Radar
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Daily Conversion Funnel</p>
              <div className="mt-4 space-y-2">
                {dailyFunnel.length === 0 && (
                  <p className="text-sm text-[var(--color-text-muted)]">No daily funnel data yet.</p>
                )}
                {dailyFunnel.map((point) => (
                  <div key={point.date} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>{point.date}</span>
                      <span>{point.paymentSuccessRatePct.toFixed(1)}% success</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                      <RefProgressBar
                        className={styles.dynamicBar}
                        width={`${Math.min((point.landingViewed / funnelPeak) * 100, 100)}%`}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-300">
                      L:{point.landingViewed}  F:{point.ctaFreeClicked}  A:{point.ctaActivationClicked}  V:{point.activationPageViewed}  P:{point.paymentSuccess}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Weekly One Decision</p>
              {oneDecision ? (
                <div className="mt-3 space-y-2">
                  <p className="text-base font-black text-amber-200">{oneDecision.title}</p>
                  <p className="text-sm text-slate-300">{oneDecision.action}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{oneDecision.metric}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">Decision model is warming up.</p>
              )}
            </article>

                {/* Content Oracle */}
                <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Content Oracle</p>
                      <p className="text-sm text-[var(--color-text-muted)]">ح بض اع اجع إ أفار Reels فرة.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void generateContentFromPulse(); }}
                      disabled={contentLoading}
                      className="px-4 py-2 rounded-xl bg-[var(--soft-teal)] text-slate-950 text-sm font-bold disabled:opacity-60"
                    >
                      {contentLoading ? "جارٍ اتح..." : "است حت  اع اجع"}
                    </button>
                  </div>

                  {contentInsight && (
                    <p className="mt-4 text-sm text-amber-200">{contentInsight}</p>
                  )}

                  {contentIdeas.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {contentIdeas.map((idea, idx) => (
                        <div key={`${idx}-${idea}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                          {idx + 1}. {idea}
                        </div>
                      ))}
                    </div>
                  )}

                  {contentMeta && (
                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                      model: {contentMeta.model} {contentMeta.usedFallback ? "(fallback)" : ""}
                    </p>
                  )}
                </article>
              </section>
            )}

            {activeTab === "ops" && (
              <section className="grid gap-4 md:grid-cols-3">

            {/* TikTok Integration Demo Button */}
            <article className="rounded-2xl border border-[var(--vibrant-blue)]/20 bg-[var(--vibrant-blue)]/5 p-5 md:col-span-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--vibrant-blue)] font-bold">TikTok Analytics Integration</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    Connect your TikTok account to sync views and engagement data for Alrehla content directly into the Ops dashboard.
                  </p>
                </div>
                <a
                  href="https://www.tiktok.com/v2/auth/authorize/?client_key=sbawhmjasvky36kjpx&response_type=code&scope=user.info.basic,video.list&redirect_uri=https://www.alrehla.app/api/tiktok/callback&state=demo"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform text-center"
                >
                  Connect TikTok
                </a>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Manual Payment Proofs</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Latest activation proofs with image preview, payment metadata, and quick status actions.</p>
                </div>
                <div className="min-w-[220px] flex-1 md:max-w-xs">
                  <input
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search by email or reference"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTicketVisibility("open")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${ticketVisibility === "open"
                        ? "border-teal-400/30 bg-teal-400/15 text-teal-100"
                        : "border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10"
                      }`}
                  >
                    Open only ({openSupportTicketCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketVisibility("linked")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${ticketVisibility === "linked"
                        ? "border-teal-400/30 bg-teal-400/15 text-teal-100"
                        : "border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10"
                      }`}
                  >
                    Linked only
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketVisibility("all")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${ticketVisibility === "all"
                        ? "border-teal-400/30 bg-teal-400/15 text-teal-100"
                        : "border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10"
                      }`}
                  >
                    All ({supportTickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketSort("newest")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${ticketSort === "newest"
                        ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10"
                      }`}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketSort("oldest")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${ticketSort === "oldest"
                        ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10"
                      }`}
                  >
                    Oldest
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketSort("priority")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${ticketSort === "priority"
                        ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
                        : "border-white/10 bg-white/5 text-[var(--color-text-muted)] hover:bg-white/10"
                      }`}
                  >
                    High priority
                  </button>

                  <button
                    type="button"
                    onClick={() => loadRadar(false)}
                    className="flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-400/5 px-3 py-1 text-xs font-semibold text-teal-200 transition-colors hover:bg-teal-400/15"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              {ticketNotice && (
                <p className="mt-3 text-xs text-emerald-200">{ticketNotice}</p>
              )}

              {visibleSupportTickets.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                    Open: {openSupportTicketCount}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                    Linked: {linkedSupportTicketCount}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                    Selected: {selectedTicketIds.length}
                  </span>
                  <button
                    type="button"
                    onClick={selectVisibleTickets}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Select visible ({visibleSupportTicketIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={selectVisibleOpenTickets}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Select open visible ({visibleOpenTicketIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={selectVisibleLinkedTickets}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Select linked visible ({visibleLinkedTicketIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedTickets}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    onClick={() => { void bulkCopySelectedEmails(); }}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bulk copy emails
                  </button>
                  <button
                    type="button"
                    onClick={() => { void bulkCopySelectedUserIds(); }}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bulk copy user ids
                  </button>
                  <button
                    type="button"
                    onClick={() => { void bulkCopySelectedReferences(); }}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bulk copy references
                  </button>
                  <button
                    type="button"
                    onClick={exportSelectedTicketsCsv}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export selected CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportSelectedTicketsJson}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export selected JSON
                  </button>
                  <button
                    type="button"
                    onClick={exportSelectedTicketsHtml}
                    disabled={selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export review HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => { void bulkUpdateTicketStatus("in_progress"); }}
                    disabled={bulkActionLoading || selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bulk in progress
                  </button>
                  <button
                    type="button"
                    onClick={() => { void bulkUpdateTicketStatus("resolved"); }}
                    disabled={bulkActionLoading || selectedTicketIds.length === 0}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bulk resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => { void bulkGrantAndResolve(); }}
                    disabled={bulkActionLoading || selectedTicketIds.length === 0}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bulk grant + resolve
                  </button>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Selected: {selectedVisibleTicketCount}/{visibleSupportTicketIds.length}
                  </span>
                </div>
              )}

              {visibleSupportTickets.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                  {supportTickets.length === 0
                    ? "No payment proofs have been submitted yet."
                    : "No payment proofs match the current filter."}
                </p>
              ) : (
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  {visibleSupportTickets.map((ticket) => {
                    const proofImage = getProofImage(ticket.metadata);
                    const email = ticket.metadata?.email ? String(ticket.metadata.email) : null;
                    const amount = ticket.metadata?.amount ? String(ticket.metadata.amount) : null;
                    const reference = ticket.metadata?.reference ? String(ticket.metadata.reference) : null;
                    const proofMethod = ticket.metadata?.method ? String(ticket.metadata.method).replace(/_/g, " ") : null;
                    const userId = getTicketUserId(ticket.metadata);
                    const claritySessionId = ticket.metadata?.clarity_session_id ? String(ticket.metadata.clarity_session_id) : null;

                    return (
                      <section key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedTicketIds.includes(ticket.id)}
                              onChange={() => toggleTicketSelection(ticket.id)}
                              aria-label={`Select payment proof ${ticket.title}`}
                              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5"
                            />
                            <div>
                              <p className="text-base font-black text-white">{ticket.title}</p>
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Unknown time"}
                              </p>
                              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                                Updated: {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "Unknown"}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
                            {getSupportTicketLabel(ticket)}
                          </span>
                          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                            <span
                              className={`rounded-full border px-2 py-1 ${userId
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                                  : "border-rose-400/20 bg-rose-400/10 text-rose-100"
                                }`}
                            >
                              {userId ? "Linked" : "Unlinked"}
                            </span>
                            <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-2 py-1 text-teal-200">{ticket.status}</span>
                            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-amber-200">{ticket.priority}</span>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                          <p><span className="text-[var(--color-text-muted)]">Method:</span> {proofMethod ?? "unknown"}</p>
                          <p><span className="text-[var(--color-text-muted)]">Email:</span> {email ?? "unknown"}</p>
                          <p><span className="text-[var(--color-text-muted)]">Amount:</span> {amount ?? "not provided"}</p>
                          <p><span className="text-[var(--color-text-muted)]">Reference:</span> {reference ?? "screenshot only"}</p>
                          <p><span className="text-[var(--color-text-muted)]">User:</span> {userId ?? "not linked"}</p>
                        </div>

                        <p className="mt-3 whitespace-pre-line break-words rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
                          {ticket.message}
                        </p>

                        {proofImage?.previewUrl && (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
                            <img
                              src={proofImage.previewUrl}
                              alt={`Payment proof for ${ticket.title}`}
                              className="h-56 w-full object-cover"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-[11px] text-[var(--color-text-muted)]">
                              <span>{proofImage.name ?? "proof image"}</span>
                              <span>{formatBytes(proofImage.bytes)}</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {email && (
                            <button
                              type="button"
                              onClick={() => { void copyTextValue(email, setTicketNotice); }}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                            >
                              Copy email
                            </button>
                          )}
                          {userId && (
                            <button
                              type="button"
                              onClick={() => { void copyTextValue(userId, setTicketNotice); }}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                            >
                              Copy user id
                            </button>
                          )}
                          {userId && ticket.status !== "resolved" && (
                            <button
                              type="button"
                              onClick={() => { void grantAndResolveTicket(ticket); }}
                              disabled={ticketActionId === ticket.id}
                              className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Grant + Resolve
                            </button>
                          )}
                          {(["open", "in_progress", "resolved"] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => { void updateTicketStatus(ticket.id, status); }}
                              disabled={ticketActionId === ticket.id || ticket.status === status}
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {status}
                            </button>
                          ))}
                          {proofImage?.previewUrl && (
                            <a
                              href={proofImage.previewUrl || undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-xs font-semibold text-teal-100 transition-colors hover:bg-teal-400/20"
                            >
                              Open proof
                            </a>
                          )}
                          {!proofImage?.previewUrl && proofImage?.storagePath && (
                            <button
                              type="button"
                              onClick={() => { void getSecureProofUrl(proofImage.storagePath!); }}
                              className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 transition-all hover:bg-amber-400/20 active:scale-95"
                            >
                              Generate Secure Preview
                            </button>
                          )}
                          {claritySessionId && runtimeEnv.clarityProjectId && (
                            <a
                              href={`https://clarity.microsoft.com/projects/view/${runtimeEnv.clarityProjectId}/sessions/${claritySessionId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-100 transition-all hover:bg-indigo-500/20 hover:scale-[1.02]"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                              </svg>
                              Watch Session
                            </a>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5 md:col-span-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Manual Subscription Activation</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                تفع د اشترا (100 token / 21 day) عبر RPC `grant_premium_access`.
              </p>
              <div className="mt-4 flex flex-col md:flex-row gap-3">
                <input
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  placeholder="user uuid"
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => { void grantPremiumAccess(); }}
                  disabled={grantLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold disabled:opacity-60"
                >
                  {grantLoading ? "جارٍ اتفع..." : "تفع د"}
                </button>
              </div>
              {grantResult && (
                <p className="mt-3 text-sm text-emerald-200">{grantResult}</p>
              )}
            </article>
          </section>
        )}

        {activeTab === "horus" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <MarkazScreen />
          </section>
        )}
      </div>
    )}
    </div>
    </main>
  );
}
